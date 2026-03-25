// Tambahkan modifier agar hanya kontrak Governance yang bisa memicu aksi besar
modifier onlyTitanGovernance() {
    require(msg.sender == titanGovernanceAddress, "Hanya Titan Governance yang punya otoritas");
    _;
}

