// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TitanSovereignGovernance {
    struct Proposal {
        string description;
        uint256 voteCount;
        bool executed;
        mapping(address => bool) hasVoted;
    }

    address[] public members;
    mapping(address => bool) public isMember;
    Proposal[] public proposals;
    
    // Quorum: Persentase minimum member yang harus setuju (misal: 60)
    uint256 public quorumPercentage;

    event ProposalCreated(uint256 proposalId, string description);
    event Voted(uint256 proposalId, address voter);
    event ProposalExecuted(uint256 proposalId);

    constructor(address[] memory _initialMembers, uint256 _quorum) {
        for(uint i = 0; i < _initialMembers.length; i++) {
            isMember[_initialMembers[i]] = true;
            members.push(_initialMembers[i]);
        }
        quorumPercentage = _quorum;
    }

    // Fungsi membuat usulan operasional baru
    function createProposal(string memory _description) public {
        require(isMember[msg.sender], "Bukan anggota ekosistem");
        
        Proposal storage newProposal = proposals.push();
        newProposal.description = _description;
        newProposal.voteCount = 0;
        newProposal.executed = false;

        emit ProposalCreated(proposals.length - 1, _description);
    }

    // Fungsi memberikan suara (Voting)
    function vote(uint256 _proposalId) public {
        Proposal storage p = proposals[_proposalId];
        require(isMember[msg.sender], "Bukan anggota");
        require(!p.hasVoted[msg.sender], "Sudah memberikan suara");
        require(!p.executed, "Proposal sudah dijalankan");

        p.hasVoted[msg.sender] = true;
        p.voteCount++;

        emit Voted(_proposalId, msg.sender);
    }

    // Cek apakah Quorum-State tercapai dan jalankan aksi
    function executeProposal(uint256 _proposalId) public {
        Proposal storage p = proposals[_proposalId];
        uint256 requiredVotes = (members.length * quorumPercentage) / 100;

        require(p.voteCount >= requiredVotes, "Quorum belum tercapai");
        require(!p.executed, "Sudah dieksekusi");

        p.executed = true;
        
        // Logika operasional masterplan dijalankan di sini
        emit ProposalExecuted(_proposalId);
    }
}

