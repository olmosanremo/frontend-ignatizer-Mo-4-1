
import React from 'react';

// eslint-disable-next-line react/prop-types
const ColorButton = ({ color, onSelectColor }) => {
    return (
        <button
            onClick={() => onSelectColor(color)}
            style={{ backgroundColor: color, margin: '5px', padding: '10px' }}
        >
            {color}
        </button>
    );
};

export default ColorButton;
