const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Base Route untuk Cek Status API
app.get('/api/health', (req, res) => {
  res.json({ status: "healthy", message: "Qubicoin STG Backend API Operational" });
});

// Jalankan Server
app.listen(PORT, () => {
  console.log(`🚀 STG Server running on port ${PORT}`);
});

