import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './config';

export class StorageContract {
    constructor() {
        this.contract = null;
        this.provider = null;
        this.signer = null;
    }

    async init() {
        if (typeof window.ethereum === 'undefined') {
            throw new Error('Please install MetaMask!');
        }
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        this.provider = new ethers.BrowserProvider(window.ethereum);
        this.signer = await this.provider.getSigner();
        this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.signer);
    }

    async getAvailableSpaces() {
        if (!this.contract) throw new Error('Contract not initialized');
        const nextId = await this.contract.nextStorageId();
        const spaces = [];
        
        for (let i = 1; i < nextId; i++) {
            const space = await this.contract.getStorageSpace(i);
            if (space.isAvailable) {
                spaces.push({
                    id: i,
                    spaceSize: space.spaceSize,
                    pricePerGB: space.pricePerGB
                });
            }
        }
        return spaces;
    }

    async rentStorage(spaceId, durationInDays, totalCost) {
        if (!this.contract) throw new Error('Contract not initialized');
        const tx = await this.contract.rentStorage(spaceId, durationInDays, {
            value: totalCost
        });
        return await tx.wait();
    }

    async recordFileUpload(spaceId, fileHash) {
        if (!this.contract) throw new Error('Contract not initialized');
        const tx = await this.contract.recordFileUpload(spaceId, fileHash);
        return await tx.wait();
    }
}

export const storageContract = new StorageContract();
