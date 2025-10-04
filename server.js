// Simple CORS Proxy Server for NASA API
// Run with: node server.js

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Proxy endpoint for NASA Small-Body Database
app.get('/api/asteroid/:name', async (req, res) => {
    try {
        const asteroidName = req.params.name;
        const url = `https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=${encodeURIComponent(asteroidName)}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        res.json(data);
    } catch (error) {
        console.error('Error fetching asteroid data:', error);
        res.status(500).json({ error: 'Failed to fetch asteroid data' });
    }
});

app.listen(PORT, () => {
    console.log(`CORS Proxy server running on http://localhost:${PORT}`);
    console.log(`Test it: http://localhost:${PORT}/api/asteroid/ceres`);
});

