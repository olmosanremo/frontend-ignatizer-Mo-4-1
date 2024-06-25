// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect, useRef } from 'react';
import MinimalDrawingCanvas from './components/MinimalDrawingCanvas';
import ControlPanel from './components/ControlPanel';
import DrawingList from './components/DrawingList';
import SplashScreen from './components/SplashScreen'; // Korrigierter Importpfad
import { saveDrawing, loadDrawing, updateDrawing, getAllDrawings, deleteDrawing } from './backendApi/api';
import './App.css'; // Importiere die CSS-Datei

const App = () => {
    const [lines, setLines] = useState({ red: [], yellow: [], green: [] });
    const [color, setColor] = useState('red');
    const [isErasing, setIsErasing] = useState(false);
    const [trackName, setTrackName] = useState('');
    const [originalTrackName, setOriginalTrackName] = useState('');
    const [drawings, setDrawings] = useState([]);
    const [isDrawingListVisible, setIsDrawingListVisible] = useState(false);
    const [showSplash, setShowSplash] = useState(true); // Zustand für den SplashScreen
    const canvasRef = useRef(null);

    const toggleEraseMode = () => {
        setIsErasing(!isErasing);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowSplash(false);
        }, 2000); // SplashScreen nach 2 Sekunden ausblenden

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
            handleFetchDrawings(); // Aktualisiere die Liste nach dem Speichern
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
                setIsDrawingListVisible(false); // Schließe das Fenster nach dem Laden
                handleFetchDrawings(); // Aktualisiere die Liste nach dem Laden
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
            handleFetchDrawings(); // Aktualisiere die Liste nach dem Löschen
        } catch (error) {
            alert('Error deleting drawing.');
        }
    };

    const clearDrawing = () => {
        setLines({ red: [], yellow: [], green: [] });
    };

    useEffect(() => {
        handleFetchDrawings();
    }, []);

    return (
        <div>
            {showSplash && <SplashScreen />} {/* SplashScreen anzeigen */}
            {!showSplash && (
                <>
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
                    <ControlPanel setColor={setColor} toggleEraseMode={toggleEraseMode} isErasing={isErasing} />
                    <input
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
