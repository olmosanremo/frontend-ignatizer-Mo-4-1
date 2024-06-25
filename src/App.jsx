// App.jsx
import React, { useState, useEffect, useRef } from 'react';
import MinimalDrawingCanvas from './components/MinimalDrawingCanvas';
import ControlPanel from './components/ControlPanel';
import DrawingList from './components/DrawingList';
import SplashScreen from './components/SplashScreen';
import SoundControls from './components/SoundControls';
import * as Tone from 'tone';
import { saveDrawing, loadDrawing, updateDrawing, getAllDrawings, deleteDrawing } from './backendApi/api';
import './App.css';

const App = () => {
    const [lines, setLines] = useState({ red: [], yellow: [], green: [] });
    const [color, setColor] = useState('red');
    const [isErasing, setIsErasing] = useState(false);
    const [trackName, setTrackName] = useState('');
    const [originalTrackName, setOriginalTrackName] = useState('');
    const [drawings, setDrawings] = useState([]);
    const [isDrawingListVisible, setIsDrawingListVisible] = useState(false);
    const [showSplash, setShowSplash] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const canvasRef = useRef(null);

    const toggleEraseMode = () => {
        setIsErasing(!isErasing);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowSplash(false);
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    const handleSave = async () => {
        if (!trackName) {
            alert('Please enter a name for the drawing.');
            return;
        }

        try {
            if (trackName === originalTrackName) {
                await updateDrawing(trackName, lines);
                alert('Drawing updated!');
            } else {
                await saveDrawing(trackName, lines);
                setOriginalTrackName(trackName);
                alert('Drawing saved!');
            }
            handleFetchDrawings();
        } catch (error) {
            alert('Error saving drawing.');
        }
    };

    const handleLoad = async (id) => {
        try {
            const drawing = await loadDrawing(id);
            if (drawing) {
                setLines(drawing.lines);
                setTrackName(drawing.name);
                setOriginalTrackName(drawing.name);
                setIsDrawingListVisible(false);
                handleFetchDrawings();
            } else {
                alert('Drawing not found!');
            }
        } catch (error) {
            alert('Error loading drawing.');
        }
    };

    const handleFetchDrawings = async () => {
        try {
            const allDrawings = await getAllDrawings();
            console.log('Fetched Drawings:', allDrawings);
            if (Array.isArray(allDrawings)) {
                setDrawings(allDrawings);
            } else {
                console.error('Unexpected response format:', allDrawings);
                alert('Unexpected response format.');
            }
        } catch (error) {
            alert('Error fetching drawings.');
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteDrawing(id);
            alert('Drawing deleted!');
            handleFetchDrawings();
        } catch (error) {
            alert('Error deleting drawing.');
        }
    };

    const clearDrawing = () => {
        setLines({ red: [], yellow: [], green: [] });
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

    useEffect(() => {
        handleFetchDrawings();
    }, []);

    return (
        <div>
            {showSplash && <SplashScreen />}
            {!showSplash && (
                <>
                    <div className="control-head">
                    <button onClick={() => setIsDrawingListVisible(true)}>Logo Button</button>
                    {isDrawingListVisible && (
                        <div className="modal">
                            <div className="modal-content">
                                <DrawingList
                                    drawings={drawings}
                                    onLoad={handleLoad}
                                    onDelete={handleDelete}
                                />
                                <button onClick={() => setIsDrawingListVisible(false)}>Close</button>
                            </div>
                        </div>
                    )}
                    <SoundControls
                        isPlaying={isPlaying}
                        playPauseSound={playPauseSound}
                        stopSound={stopSound}
                    />
                    </div>
                    <ControlPanel setColor={setColor} toggleEraseMode={toggleEraseMode} isErasing={isErasing} />
                    <input className="name-input-field"
                           type="text"
                           value={trackName}
                           onChange={(e) => setTrackName(e.target.value)}
                           placeholder="Enter track name"
                    />
                    <MinimalDrawingCanvas canvasRef={canvasRef} lines={lines} setLines={setLines} color={color} isErasing={isErasing} />
                    <div>
                        <button onClick={handleSave}>Save Drawing</button>
                        <button onClick={clearDrawing}>Clear Drawing</button>
                    </div>

                </>
            )}
        </div>
    );
};

export default App;
