require('dotenv').config();

const express = require('express');
const app = express();

// Middleware to parse incoming JSON payloads from the ESP32
app.use(express.json());

// Import your route files
const authRoutes = require('./routes/auth');
const walletRoutes = require('./routes/wallet');

// Plug them into the server
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);

// Start the server
app.listen(3000, () => {
    console.log('Gym server running on port 3000');
});
