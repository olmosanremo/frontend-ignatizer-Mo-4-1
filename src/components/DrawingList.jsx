// DrawingList.jsx
import React from 'react';

const DrawingList = ({ drawings, onLoad, onDelete }) => {
    return (
        <div>
            <h2>All Drawings</h2>
            <ul>
                {drawings.map(drawing => (
                    <li key={drawing._id} onClick={() => onLoad(drawing._id)} style={{ cursor: 'pointer' }}>
                        {drawing.name} (ID: {drawing._id})
                        <button onClick={(e) => { e.stopPropagation(); onDelete(drawing._id); }}>Delete</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default DrawingList;
