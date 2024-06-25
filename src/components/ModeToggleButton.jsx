// src/components/ModeToggleButton.jsx
import React from 'react';

const ModeToggleButton = ({ toggleMode, currentMode }) => {
    return (
        <button onClick={toggleMode}>
            {currentMode === 'draw' ? 'Switch to Erase' : 'Switch to Draw'}
        </button>
    );
};

export default ModeToggleButton;
