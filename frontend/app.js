import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.7.0/dist/ethers.min.js";

// KONFIGURASI STG NETWORK (CHAIN ID 8081)
const CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const STG_CHAIN_ID_HEX = "0x1F91"; // Hex dari 8081
const STG_CHAIN_ID_DEC = 8081;

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

// INISIALISASI AWAL SAAT HALAMAN DI-LOAD
window.addEventListener("DOMContentLoaded", () => {
  loadTransactionHistory();
  if (window.ethereum) {
    checkExistingConnection();
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", () => window.location.reload());
  } else {
    document.getElementById("networkName").innerText = "No Wallet Detected";
  }
});

// VERIFIKASI & OTOMATIS SWAP JARINGAN KE 8081
async function verifyAndSwitchNetwork() {
  if (!window.ethereum) return false;
  try {
    const currentChainId = await window.ethereum.request({ method: "eth_chainId" });
    if (currentChainId !== STG_CHAIN_ID_HEX) {
      addTxLog(`⏳ Jaringan salah. Mengalihkan ke STG Network (${STG_CHAIN_ID_DEC})...`);
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: STG_CHAIN_ID_HEX }],
        });
        return true;
      } catch (switchError) {
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [{
                chainId: STG_CHAIN_ID_HEX,
                chainName: "STG Hardhat Node",
                nativeCurrency: { name: "STG ETH", symbol: "ETH", decimals: 18 },
                rpcUrls: ["http://127.0.0.1:8545"],
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

// CEK STATUS KONEKSI WALLET LAMA
async function checkExistingConnection() {
  const accounts = await window.ethereum.request({ method: "eth_accounts" });
  if (accounts.length > 0) {
    const isCorrectNet = await verifyAndSwitchNetwork();
    if (isCorrectNet) initEthers();
  } else {
    document.getElementById("networkName").innerText = "Disconnected";
  }
}

// TOMBOL SAMBUNG WALLET
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

// INITIALIZE DATA DENGAN ETHERS V6
async function initEthers() {
  provider = new ethers.BrowserProvider(window.ethereum);
  signer = await provider.getSigner();
  currentAccount = await signer.getAddress();
  
  contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

  // Update Tampilan UI Status Connected
  document.getElementById("walletAddress").innerText = `${currentAccount.substring(0, 6)}...${currentAccount.substring(currentAccount.length - 4)}`;
  document.getElementById("networkName").innerText = "STG Network (8081)";
  
  const btnHero = document.getElementById("btnConnectHero");
  const btnSidebar = document.getElementById("btnConnectSidebar");
  if(btnHero) btnHero.innerText = "CONNECTED";
  if(btnSidebar) { btnSidebar.innerText = "Connected"; btnSidebar.disabled = true; }

  addTxLog("✅ Wallet connected");
  window.loadTokenData();
  loadBalance();
}

// AMBIL DATA TOKEN CONTRACT
window.loadTokenData = async () => {
  if (!contract) return;
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

// AMBIL SALDO DOMPET USER
async function loadBalance() {
  if (!contract) return;
  try {
    const balance = await contract.balanceOf(currentAccount);
    document.getElementById("tokenBalance").innerText = Number(ethers.formatUnits(balance, 18)).toLocaleString();
  } catch (err) {
    console.error(err);
  }
}

// FITUR KIRIM TOKEN ERC20
window.sendTokens = async () => {
  const recipient = document.getElementById("recipient").value;
  const amount = document.getElementById("amount").value;

  if (!recipient || !amount) {
    alert("Please fill all fields");
    return;
  }
  const isCorrectNet = await verifyAndSwitchNetwork();
  if (!isCorrectNet) return;

  try {
    addTxLog("⏳ Sending transaction...");
    const tx = await contract.transfer(recipient, ethers.parseUnits(amount, 18));
    addTxLog(`⏳ TX Submitted: ${tx.hash.substring(0,10)}...`);

    await tx.wait();
    addTxLog(`✅ Transfer Success!`);
    
    saveTransactionHistory(`Sent ${amount} QBC to ${recipient.substring(0,6)}...`);
    loadBalance();
    
    document.getElementById("recipient").value = "";
    document.getElementById("amount").value = "";
  } catch (err) {
    console.error(err);
    addTxLog("❌ Transaksi gagal atau dibatalkan.");
  }
};

// MANAJEMEN RIWAYAT TRANSAKSI (LOCAL STORAGE & LOG UI)
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
  
