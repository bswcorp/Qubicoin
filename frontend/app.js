// CONFIGURATION
const CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const STG_CHAIN_ID_HEX = "0x1F91"; // Hexadecimal dari 8081
const STG_CHAIN_ID_DEC = 8081;

// ERC20 Minimal ABI (Balance & Transfer)
const ERC20_ABI = [
  "function balanceof(address owner) view returns (uint256)",
  "function transfer(address to, uint256 value) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

let provider;
let signer;
let tokenContract;
let userAddress = "";

// INITIALIZATION ON LOAD
window.addEventListener("DOMContentLoaded", () => {
  checkWalletConnection();
  loadTransactionHistory();
  
  // Listeners untuk perubahan di MetaMask
  if (window.ethereum) {
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
  }
});

// AUTO DETECT & SWITCH NETWORK
async function verifyAndSwitchNetwork() {
  if (!window.ethereum) return false;

  try {
    const currentChainId = await window.ethereum.request({ method: "eth_chainId" });
    
    if (currentChainId !== STG_CHAIN_ID_HEX) {
      console.log(`Wrong network detected. Switching to Chain ID: ${STG_CHAIN_ID_DEC}`);
      
      try {
        // Coba switch ke network STG 8081
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: STG_CHAIN_ID_HEX }],
        });
        return true;
      } catch (switchError) {
        // Jika network belum terdaftar di MetaMask (Error Code: 4902)
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
            alert("Gagal menambahkan jaringan STG ke MetaMask.");
            return false;
          }
        }
        alert("Gagal beralih ke jaringan STG.");
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error("Error verifying network:", error);
    return false;
  }
}

// CHECK EXISTING CONNECTION
async function checkWalletConnection() {
  if (window.ethereum) {
    try {
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      if (accounts.length > 0) {
        const isCorrectNetwork = await verifyAndSwitchNetwork();
        if (isCorrectNetwork) {
          initEthers(accounts[0]);
        }
      }
    } catch (error) {
      console.error("Error checking wallet connection:", error);
    }
  }
}

// CONNECT WALLET BUTTON TRIGGER
window.connectWallet = async () => {
  if (!window.ethereum) {
    alert("MetaMask tidak terdeteksi! Silakan install MetaMask.");
    return;
  }

  const isCorrectNetwork = await verifyAndSwitchNetwork();
  if (!isCorrectNetwork) return;

  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    initEthers(accounts[0]);
  } catch (error) {
    console.error("User denied account access", error);
  }
};

// INITIALIZE ETHERS JS
async function initEthers(address) {
  userAddress = address;
  provider = new ethers.providers.Web3Provider(window.ethereum);
  signer = provider.getSigner();
  tokenContract = new ethers.Contract(CONTRACT_ADDRESS, ERC20_ABI, signer);

  // Update UI Status Connected
  document.getElementById("walletAddress").innerText = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  document.getElementById("btnConnect").innerText = "Connected";
  document.getElementById("btnConnect").disabled = true;

  // Fetch Balances
  updateBalances();
}

// UPDATE BALANCES
async function updateBalances() {
  if (!signer || !tokenContract) return;

  try {
    // 1. Native ETH Balance
    const ethBal = await provider.getBalance(userAddress);
    document.getElementById("ethBalance").innerText = parseFloat(ethers.utils.formatEther(ethBal)).toFixed(4);

    // 2. Qubicoin ERC20 Balance
    const tokenBal = await tokenContract.balanceof(userAddress);
    const symbol = await tokenContract.symbol();
    document.getElementById("tokenBalance").innerText = `${ethers.utils.formatUnits(tokenBal, 18)} ${symbol}`;
  } catch (error) {
    console.error("Error fetching balances:", error);
  }
}

// TRANSFER TOKEN
window.transferToken = async () => {
  const recipient = document.getElementById("recipientInput").value;
  const amount = document.getElementById("amountInput").value;

  if (!recipient || !amount) {
    alert("Harap isi alamat penerima dan jumlah token!");
    return;
  }

  const isCorrectNetwork = await verifyAndSwitchNetwork();
  if (!isCorrectNetwork) return;

  try {
    const parsedAmount = ethers.utils.parseUnits(amount, 18);
    const tx = await tokenContract.transfer(recipient, parsedAmount);
    
    // UI Progress
    alert(`Transaksi dikirim! Hash: ${tx.hash}`);

    // Menunggu konfirmasi block
    await tx.wait();
    alert("Transfer Berhasil!");

    // Simpan ke local history
    saveTransaction(`Sent ${amount} QBC to ${recipient.substring(0,6)}...`);
    updateBalances();
    
    // Clear Input
    document.getElementById("recipientInput").value = "";
    document.getElementById("amountInput").value = "";

  } catch (error) {
    console.error("Transfer failed:", error);
    alert("Transaksi Gagal atau Dibatalkan.");
  }
};

// LOCAL TRANSACTION HISTORY LOGIC
function saveTransaction(message) {
  let history = JSON.parse(localStorage.getItem("qbc_tx_history")) || [];
  const timestamp = new Date().toLocaleTimeString();
  history.unshift(`[${timestamp}] ${message}`); // Tambah di baris paling atas
  localStorage.setItem("qbc_tx_history", JSON.stringify(history));
  loadTransactionHistory();
}

function loadTransactionHistory() {
  let history = JSON.parse(localStorage.getItem("qbc_tx_history")) || [];
  const txLog = document.getElementById("txLog");
  
  if (!txLog) return;
  txLog.innerHTML = "";

  if (history.length === 0) {
    txLog.innerHTML = `<div class="empty-tx">No transactions yet.</div>`;
    return;
  }

  history.forEach((tx) => {
    const item = document.createElement("div");
    item.className = "tx-item";
    item.innerText = tx;
    txLog.appendChild(item);
  });
}

window.clearTransactions = () => {
  localStorage.removeItem("qbc_tx_history");
  loadTransactionHistory();
};

// METAMASK EVENT HANDLERS
function handleAccountsChanged(accounts) {
  if (accounts.length === 0) {
    // User disconnect via MetaMask
    location.reload();
  } else if (accounts[0] !== userAddress) {
    initEthers(accounts[0]);
  }
}

function handleChainChanged() {
  // Reload halaman wajib dilakukan saat network berubah sesuai rekomendasi MetaMask
  location.reload();
      }
      
