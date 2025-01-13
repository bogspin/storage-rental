import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, HardDrive } from 'lucide-react';
import { useWeb3 } from '../hooks/useWeb3';
import { storageContract } from '../contracts/StorageContract';

export const StorageRental = () => {
    const { isConnected, account, error: web3Error, connectWallet } = useWeb3();
    const [availableSpaces, setAvailableSpaces] = useState([]);
    const [userRentals, setUserRentals] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [rentalAmounts, setRentalAmounts] = useState({});

    useEffect(() => {
        if (isConnected) {
            loadAvailableSpaces();
            loadUserRentals();
        }
    }, [isConnected]);

    const loadAvailableSpaces = async () => {
        try {
            const spaces = [];
            const nextId = await storageContract.contract.nextStorageId();
            
            for (let i = 1; i < nextId; i++) {
                const space = await storageContract.contract.getStorageSpace(i);
                spaces.push({
                    id: i,
                    totalSpace: Number(space.totalSpace),
                    availableSpace: Number(space.availableSpace),
                    pricePerGB: space.pricePerGB
                });
            }
            setAvailableSpaces(spaces);
        } catch (err) {
            setError("Failed to load available spaces: " + err.message);
        }
    };

    const loadUserRentals = async () => {
        try {
            const rentals = await storageContract.contract.getUserRentals(account);
            setUserRentals(rentals.filter(rental => rental.isActive));
        } catch (err) {
            setError("Failed to load user rentals: " + err.message);
        }
    };

    const handleRentalAmountChange = (spaceId, amount) => {
        setRentalAmounts(prev => ({
            ...prev,
            [spaceId]: amount
        }));
    };

    const rentStorage = async (spaceId) => {
        try {
            setLoading(true);
            setError('');
            setSuccess('');
    
            const space = availableSpaces.find(s => s.id === spaceId);
            const amountToRent = Number(rentalAmounts[spaceId]);
    
            if (!amountToRent || amountToRent <= 0) {
                throw new Error('Please enter a valid amount to rent');
            }
    
            if (amountToRent > space.availableSpace) {
                throw new Error('Not enough available space');
            }
    
            const amountBN = ethers.toBigInt(amountToRent); // Convert amountToRent to BigInt
            const durationBN = ethers.toBigInt(30); // 30 days as BigInt
            const totalCost = space.pricePerGB * amountBN * durationBN; // BigInt multiplication

            
            const tx = await storageContract.contract.rentStorage(
                spaceId, 
                amountToRent, 
                30, // 30 days
                { value: totalCost }
            );
            await tx.wait();
    
            setSuccess('Storage space rented successfully!');
            await loadAvailableSpaces();
            await loadUserRentals();
            
            // Clear rental amount
            setRentalAmounts(prev => ({
                ...prev,
                [spaceId]: ''
            }));
        } catch (err) {
            setError("Transaction failed: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const uploadFile = async (spaceId) => {
        try {
            setLoading(true);
            setError('');
            setSuccess('');

            if (!selectedFile) {
                throw new Error('Please select a file');
            }

            // Mock file upload to your backend
            const formData = new FormData();
            formData.append('file', selectedFile);
            
            // Replace with your backend endpoint
            await fetch('http://localhost:3001/upload', {
                method: 'POST',
                body: formData
            });

            // Record on blockchain
            const mockFileHash = ethers.keccak256(ethers.toUtf8Bytes(selectedFile.name));
            const tx = await storageContract.contract.uploadFile(spaceId, mockFileHash);
            await tx.wait();

            setSuccess('File uploaded successfully!');
            setSelectedFile(null);
        } catch (err) {
            setError("Upload failed: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="p-6">
                        <h2 className="text-2xl font-bold mb-4 text-center">
                            Welcome to Decentralized Storage
                        </h2>
                        <Button 
                            className="w-full" 
                            onClick={connectWallet}
                        >
                            Connect Wallet
                        </Button>
                        {web3Error && (
                            <Alert variant="destructive" className="mt-4">
                                <AlertDescription>{web3Error}</AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-4 max-w-4xl mx-auto">
            {/* Available Storage Spaces */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Available Storage Spaces</CardTitle>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    
                    {success && (
                        <Alert className="mb-4">
                            <AlertDescription>{success}</AlertDescription>
                        </Alert>
                    )}

                    <div className="grid gap-4">
                        {availableSpaces.map((space) => (
                            <Card key={space.id}>
                                <CardContent className="p-4">
                                    <div className="flex flex-col gap-4">
                                        <div>
                                            <p className="font-medium">Storage Space #{space.id}</p>
                                            <p className="text-sm text-gray-500">
                                                Available: {space.availableSpace}GB / {space.totalSpace}GB
                                                <br />
                                                Price: {ethers.formatEther(space.pricePerGB)} ETH/GB
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Input
                                                type="number"
                                                placeholder="GB to rent"
                                                value={rentalAmounts[space.id] || ''}
                                                onChange={(e) => handleRentalAmountChange(space.id, e.target.value)}
                                                min="1"
                                                max={space.availableSpace}
                                            />
                                            <Button
                                                onClick={() => rentStorage(space.id)}
                                                disabled={loading || !rentalAmounts[space.id]}
                                            >
                                                <HardDrive className="w-4 h-4 mr-2" />
                                                Rent Space
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* User's Rentals */}
            <Card>
                <CardHeader>
                    <CardTitle>Your Rented Spaces</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4">
                        {userRentals.map((rental, index) => (
                            <Card key={index}>
                                <CardContent className="p-4">
                                    <div className="flex flex-col gap-4">
                                        <div>
                                            <p className="font-medium">Space #{rental.spaceId.toString()}</p>
                                            <p className="text-sm text-gray-500">
                                                Rented Space: {rental.rentedSpace.toString()}GB
                                                <br />
                                                Valid until: {new Date(Number(rental.rentedUntil) * 1000).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Input
                                                type="file"
                                                onChange={(e) => setSelectedFile(e.target.files[0])}
                                                className="flex-1"
                                            />
                                            <Button
                                                onClick={() => uploadFile(rental.spaceId)}
                                                disabled={loading || !selectedFile}
                                            >
                                                <Upload className="w-4 h-4 mr-2" />
                                                Upload
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {userRentals.length === 0 && (
                            <p className="text-gray-500 text-center py-4">
                                You haven't rented any storage spaces yet.
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};