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

    const polySynth = useRef(new Tone.PolySynth(Tone.Synth, {
        maxPolyphony: 12,
        options: {
            oscillator: {
                type: 'sine' // Verwenden Sie einen Sägezahn-Oszillator
            },
            envelope: {
                attack: 0.05,
                decay: 0.2,
                sustain: 0.7,
                release: 2
            },
            filter: {
                Q: 2,
                type: 'lowpass',
                frequency: 400,
                rolloff: -24
            },
            filterEnvelope: {
                attack: 0.9,
                decay: 0.7,
                sustain: 0.2,
                release: 1.9,
                baseFrequency: 300,
                octaves: 4,
                exponent: 2
            }
        }
    }).toDestination());

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
        const colors = ['red', 'yellow', 'green'];
        const totalTime = 30;
        const minDuration = 0.05;

        let lastScheduledTime = {
            red: 0,
            yellow: 0,
            green: 0
        };

        colors.forEach((color, index) => {
            lines[color].forEach((line, lineIndex) => {
                line.points.forEach((point, pointIndex, arr) => {
                    let time = (point.x / canvasRef.current.width) * totalTime;
                    const baseFreq = 100 + (canvasRef.current.height - point.y);
                    const nextTime = (pointIndex < arr.length - 1) ? (arr[pointIndex + 1].x / canvasRef.current.width) * totalTime : time + 0.5;
                    const duration = Math.max(nextTime - time, minDuration);

                    if (time <= lastScheduledTime[color]) {
                        time = lastScheduledTime[color] + minDuration;
                    }
                    lastScheduledTime[color] = time;

                    console.log(`Scheduling note: color=${color}, line=${lineIndex}, point=${pointIndex}, freq=${baseFreq}, time=${time}, duration=${duration}`);

                    if (color === 'green') {
                        // Trigger 5 slightly detuned voices for green color
                        const detuneValues = [-10, -5, 0, 17, 33];
                        detuneValues.forEach((detune, i) => {
                            Tone.Transport.schedule((t) => {
                                polySynth.current.triggerAttackRelease(baseFreq + detune, duration, t);
                            }, time + i * 0.01); // Slight delay between each voice
                        });
                    } else {
                        Tone.Transport.schedule((t) => {
                            polySynth.current.triggerAttackRelease(baseFreq, duration, t);
                        }, time);
                    }

                    if (pointIndex === arr.length - 1) {
                        Tone.Transport.scheduleOnce((t) => {
                            polySynth.current.triggerRelease([baseFreq], t);
                            console.log(`Released: color=${color}, line=${lineIndex}, point=${pointIndex}, time=${t}`);
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


