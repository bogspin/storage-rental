# Decentralized Storage Platform

## Features
- Connect MetaMask wallet for authentication
- View available storage spaces and their pricing
- Rent storage space with automated payments
- Upload files to rented storage spaces
- Track rental durations and space usage
- Restore unused storage space
- Real-time transaction updates

## Prerequisites

- Node.js >= 14.x
- MetaMask browser extension

## Installation

1. Clone the repository:
```bash
git clone https://github.com/bogspin/storage-rental.git
cd decentralized-storage
```

2. Install dependencies:
```bash
npm install
```

3. Deploy the smart contract `StorageRental.sol` on Remix.ethereum.

4. Create a `config.js` file in src/contracts and complete with smart contract deployment details:
```js
export const CONTRACT_ADDRESS = "";
export const CONTRACT_ABI = []
```

5. Start the backend file transfer server and the React app:
```bash
cd storage-backend
node server.js
cd ..
npm run dev
```

## Smart Contract

The storage rental smart contract includes the following main functions:

- `addStorageSpace(uint256 totalSpace, uint256 pricePerGB)`: Add new storage space to the marketplace
- `rentStorage(uint256 spaceId, uint256 spaceToRent, uint256 durationInDays)`: Rent storage space
- `uploadFile(uint256 spaceId, string fileHash)`: Record file uploads
- `restoreStorage(uint256 spaceId)`: Return unused storage space
- `getUserRentals(address user)`: Get all rentals for a user
- `getStorageSpace(uint256 spaceId)`: Get details of a storage space

## Usage

1. Connect your MetaMask wallet by clicking the "Connect Wallet" button

2. Browse available storage spaces:
   - View total and available space
   - Check price per GB
   - Enter amount to rent
   - Click "Rent Space" to proceed with transaction

3. Manage your rented spaces:
   - Upload files to your rented space
   - Monitor rental duration
   - Restore unused space when needed