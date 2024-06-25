import React from 'react';

const SoundControls = ({ isPlaying, isPaused, playPauseSound, stopSound }) => {
    return (
        <div>
            <button onClick={playPauseSound}>
                {isPlaying && !isPaused ? 'Pause Sound' : 'Play Sound'}
            </button>
            <button onClick={stopSound} disabled={!isPlaying}>Stop Sound</button>
        </div>
    );
};

export default SoundControls;
