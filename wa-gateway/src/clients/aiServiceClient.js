const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

async function classifyWindow(payload) {
    try {
        const response = await axios.post(`${AI_SERVICE_URL}/classify`, payload, {
            headers: { 'Content-Type': 'application/json' }
        });
        return response.data;
    } catch (error) {
        console.error('[AI Service Client Error]:', error.response?.data || error.message);
        throw error;
    }
}

module.exports = { classifyWindow };