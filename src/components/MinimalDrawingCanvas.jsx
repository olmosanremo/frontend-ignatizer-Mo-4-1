// MinimalDrawingCanvas.jsx
import React, { useEffect, useState } from 'react';

const MinimalDrawingCanvas = ({ canvasRef, lines, setLines, color, isErasing }) => {
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentLine, setCurrentLine] = useState([]);

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
        </div>
    );
};

export default MinimalDrawingCanvas;
