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

    // Erstellen eines Limiters, um Clipping zu vermeiden
    const limiter = useRef(new Tone.Limiter(-6).toDestination()).current;

    // Erstellen von Reverbs mit unterschiedlichen Eigenschaften
    const reverb1 = useRef(new Tone.Reverb({
        decay: 3,
        preDelay: 0.01
    }).connect(limiter)).current;

    const reverb2 = useRef(new Tone.Reverb({
        decay: 5,
        preDelay: 0.02
    }).connect(limiter)).current;

    // Erstellen eines PolySynth mit angepassten Synth-Parametern und Hinzufügen des Limiters
    const createPolySynth = () => {
        return new Tone.PolySynth(Tone.Synth, {
            maxPolyphony: 8,
            options: {
                oscillator: {
                    type: 'sawtooth' // Verwenden eines Sägezahn-Oszillators
                },
                envelope: {
                    attack: 0.01, // Kürzere Attack-Zeit
                    decay: 0.2,
                    sustain: 0.7,
                    release: 5 // Verlängerte Release-Zeit
                },
                filter: {
                    Q: 2,
                    type: 'lowpass',
                    frequency: 800,
                    rolloff: -24
                },
                filterEnvelope: {
                    attack: 0.1,
                    decay: 0.3,
                    sustain: 0.5,
                    release: 5, // Verlängerte Release-Zeit
                    baseFrequency: 300,
                    octaves: 4,
                    exponent: 2
                }
            }
        }).connect(limiter);
    };

    const polySynth = useRef(createPolySynth());

    const resetPolySynth = () => {
        polySynth.current.dispose();
        polySynth.current = createPolySynth();
    };

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
        const transport = Tone.getTransport();
        if (isPlaying) {
            transport.pause();
        } else {
            if (transport.state === 'stopped') {
                transport.cancel();
                transport.position = 0;
                scheduleSounds();
            }
            transport.start();
        }
        setIsPlaying(!isPlaying);
    };

    const stopSound = () => {
        const transport = Tone.getTransport();
        transport.stop();
        transport.cancel(); // Stop all scheduled events
        resetPolySynth(); // Reset the PolySynth
        setIsPlaying(false);
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

        const transport = Tone.getTransport();

        colors.forEach((color) => {
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
                        const detuneValues = [-10, -5, 0, 5, 10];
                        detuneValues.forEach((detune, i) => {
                            transport.schedule((t) => {
                                polySynth.current.triggerAttackRelease(baseFreq + detune, duration, t);
                            }, time + i * 0.01); // Slight delay between each voice
                        });
                    } else if (color === 'red') {
                        // Trigger 2 voices with different waveforms and one an octave lower for red color
                        transport.schedule((t) => {
                            polySynth.current.triggerAttackRelease(baseFreq, duration, t);
                        }, time);
                        transport.schedule((t) => {
                            polySynth.current.triggerAttackRelease(baseFreq * 0.5, duration, t); // One octave lower
                        }, time + 0.01); // Slight delay between each voice
                    } else if (color === 'yellow') {
                        // Trigger 4 voices for yellow color with reverb
                        const detuneValues = [-10, -5, 0, 5];
                        detuneValues.forEach((detune, i) => {
                            if (i < 2) {
                                // Add reverb to first two voices
                                transport.schedule((t) => {
                                    polySynth.current.triggerAttackRelease(baseFreq + detune, duration, t);
                                    polySynth.current.connect(reverb1);
                                }, time + i * 0.01);
                            } else {
                                // Add reverb to the other two voices
                                transport.schedule((t) => {
                                    polySynth.current.triggerAttackRelease(baseFreq + detune, duration, t);
                                    polySynth.current.connect(reverb2);
                                }, time + i * 0.01);
                            }
                        });
                    } else {
                        transport.schedule((t) => {
                            polySynth.current.triggerAttackRelease(baseFreq, duration, t);
                        }, time);
                    }

                    if (pointIndex === arr.length - 1) {
                        transport.scheduleOnce((t) => {
                            polySynth.current.triggerRelease([baseFreq], t);
                            console.log(`Released: color=${color}, line=${lineIndex}, point=${pointIndex}, time=${t}`);
                        }, time + duration);
                    }
                });
            });
        });

        transport.start();
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
