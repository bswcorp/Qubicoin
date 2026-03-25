// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IMetakarta {
    function verifyLocation(string memory aksaraCode) external view returns (bool);
}

interface IQubicoin {
    function mint(address to, uint256 amount) external;
}

contract TitanNusantaraBridge {
    address public stgAdmin;
    IMetakarta public metakarta;
    IQubicoin public qubicoin;

    mapping(uint256 => bool) public quorumReached;

    constructor(address _metakarta, address _qubicoin) {
        stgAdmin = msg.sender;
        metakarta = IMetakarta(_metakarta);
        qubicoin = IQubicoin(_qubicoin);
    }

    // Logika: Minting hanya terjadi jika Lokasi Valid (Metakarta) & Quorum Tercapai
    function executeNusantaraMint(
        address _to, 
        uint256 _amount, 
        string memory _aksaraCode,
        uint256 _proposalId
    ) public {
        require(msg.sender == stgAdmin, "Hanya Otoritas STG");
        require(metakarta.verifyLocation(_aksaraCode), "Lokasi Nusantara-Root tidak valid");
        require(quorumReached[_proposalId], "Quorum-State belum terpenuhi");

        qubicoin.mint(_to, _amount);
    }

    function updateQuorumStatus(uint256 _proposalId, bool _status) external {
        require(msg.sender == stgAdmin, "Hanya STG Admin");
        quorumReached[_proposalId] = _status;
    }
}
