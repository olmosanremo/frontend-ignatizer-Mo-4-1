

import axios from 'axios';

const BASE_URL = 'https://backend-ignatizer-mo.onrender.com';

export const getAllDrawings = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/synthdata/all`);
        return response.data;
    } catch (error) {
        console.error('Error fetching drawings', error);
        throw error;
    }
};

export const saveDrawing = async (name, lines) => {
    try {
        const response = await axios.post(`${BASE_URL}/synthdata/save`, { name, lines });
        return response.data;
    } catch (error) {
        console.error('Error saving drawing', error);
        throw error;
    }
};

export const loadDrawing = async (id) => {
    try {
        const response = await axios.get(`${BASE_URL}/synthdata/load/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error loading drawing', error);
        throw error;
    }
};

export const updateDrawing = async (name, lines) => {
    try {
        const response = await axios.patch(`${BASE_URL}/synthdata/update`, { name, lines });
        return response.data;
    } catch (error) {
        console.error('Error updating drawing', error);
        throw error;
    }
};

export const deleteDrawing = async (id) => {
    try {
        const response = await axios.delete(`${BASE_URL}/synthdata/delete/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting drawing', error);
        throw error;
    }
};
