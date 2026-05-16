# 🪙 Qubicoin — Native Coin of STG

Qubicoin Frontend
        │
        ▼
STG Backend API
        │
        ▼
AI Agent Layer
        │
        ▼
Chainstack MCP
        │
 ┌──────┼──────┐
 ▼             ▼
Blockchain     Smart Contracts
Engineine            Wallet Engine

---
Qubicoin/ (Root)
├── frontend/
│   ├── index.html
│   ├── app.js
│   └── config.js
└── backend/
    ├── .env
    ├── .gitignore
    ├── server.js
    ├── config/
    │   ├── db.js
    │   └── blockchain.js
    ├── controllers/
    │   ├── authController.js
    │   └── walletController.js
    ├── models/
    │   ├── userModel.js
    │   └── transactionModel.js
    ├── routes/
    │   ├── authRoutes.js
    │   └── walletRoutes.js
    ├── middlewares/
    │   └── authMiddleware.js
    └── services/
        └── ethService.js

---        

## 📌 Overview
Qubicoin adalah native coin dari ekosistem **Sovereign Titan Genesis (STG)**.  
Berfungsi sebagai unit dasar untuk swap, distribusi, dan integrasi lintas 12 Pilar.

---

📌 Petunjuk penempatan:  
- Simpan file ini sebagai `README.md` di **root folder repo Qubicoin**.  
- Pastikan workflow sinkronisasi README aktif agar update otomatis masuk ke repo induk STG‑CHAIN.  

---

## ⚡ Integration Checklist

### 1. Documentation
- Menjelaskan status Qubicoin sebagai native coin STG.
- Referensi silang ke **Quantum Swap Engine**.
- Tercatat dalam dokumen Sovereign‑Titan‑Genesis.

### 2. API & Data Format
- Payload JSON standar:
  ```json
  {
    "coin_id": "QUBI",
    "amount": 100,
    "timestamp": "2026-05-02T12:00:00Z",
    "origin_wallet": "0xABC123..."
  }
