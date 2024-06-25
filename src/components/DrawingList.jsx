import React, { useState } from 'react';

const DrawingList = ({ drawings, onLoad, onDelete }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearch = (event) => {
        setSearchTerm(event.target.value);
    };

    const filteredDrawings = drawings.filter((drawing) =>
        drawing.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <h2>All Drawings</h2>
            <input
                type="text"
                placeholder="Search drawings..."
                value={searchTerm}
                onChange={handleSearch}
                className="search-input"
                style={{ marginBottom: '10px', padding: '5px', width: '100%' }}
            />
            <ul>
                {filteredDrawings.map(drawing => (
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
