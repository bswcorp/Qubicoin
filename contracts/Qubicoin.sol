// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Qubicoin is ERC20, Ownable {
    // Alamat kontrak Governance (Quorum-State) nanti di Bintaro
    address public titanGovernanceAddress;

    // Alokasi Sultan: 111% Logic (100% Base + 10% Buffer + 1% Gas)
    uint256 public constant SULTAN_MULTIPLIER = 111;

    // Tambahkan modifier agar hanya kontrak Governance atau Owner yang bisa memicu aksi
    modifier onlyTitanGovernance() {
        require(msg.sender == titanGovernanceAddress || msg.sender == owner(), "Bukan Otoritas Titan");
        _;
    }

    constructor() ERC20("Qubicoin", "QUBI") Ownable(msg.sender) {
        // Minting awal 1 Miliar untuk cadangan Data Center & i12
        _initMint(msg.sender, 1000000000 * 10 ** decimals()); 
    }

    // Fungsi internal untuk menghemat Gas (Aliran Nol)
    function _initMint(address account, uint256 amount) internal {
        _mint(account, amount);
    }

    // Set alamat Governance jika sudah deploy Quorum-State
    function setGovernanceAddress(address _govAddress) public onlyOwner {
        titanGovernanceAddress = _govAddress;
    }

    // Fungsi khusus pendanaan Sektor Nano & Sekolah (Otomatis +11%)
    function mintSovereign(address to, uint256 amount) public onlyTitanGovernance {
        uint256 totalSultan = (amount * SULTAN_MULTIPLIER) / 100;
        _mint(to, totalSultan);
    }
}
