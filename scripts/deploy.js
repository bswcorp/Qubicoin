const hre = require("hardhat");

async function main() {
  console.log("🚀 MEMULAI OPERASI TITAN SOVEREIGN (MAINNET READY)...");

  // 1. Inisialisasi Akun Sultan
  const [deployer] = await hre.ethers.getSigners();
  console.log("👤 Akun Deployer (Admin STG):", deployer.address);

  // Cek saldo Faucet/Gratisan
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Saldo Gas saat ini:", hre.ethers.formatEther(balance), "MATIC/ETH");

  // --- 1. DEPLOY QUBICOIN (ECONOMIC ENGINE) ---
  console.log("\n📦 Memproses Kelahiran Qubicoin...");
  const Qubicoin = await hre.ethers.getContractFactory("Qubicoin");
  const qubi = await Qubicoin.deploy();
  await qubi.waitForDeployment();
  const qubiAddress = await qubi.getAddress();
  console.log("✅ Qubicoin lahir di alamat:", qubiAddress);

  // --- 2. DEPLOY METAKARTA (SPATIAL VALIDATOR) ---
  console.log("\n📍 Memproses Metakarta Spatial Validator...");
  const Metakarta = await hre.ethers.getContractFactory("Metakarta");
  const meta = await Metakarta.deploy();
  await meta.waitForDeployment();
  const metaAddress = await meta.getAddress();
  console.log("✅ Metakarta lahir di alamat:", metaAddress);

  // --- 3. DEPLOY TITAN BRIDGE (STG BRIDGE) ---
  console.log("\n🌉 Memproses Titan Nusantara Bridge...");
  const TitanBridge = await hre.ethers.getContractFactory("TitanNusantaraBridge");
  // Bridge menghubungkan Metakarta & Qubicoin
  const bridge = await TitanBridge.deploy(metaAddress, qubiAddress);
  await bridge.waitForDeployment();
  const bridgeAddress = await bridge.getAddress();
  console.log("✅ TitanBridge lahir di alamat:", bridgeAddress);

  // --- 4. OTORITAS & KEAMANAN ---
  console.log("\n⚙️ Menghubungkan Izin Minting ke Bridge...");
  // Memasukkan alamat Bridge ke dalam Qubicoin agar Quorum-State bisa jalan
  try {
    const tx = await qubi.setGovernanceAddress(bridgeAddress);
    await tx.wait();
    console.log("✅ Otoritas Quorum-State AKTIF.");
  } catch (err) {
    console.log("⚠️ Gagal set otoritas secara otomatis. Lakukan manual di Bintaro nanti.");
  }

  console.log("\n✨ SEMUA SISTEM TELAH TERPASANG ✨");
  console.log("--------------------------------------------------");
  console.log("📍 QUBI ADDR  :", qubiAddress);
  console.log("📍 META ADDR  :", metaAddress);
  console.log("📍 BRIDGE ADDR:", bridgeAddress);
  console.log("--------------------------------------------------");
  console.log("⚠️ SIMPAN ALAMAT DI ATAS UNTUK LISTING UNISWAP!");
  console.log("STG MASTERPLAN READY FOR QUORUM-STATE");
}

main().catch((error) => {
  console.error("❌ Terjadi kesalahan fatal:", error);
  process.exitCode = 1;
});
