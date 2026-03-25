const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("🚀 Memulai Deployment Titan Sovereign Ecosystem...");
  console.log("👤 Akun Deployer (Admin STG):", deployer.address);

  // --- 1. Deploy Qubicoin (Economic Engine) ---
  console.log("\n📦 Deploying Qubicoin...");
  const Qubicoin = await hre.ethers.getContractFactory("Qubicoin");
  const qubi = await Qubicoin.deploy();
  await qubi.waitForDeployment();
  const qubiAddress = await qubi.getAddress();
  console.log("✅ Qubicoin deployed ke:", qubiAddress);

  // --- 2. Deploy Metakarta Mock (Spatial Validator) ---
  // Catatan: Pastikan kontrak Metakarta Anda sudah ada di folder contracts/
  console.log("\n📍 Deploying Metakarta Spatial Validator...");
  const Metakarta = await hre.ethers.getContractFactory("Metakarta");
  const meta = await Metakarta.deploy();
  await meta.waitForDeployment();
  const metaAddress = await meta.getAddress();
  console.log("✅ Metakarta deployed ke:", metaAddress);

  // --- 3. Deploy TitanNusantaraBridge (The Core Bridge) ---
  console.log("\n🌉 Deploying Titan Nusantara Bridge (STG Bridge)...");
  const TitanBridge = await hre.ethers.getContractFactory("TitanNusantaraBridge");
  // Konstruktor menerima alamat Metakarta dan Qubicoin
  const bridge = await TitanBridge.deploy(metaAddress, qubiAddress);
  await bridge.waitForDeployment();
  const bridgeAddress = await bridge.getAddress();
  console.log("✅ TitanBridge deployed ke:", bridgeAddress);

  // --- 4. Konfigurasi Otoritas ---
  console.log("\n⚙️ Menghubungkan Izin Minting ke Bridge...");
  // Asumsi: Kontrak Qubicoin memiliki fungsi transferOwnership atau setMinter
  await qubi.setMinter(bridgeAddress); 
  console.log("✅ Bridge kini memiliki otoritas Minting Qubicoin.");

  console.log("\n✨ DEPLOYMENT SELESAI ✨");
  console.log("-----------------------------------------");
  console.log("STG MASTERPLAN READY FOR QUORUM-STATE");
  console.log("-----------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
