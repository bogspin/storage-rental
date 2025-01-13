import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './config';

export class StorageContract {
    constructor() {
        this.contract = null;
        this.provider = null;
        this.signer = null;
    }

    async initialize() {
        if (typeof window.ethereum === 'undefined') {
            throw new Error('Please install MetaMask!');
        }
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        this.provider = new ethers.BrowserProvider(window.ethereum);
        this.signer = await this.provider.getSigner();
        this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.signer);
    }

    // Contract interaction methods
    async getStorageSpace(spaceId) {
        if (!this.contract) throw new Error('Contract not initialized');
        const space = await this.contract.getStorageSpace(spaceId);
        return {
            totalSpace: space.totalSpace,
            availableSpace: space.availableSpace,
            pricePerGB: space.pricePerGB,
            owner: space.owner
        };
    }

    async getUserRentals(address) {
        if (!this.contract) throw new Error('Contract not initialized');
        return this.contract.getUserRentals(address);
    }

    async rentStorage(spaceId, spaceToRent, durationInDays, value) {
        if (!this.contract) throw new Error('Contract not initialized');
        const tx = await this.contract.rentStostorage(spaceId, spaceToRent, durationInDays, {
            value: value
        });
        return tx.wait();
    }

    async uploadFile(spaceId, fileHash) {
        if (!this.contract) throw new Error('Contract not initialized');
        const tx = await this.contract.uploadFile(spaceId, fileHash);
        return tx.wait();
    }

    async getNextStorageId() {
        if (!this.contract) throw new Error('Contract not initialized');
        return this.contract.nextStorageId();
    }

    // New method to add storage space
    async addStorageSpace(totalSpace, pricePerGB) {
        if (!this.contract) throw new Error('Contract not initialized');
        const tx = await this.contract.addStorageSpace(totalSpace, pricePerGB);
        return tx.wait();
    }

    // Event listeners
    onStorageRented(callback) {
        this.contract.on("StorageRented", callback);
        return () => this.contract.off("StorageRented", callback);
    }

    onFileUploaded(callback) {
        this.contract.on("FileUploaded", callback);
        return () => this.contract.off("FileUploaded", callback);
    }

    onStorageAdded(callback) {
        this.contract.on("StorageAdded", callback);
        return () => this.contract.off("StorageAdded", callback);
    }
}

export const storageContract = new StorageContract();
