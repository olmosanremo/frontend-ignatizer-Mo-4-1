import React, { useEffect, useState } from 'react';
import { getCoordinates } from '../utilities/canvasUtils';
import * as Tone from 'tone';

const DrawingCanvas = ({ mode, color, onSave, canvasRef, lines, setLines, onRemove, currentMode }) => {
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentLine, setCurrentLine] = useState([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);
    }, [canvasRef]);

    useEffect(() => {
        setCurrentLine((prev) => prev.map(point => ({ ...point, color })));
    }, [color]);

    const startDrawing = (event) => {
        if (Tone.context.state !== 'running') {
            Tone.context.resume();
        }
        setIsDrawing(true);
        const { x, y } = getCoordinates(event, canvasRef.current);
        setCurrentLine([{ x, y, color }]);
    };

    const endDrawing = () => {
        setIsDrawing(false);
        if (currentMode === 'draw') {
            setLines([...lines, currentLine]);
        }
        setCurrentLine([]);
        canvasRef.current.getContext('2d').beginPath();
    };

    const draw = (event) => {
        if (!isDrawing) return;
        const { x, y } = getCoordinates(event, canvasRef.current);

        if (currentMode === 'draw') {
            const newCurrentLine = [...currentLine, { x, y, color }];
            setCurrentLine(newCurrentLine);
            const allLines = [...lines, newCurrentLine];
            const groupedLines = groupLinesByColor(allLines);
            drawAllLines(groupedLines, canvasRef.current);
        } else if (currentMode === 'erase') {
            erasePoints(x, y);
        }
    };

    const erasePoints = (x, y) => {
        const eraserSize = 5; // Kleineren Radiergummi-Radius verwenden
        const newLines = [];

        lines.forEach(line => {
            let newLine = [];
            line.forEach(point => {
                if (Math.abs(point.x - x) > eraserSize || Math.abs(point.y - y) > eraserSize) {
                    newLine.push(point);
                } else {
                    if (newLine.length > 0) {
                        newLines.push(newLine);
                        newLine = [];
                    }
                }
            });
            if (newLine.length > 0) {
                newLines.push(newLine);
            }
        });

        setLines(newLines); // Aktualisiert den Zustand mit den neuen Linien
        const groupedLines = groupLinesByColor(newLines);
        drawAllLines(groupedLines, canvasRef.current);
    };

    const drawAllLines = (groupedLines, canvas) => {
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);

        for (const color in groupedLines) {
            context.strokeStyle = color;
            context.beginPath();

            groupedLines[color].forEach(line => {
                if (line.length > 0) {
                    context.moveTo(line[0].x, line[0].y);
                    for (let i = 1; i < line.length; i++) {
                        context.lineTo(line[i].x, line[i].y);
                    }
                }
            });

            context.stroke();
        }
    };

    const groupLinesByColor = (lines) => {
        const groupedLines = {};

        lines.forEach(line => {
            if (line.length > 0) {
                const color = line[0].color;
                if (!groupedLines[color]) {
                    groupedLines[color] = [];
                }
                groupedLines[color].push(line);
            }
        });

        return groupedLines;
    };

    const handleSave = async () => {
        const name = prompt("Please enter a name for your drawing:");
        if (!name) return;

        try {
            const response = await onSave(lines, name);
            console.log('Save successful', response.data);
        } catch (error) {
            console.error('Error saving drawing', error);
        }
    };

    const playPauseSound = async () => {
        if (Tone.context.state !== 'running') {
            await Tone.context.resume();
        }

        await Tone.start();

        if (isPlaying) {
            if (isPaused) {
                Tone.Transport.start();
                setIsPaused(false);
            } else {
                Tone.Transport.pause();
                setIsPaused(true);
            }
            return;
        }

        Tone.Transport.cancel();

        const synths = {
            default: new Tone.Synth({
                oscillator: { type: 'sine' },
                envelope: {
                    attack: 0.1,
                    decay: 0.1,
                    sustain: 0.8,
                    release: 0.5
                }
            }).toDestination(),
            green: new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'fatsawtooth' },
                envelope: {
                    attack: 0.1,
                    decay: 0.1,
                    sustain: 0.8,
                    release: 0.5
                }
            }).toDestination()
        };

        const canvas = canvasRef.current;
        const height = canvas.height;
        const width = canvas.width;
        const totalTime = 30;
        const minDuration = 0.05;

        lines.forEach((line, lineIndex) => {
            line.forEach((point, index, arr) => {
                const time = (point.x / width) * totalTime;
                const freq = 100 + (height - point.y);
                const nextTime = (index < arr.length - 1) ? (arr[index + 1].x / width) * totalTime : time + 0.5;
                const duration = Math.max(nextTime - time, minDuration);

                const synth = point.color === 'green' ? synths.green : synths.default;

                console.log(`Scheduling note: line=${lineIndex}, point=${index}, freq=${freq}, time=${time}, duration=${duration}`);

                Tone.Transport.schedule((t) => {
                    synth.triggerAttackRelease(freq, duration, t);
                }, time);

                if (index === arr.length - 1) {
                    console.log(`Scheduling release at end of line: line=${lineIndex}, point=${index}, time=${time + duration}`);
                    Tone.Transport.scheduleOnce((t) => {
                        synth.triggerRelease();
                        console.log(`Released: line=${lineIndex}, point=${index}, time=${t}`);
                    }, time + duration);
                }

                // If it's the last line, release after the last note
                if (lineIndex === lines.length - 1 && index === arr.length - 1) {
                    Tone.Transport.scheduleOnce((t) => {
                        synth.triggerRelease();
                        console.log(`Released last note: line=${lineIndex}, point=${index}, time=${t}`);
                    }, time + duration);
                }
            });
        });

        Tone.Transport.start();
        setIsPlaying(true);
        setIsPaused(false);
    };

    return (
        <div>
            <canvas
                ref={canvasRef}
                width={800}
                height={600}
                style={{ border: '1px solid black' }}
                onMouseDown={startDrawing}
                onMouseUp={endDrawing}
                onMouseMove={draw}
                onTouchStart={startDrawing}
                onTouchEnd={endDrawing}
                onTouchMove={draw}
            />
            <button onClick={handleSave}>Save Drawing</button>
            <button onClick={onRemove}>Remove Track</button>
        </div>
    );
};

export default DrawingCanvas;