require('dotenv').config();

const express = require('express');
const app = express();
const morgan = require('morgan');

// Middleware to parse incoming JSON payloads from the ESP32
app.use(express.json());
app.use(morgan('dev'));

// Import your route files
const authRoutes = require('./routes/auth');
const walletRoutes = require('./routes/wallet');
const scanRoutes = require('./routes/scan');

// Plug them into the server
app.use('/', authRoutes);
app.use('/', walletRoutes);
app.use('/', scanRoutes);

// Start the server
app.listen(3000, () => {
    console.log('Gym server running on port 3000');
});
