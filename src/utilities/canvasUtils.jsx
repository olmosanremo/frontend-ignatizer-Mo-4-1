export const getCoordinates = (event, canvas) => {
    const rect = canvas.getBoundingClientRect();
    let x, y;
    if (event.touches) {
        x = event.touches[0].clientX - rect.left;
        y = event.touches[0].clientY - rect.top;
    } else {
        x = event.clientX - rect.left;
        y = event.clientY - rect.top;
    }
    return { x, y };
};

export const drawSmoothLine = (canvas, allLines) => {
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.lineWidth = 2;

    allLines.forEach(points => {
        if (points.length > 0) {
            context.strokeStyle = points[0].color;
        }
        context.beginPath();
        if (points.length < 3) {
            const b = points[0];
            context.moveTo(b.x, b.y);
            context.lineTo(points[points.length - 1].x, points[points.length - 1].y);
            context.stroke();
            context.closePath();
            return;
        }

        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i === 0 ? i : i - 1];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = points[i + 2 > points.length - 1 ? points.length - 1 : i + 2];

            const cp1x = p1.x + (p2.x - p0.x) / 6;
            const cp1y = p1.y + (p2.y - p0.y) / 6;

            const cp2x = p2.x - (p3.x - p1.x) / 6;
            const cp2y = p2.y - (p3.y - p1.y) / 6;

            context.moveTo(p1.x, p1.y);
            context.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
        }

        context.stroke();
    });
};
