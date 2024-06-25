// import React, { useState } from 'react';
//
// const StartPauseToggle = ({ onToggle }) => {
//     const [isPlaying, setIsPlaying] = useState(false);
//
//     const handleClick = () => {
//         setIsPlaying(!isPlaying);
//         onToggle(!isPlaying);
//     };
//
//     return (
//         <button onClick={handleClick}>
//             {isPlaying ? 'Pause' : 'Play'}
//         </button>
//     );
// };
//
// export default StartPauseToggle;



import React, { useState } from 'react';

const StartPauseToggle = ({ onToggle }) => {
    const [isPlaying, setIsPlaying] = useState(false);

    const handleClick = () => {
        setIsPlaying(!isPlaying);
        onToggle(!isPlaying);
    };

    return (
        <button onClick={handleClick}>
            {isPlaying ? 'Pause' : 'Play'}
        </button>
    );
};

export default StartPauseToggle;
