// import React, { useEffect, useState } from 'react';
// import * as Tone from 'tone';
//
// const MinimalDrawingCanvas = ({ canvasRef, lines, setLines, color, isErasing }) => {
//     const [isDrawing, setIsDrawing] = useState(false);
//     const [currentLine, setCurrentLine] = useState([]);
//     const [isPlaying, setIsPlaying] = useState(false); // Zustand für die Wiedergabe
//
//     useEffect(() => {
//         const canvas = canvasRef.current;
//         const context = canvas.getContext('2d');
//         context.fillStyle = 'white';
//         context.fillRect(0, 0, canvas.width, canvas.height);
//     }, [canvasRef]);
//
//     const startDrawing = (event) => {
//         const { x, y } = getCoordinates(event, canvasRef.current);
//         setIsDrawing(true);
//         if (!isErasing) {
//             setCurrentLine([{ x, y, color }]);
//         } else {
//             erasePoints(x, y);
//         }
//     };
//
//     const endDrawing = () => {
//         setIsDrawing(false);
//         if (!isErasing) {
//             setLines([...lines, currentLine]);
//             setCurrentLine([]);
//         }
//         canvasRef.current.getContext('2d').beginPath();
//     };
//
//     const draw = (event) => {
//         if (!isDrawing) return;
//         const { x, y } = getCoordinates(event, canvasRef.current);
//         if (!isErasing) {
//             const newCurrentLine = [...currentLine, { x, y, color }];
//             setCurrentLine(newCurrentLine);
//             drawAllLines([...lines, newCurrentLine], canvasRef.current);
//         } else {
//             erasePoints(x, y);
//         }
//     };
//
//     const erasePoints = (x, y) => {
//         const eraserSize = 5;
//         const newLines = [];
//
//         lines.forEach(line => {
//             let newLine = [];
//             line.forEach(point => {
//                 if (Math.hypot(point.x - x, point.y - y) > eraserSize) {
//                     newLine.push(point);
//                 } else {
//                     if (newLine.length > 0) {
//                         newLines.push(newLine);
//                         newLine = [];
//                     }
//                 }
//             });
//             if (newLine.length > 0) {
//                 newLines.push(newLine);
//             }
//         });
//
//         setLines(newLines);
//         drawAllLines(newLines, canvasRef.current);
//     };
//
//     const drawAllLines = (lines, canvas) => {
//         const context = canvas.getContext('2d');
//         context.clearRect(0, 0, canvas.width, canvas.height);
//         lines.forEach(line => {
//             if (line.length > 0) {
//                 context.strokeStyle = line[0].color;
//                 context.beginPath();
//                 context.moveTo(line[0].x, line[0].y);
//                 for (let i = 1; i < line.length; i++) {
//                     context.lineTo(line[i].x, line[i].y);
//                 }
//                 context.stroke();
//             }
//         });
//     };
//
//     const getCoordinates = (event, canvas) => {
//         const rect = canvas.getBoundingClientRect();
//         const x = event.clientX - rect.left;
//         const y = event.clientY - rect.top;
//         return { x, y };
//     };
//
//     const playPauseSound = () => {
//         if (isPlaying) {
//             Tone.Transport.pause();
//         } else {
//             if (Tone.Transport.state === 'stopped') {
//                 Tone.Transport.cancel();
//                 Tone.Transport.position = 0;
//                 scheduleSounds();
//             }
//             Tone.Transport.start();
//         }
//         setIsPlaying(!isPlaying);
//     };
//
//     const scheduleSounds = () => {
//         const synths = {
//             red: new Tone.Synth().toDestination(),
//             yellow: new Tone.MembraneSynth().toDestination(),
//             green: new Tone.FMSynth().toDestination()
//         };
//
//         const totalTime = 30;
//         const minDuration = 0.05;
//         let lastScheduledTime = {
//             red: 0,
//             yellow: 0,
//             green: 0
//         };
//
//         lines.forEach((line, lineIndex) => {
//             line.forEach((point, index, arr) => {
//                 let time = (point.x / canvasRef.current.width) * totalTime;
//                 const freq = 100 + (canvasRef.current.height - point.y);
//                 const nextTime = (index < arr.length - 1) ? (arr[index + 1].x / canvasRef.current.width) * totalTime : time + 0.5;
//                 const duration = Math.max(nextTime - time, minDuration);
//
//                 const color = point.color || 'red';
//                 const synth = synths[color];
//
//                 if (time <= lastScheduledTime[color]) {
//                     time = lastScheduledTime[color] + minDuration;
//                 }
//                 lastScheduledTime[color] = time;
//
//                 console.log(`Scheduling note: line=${lineIndex}, point=${index}, color=${color}, freq=${freq}, time=${time}, duration=${duration}`);
//
//                 Tone.Transport.schedule((t) => {
//                     synth.triggerAttackRelease(freq, duration, t);
//                 }, time);
//
//                 if (index === arr.length - 1) {
//                     console.log(`Scheduling release at end of line: line=${lineIndex}, point=${index}, color=${color}, time=${time + duration}`);
//                     Tone.Transport.scheduleOnce((t) => {
//                         synth.triggerRelease(t);
//                         console.log(`Released: line=${lineIndex}, point=${index}, color=${color}, time=${t}`);
//                     }, time + duration);
//                 }
//
//                 // Ensure the synth is released after the last point of the last line
//                 if (lineIndex === lines.length - 1 && index === arr.length - 1) {
//                     Tone.Transport.scheduleOnce((t) => {
//                         synth.triggerRelease(t);
//                         console.log(`Released last note: line=${lineIndex}, point=${index}, color=${color}, time=${t}`);
//                     }, time + duration);
//                 }
//             });
//         });
//     };
//
//     const stopSound = () => {
//         Tone.Transport.stop();
//         setIsPlaying(false);
//     };
//
//     return (
//         <div>
//             <canvas
//                 ref={canvasRef}
//                 width={800}
//                 height={600}
//                 style={{ border: '1px solid black' }}
//                 onMouseDown={startDrawing}
//                 onMouseUp={endDrawing}
//                 onMouseMove={draw}
//             />
//             <button onClick={playPauseSound}>{isPlaying ? "Pause Sound" : "Play Sound"}</button>
//             <button onClick={stopSound}>Stop Sound</button>
//         </div>
//     );
// };
//
// export default MinimalDrawingCanvas;


import React, { useEffect, useState } from 'react';
import * as Tone from 'tone';

const MinimalDrawingCanvas = ({ canvasRef, lines, setLines, color, isErasing }) => {
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentLine, setCurrentLine] = useState([]);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);
        drawAllLines(lines, canvas);
    }, [canvasRef, lines]);

    const startDrawing = (event) => {
        const { x, y } = getCoordinates(event, canvasRef.current);
        setIsDrawing(true);
        if (!isErasing) {
            setCurrentLine([{ x, y }]);
        } else {
            erasePoints(x, y);
        }
    };

    const endDrawing = () => {
        setIsDrawing(false);
        if (!isErasing) {
            setLines({
                ...lines,
                [color]: [...lines[color], { points: currentLine }]
            });
            setCurrentLine([]);
        }
        canvasRef.current.getContext('2d').beginPath();
    };

    const draw = (event) => {
        if (!isDrawing) return;
        const { x, y } = getCoordinates(event, canvasRef.current);
        if (!isErasing) {
            const newCurrentLine = [...currentLine, { x, y }];
            setCurrentLine(newCurrentLine);
            drawAllLines({
                ...lines,
                [color]: [...lines[color], { points: newCurrentLine }]
            }, canvasRef.current);
        } else {
            erasePoints(x, y);
        }
    };

    const erasePoints = (x, y) => {
        const eraserSize = 5;
        const newLines = { red: [], yellow: [], green: [] };

        Object.keys(lines).forEach(color => {
            lines[color].forEach(line => {
                let newLine = [];
                line.points.forEach(point => {
                    if (Math.hypot(point.x - x, point.y - y) > eraserSize) {
                        newLine.push(point);
                    } else {
                        if (newLine.length > 0) {
                            newLines[color].push({ points: newLine });
                            newLine = [];
                        }
                    }
                });
                if (newLine.length > 0) {
                    newLines[color].push({ points: newLine });
                }
            });
        });

        setLines(newLines);
        drawAllLines(newLines, canvasRef.current);
    };

    const drawAllLines = (lines, canvas) => {
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
        Object.keys(lines).forEach(color => {
            lines[color].forEach(line => {
                if (line.points.length > 0) {
                    context.strokeStyle = color;
                    context.beginPath();
                    context.moveTo(line.points[0].x, line.points[0].y);
                    for (let i = 1; i < line.points.length; i++) {
                        context.lineTo(line.points[i].x, line.points[i].y);
                    }
                    context.stroke();
                }
            });
        });
    };

    const getCoordinates = (event, canvas) => {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        return { x, y };
    };

    const playPauseSound = () => {
        if (isPlaying) {
            Tone.Transport.pause();
        } else {
            if (Tone.Transport.state === 'stopped') {
                Tone.Transport.cancel();
                Tone.Transport.position = 0;
                scheduleSounds();
            }
            Tone.Transport.start();
        }
        setIsPlaying(!isPlaying);
    };

    const scheduleSounds = () => {
        const synths = {
            red: new Tone.Synth().toDestination(),
            yellow: new Tone.MembraneSynth().toDestination(),
            green: new Tone.FMSynth().toDestination()
        };

        const totalTime = 30;
        const minDuration = 0.05;
        let lastScheduledTime = {
            red: 0,
            yellow: 0,
            green: 0
        };

        Object.keys(lines).forEach(color => {
            lines[color].forEach((line, lineIndex) => {
                line.points.forEach((point, index, arr) => {
                    let time = (point.x / canvasRef.current.width) * totalTime;
                    const freq = 100 + (canvasRef.current.height - point.y);
                    const nextTime = (index < arr.length - 1) ? (arr[index + 1].x / canvasRef.current.width) * totalTime : time + 0.5;
                    const duration = Math.max(nextTime - time, minDuration);

                    const synth = synths[color];

                    if (time <= lastScheduledTime[color]) {
                        time = lastScheduledTime[color] + minDuration;
                    }
                    lastScheduledTime[color] = time;

                    console.log(`Scheduling note: color=${color}, line=${lineIndex}, point=${index}, freq=${freq}, time=${time}, duration=${duration}`);

                    Tone.Transport.schedule((t) => {
                        synth.triggerAttackRelease(freq, duration, t);
                    }, time);

                    if (index === arr.length - 1) {
                        console.log(`Scheduling release at end of line: color=${color}, line=${lineIndex}, point=${index}, time=${time + duration}`);
                        Tone.Transport.scheduleOnce((t) => {
                            synth.triggerRelease(t);
                            console.log(`Released: color=${color}, line=${lineIndex}, point=${index}, time=${t}`);
                        }, time + duration);
                    }

                    // Ensure the synth is released after the last point of the last line
                    if (lineIndex === lines[color].length - 1 && index === arr.length - 1) {
                        Tone.Transport.scheduleOnce((t) => {
                            synth.triggerRelease(t);
                            console.log(`Released last note: color=${color}, line=${lineIndex}, point=${index}, time=${t}`);
                        }, time + duration);
                    }
                });
            });
        });

        Tone.Transport.start();
    };

    const stopSound = () => {
        Tone.Transport.stop();
        setIsPlaying(false);
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
            />
            <button onClick={playPauseSound}>{isPlaying ? "Pause Sound" : "Play Sound"}</button>
            <button onClick={stopSound}>Stop Sound</button>
        </div>
    );
};

export default MinimalDrawingCanvas;

