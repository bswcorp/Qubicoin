const { ethers } = require("ethers");
const fs = require("fs");

async function main() {
    // 1. Load Command dari JSON (Instruksi Ciracas)
    const commandData = JSON.parse(fs.readFileSync("./docs/commands/command-test.json", "utf8"));
    console.log(`📡 Memproses instruksi dari: ${commandData.header.origin}`);

    // 2. Konfigurasi Provider & Wallet (Bintaro Node)
    const provider = new ethers.JsonRpcProvider("URL_RPC_BLOCKCHAIN_ANDA");
    const wallet = new ethers.Wallet("PRIVATE_KEY_ADMIN_STG", provider);

    // 3. Alamat Kontrak Bridge (Setelah Deploy)
    const bridgeAddress = "0xALAMAT_KONTRAK_BRIDGE_DI_BLOCKCHAIN";
    const abi = [
        "function executeNusantaraMint(address _to, uint256 _amount, string memory _aksaraCode, uint256 _proposalId) public"
    ];

    const bridgeContract = new ethers.Contract(bridgeAddress, abi, wallet);

    // 4. Ekstraksi Data dari Payload JSON
    const { recipient, amount, location_auth } = commandData.payload.parameters;
    const { proposal_id } = commandData.payload.quorum_state;

    console.log(`🔐 Memvalidasi Quorum-State ID: ${proposal_id}`);
    console.log(`📍 Lokasi Nusantara: ${location_auth}`);

    // 5. Eksekusi ke Blockchain
    try {
        const tx = await bridgeContract.executeNusantaraMint(
            recipient,
            ethers.parseUnits(amount, 18), // Asumsi 18 decimal
            location_auth,
            proposal_id
        );
        console.log(`🚀 Transaksi Berhasil! Hash: ${tx.hash}`);
        await tx.wait();
        console.log("✅ Minting Qubicoin Selesai via Titan Bridge.");
    } catch (error) {
        console.error("❌ Eksekusi Gagal:", error.reason || error.message);
    }
}

main();
