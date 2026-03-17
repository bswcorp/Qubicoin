import os
from web3 import Web3

# Konfigurasi Jaringan
RPC_URL = "https://polygon-rpc.com" # Contoh Polygon Mainnet
web3 = Web3(Web3.HTTPProvider(RPC_URL))

def deploy():
    # Masukkan ABI dan Bytecode hasil compile dari Remix
    abi = "..." 
    bytecode = "..."
    
    account = web3.eth.account.from_key("PRIVATE_KEY_ANDA")
    Qubic = web3.eth.contract(abi=abi, bytecode=bytecode)
    
    # Kirim Transaksi
    tx = Qubic.constructor().build_transaction({
        'from': account.address,
        'nonce': web3.eth.get_transaction_count(account.address),
        'gas': 2000000,
        'gasPrice': web3.to_wei('50', 'gwei')
    })
    
    signed_tx = web3.eth.account.sign_transaction(tx, account.key)
    hash = web3.eth.send_raw_transaction(signed_tx.rawTransaction)
    print(f"Qubicoin Berhasil Meluncur! Hash: {hash.hex()}")

if __name__ == "__main__":
    deploy()
  
