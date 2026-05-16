import { ethers } from "https://jsdelivr.net";
import { CONFIG } from "./config.js";

const CONTRACT_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint amount) returns (bool)"
];

let provider;
let signer;
let contract;
let currentAccount;

// INITIAL LOAD HANDLER
window.addEventListener("DOMContentLoaded", () => {
  loadTransactionHistory();
  if (window.ethereum) {
    checkExistingConnection();
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", () => window.location.reload());
  } else {
    document.getElementById("networkName").innerText = "No Wallet Detected";
  }

  // UPGRADE 4: Auto Refresh Balance real-time setiap 10 detik
  setInterval(() => {
    if (currentAccount && contract) {
      loadBalance();
    }
  }, 10000);
});

// NETWORK VALIDATION & AUTO SWITCH
async function verifyAndSwitchNetwork() {
  if (!window.ethereum) return false;
  try {
    const currentChainId = await window.ethereum.request({ method: "eth_chainId" });
    if (currentChainId !== CONFIG.chainHex) {
      addTxLog(`⏳ Jaringan salah. Mengalihkan ke STG Network (${CONFIG.chainId})...`);
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: CONFIG.chainHex }],
        });
        return true;
      } catch (switchError) {
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [{
                chainId: CONFIG.chainHex,
                chainName: "STG Hardhat Node",
                nativeCurrency: { name: "STG ETH", symbol: "ETH", decimals: 18 },
                rpcUrls: [CONFIG.rpc],
              }],
            });
            return true;
          } catch (addError) {
            addTxLog("❌ Gagal menambahkan STG Network ke MetaMask.");
            return false;
          }
        }
        addTxLog("❌ Gagal beralih ke jaringan STG.");
        return false;
      }
    }
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

async function checkExistingConnection() {
  const accounts = await window.ethereum.request({ method: "eth_accounts" });
  if (accounts.length > 0) {
    const isCorrectNet = await verifyAndSwitchNetwork();
    if (isCorrectNet) initEthers();
  } else {
    document.getElementById("networkName").innerText = "Disconnected";
  }
}

window.connectWallet = async () => {
  if (!window.ethereum) {
    alert("Please install MetaMask");
    return;
  }
  const isCorrectNet = await verifyAndSwitchNetwork();
  if (!isCorrectNet) return;

  try {
    initEthers();
  } catch (err) {
    console.error(err);
    addTxLog("❌ Wallet connection failed");
  }
};

async function initEthers() {
  provider = new ethers.BrowserProvider(window.ethereum);
  signer = await provider.getSigner();
  currentAccount = await signer.getAddress();
  
  contract = new ethers.Contract(CONFIG.contract, CONTRACT_ABI, signer);

  // Update Tampilan UI Status Connected
  document.getElementById("walletAddress").innerText = `${currentAccount.substring(0, 6)}...${currentAccount.substring(currentAccount.length - 4)}`;
  document.getElementById("networkName").innerText = `STG Network (${CONFIG.chainId})`;
  
  // Tampilkan tombol copy jika wallet sudah terhubung
  const btnCopy = document.getElementById("btnCopy");
  if (btnCopy) btnCopy.classList.remove("hidden");

  const btnHero = document.getElementById("btnConnectHero");
  const btnSidebar = document.getElementById("btnConnectSidebar");
  if(btnHero) btnHero.innerText = "CONNECTED";
  if(btnSidebar) { btnSidebar.innerText = "Connected"; btnSidebar.disabled = true; }

  addTxLog("✅ Wallet connected");
  window.loadTokenData();
  loadBalance();
}

// UPGRADE 2: Fitur Copy Wallet Address Ke Clipboard
window.copyWallet = async () => {
  if (!currentAccount) return;
  try {
    await navigator.clipboard.writeText(currentAccount);
    addTxLog("📋 Address copied to clipboard");
  } catch (err) {
    console.error("Failed to copy address", err);
  }
};

window.loadTokenData = async () => {
  // BUG 5: Validasi Status Kontrak Terhubung
  if (!contract) {
    alert("Connect wallet first");
    return;
  }
  try {
    const name = await contract.name();
    const symbol = await contract.symbol();
    const supply = await contract.totalSupply();

    document.getElementById("tokenName").innerText = name;
    document.getElementById("tokenSymbol").innerText = symbol;
    document.getElementById("tokenSupply").innerText = Number(ethers.formatUnits(supply, 18)).toLocaleString();
  } catch (err) {
    console.error(err);
    addTxLog("❌ Gagal memuat data token contract.");
  }
};

async function loadBalance() {
  if (!contract) return;
  try {
    const balance = await contract.balanceOf(currentAccount);
    document.getElementById("tokenBalance").innerText = Number(ethers.formatUnits(balance, 18)).toLocaleString();
  } catch (err) {
    console.error(err);
  }
}

// TRANSMIT TRANSACTION & VALIDATIONS
window.sendTokens = async () => {
  // BUG 5: Validasi Cek Status Koneksi Kontrak
  if (!contract) {
    alert("Connect wallet first");
    return;
  }

  const recipient = document.getElementById("recipient").value.trim();
  const amount = document.getElementById("amount").value;

  // BUG 3: Validasi Struktur Alamat Wallet Tujuan
  if (!ethers.isAddress(recipient)) {
    alert("Invalid wallet address");
    return;
  }

  // BUG 4: Validasi Batas Nominal Nilai Jumlah Transfer
  if (Number(amount) <= 0 || !amount) {
    alert("Invalid amount");
    return;
  }

  const isCorrectNet = await verifyAndSwitchNetwork();
  if (!isCorrectNet) return;

  const btnSend = document.getElementById("btnSendToken");
  const originalText = btnSend.innerText;

  try {
    // UPGRADE 1: Memasang Status Animasi Pemuatan Button (Loading State)
    btnSend.innerText = "Processing...";
    btnSend.disabled = true;

    addTxLog("⏳ Sending transaction...");
    const tx = await contract.transfer(recipient, ethers.parseUnits(amount, 18));
    
    // UPGRADE 3: Memanfaatkan tautan Block Explorer lokal
    addTxLog(`⏳ TX Submitted. Check Explorer: ${CONFIG.explorer}/tx/${tx.hash}`);

    await tx.wait();
    addTxLog(`✅ Transfer Success!`);
    
    saveTransactionHistory(`Sent ${amount} QBC to ${recipient.substring(0,6)}...`);
    loadBalance();
    
    document.getElementById("recipient").value = "";
    document.getElementById("amount").value = "";
  } catch (err) {
    console.error(err);
    addTxLog("❌ Transaksi gagal atau dibatalkan.");
  } finally {
    // Kembalikan status tombol ke kondisi semula setelah proses selesai
    btnSend.innerText = originalText;
    btnSend.disabled = false;
  }
};

// LOGGING SYSTEM
function addTxLog(message) {
  const txLog = document.getElementById("txLog");
  if (!txLog) return;
  
  const empty = txLog.querySelector(".empty-tx");
  if (empty) txLog.innerHTML = "";
  
  const item = document.createElement("div");
  item.className = "tx-item p-2 border-b border-white/10 text-sm text-gray-200";
  item.innerText = `[${new Date().toLocaleTimeString()}] ${message}`;
  txLog.insertBefore(item, txLog.firstChild);
}

function saveTransactionHistory(message) {
  let history = JSON.parse(localStorage.getItem("qbc_tx_history")) || [];
  const timestamp = new Date().toLocaleTimeString();
  history.unshift(`[${timestamp}] ${message}`);
  localStorage.setItem("qbc_tx_history", JSON.stringify(history));
  loadTransactionHistory();
}

function loadTransactionHistory() {
  let history = JSON.parse(localStorage.getItem("qbc_tx_history")) || [];
  const txLog = document.getElementById("txLog");
  if (!txLog) return;
  
  txLog.innerHTML = "";
  if (history.length === 0) {
    txLog.innerHTML = `<div class="empty-tx text-gray-400 italic text-center p-4">No transactions yet.</div>`;
    return;
  }
  history.forEach((tx) => {
    const item = document.createElement("div");
    item.className = "tx-item p-2 border-b border-white/10 text-sm text-gray-200";
    item.innerText = tx;
    txLog.appendChild(item);
  });
}

// BUG 1 FIXED: Memperbaiki string terpotong pada penghapusan cache lokal
window.clearTransactions = () => {
  localStorage.removeItem("qbc_tx_history");
  loadTransactionHistory();
};

function handleAccountsChanged(accounts) {
  if (accounts.length === 0) {
    window.location.reload();
  } else if (accounts[0] !== currentAccount) {
    initEthers();
  }
    }
