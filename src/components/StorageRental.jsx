import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload } from 'lucide-react';
import { useWeb3 } from '../hooks/useWeb3';
import { storageContract } from '../contracts/StorageContract';

export const StorageRental = () => {
    const { isConnected, account, error: web3Error, connectWallet } = useWeb3();
    const [availableSpaces, setAvailableSpaces] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        console.log("Wallet connection status:", isConnected);
        if (isConnected) {
            loadAvailableSpaces();
        }
    }, [isConnected]);
    
const loadAvailableSpaces = async () => {
    try {
        const spaces = await storageContract.getAvailableSpaces();
        console.log("Available spaces:", spaces);
        setAvailableSpaces(spaces);
    } catch (err) {
        setError("Failed to load available spaces: " + err.message);
        console.error(err);
    }
};

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const rentAndUpload = async (spaceId) => {
        try {
            setLoading(true);
            setError('');
            setSuccess('');

            const space = availableSpaces.find(s => s.id === spaceId);
            const totalCost = space.pricePerGB * space.spaceSize * 30n;
            console.log("Renting storage space:", spaceId, "Total cost:", totalCost);
            
            // Rent storage
            await storageContract.rentStorage(spaceId, 30, totalCost);

            // Handle file upload
            if (selectedFile) {
                const mockFileHash = ethers.keccak256(ethers.toUtf8Bytes(selectedFile.name));
                await storageContract.recordFileUpload(spaceId, mockFileHash);

                const formData = new FormData();
                formData.append('file', selectedFile);
                
                // Replace with your backend endpoint
                await fetch('http://localhost:3001/upload', {
                    method: 'POST',
                    body: formData
                });

                setSuccess('Storage rented and file uploaded successfully!');
                await loadAvailableSpaces();
            }
        } catch (err) {
            setError("Transaction failed: " + err.message);
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
            <Card>
                <CardHeader>
                    <CardTitle>Decentralized Storage Rental</CardTitle>
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

                    <div className="mb-4">
                        <Input
                            type="file"
                            onChange={handleFileChange}
                            className="mb-2"
                        />
                    </div>

                    <div className="grid gap-4">
                        {availableSpaces.map((space) => (
                            <Card key={space.id}>
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-medium">Storage Space #{space.id}</p>
                                            <p className="text-sm text-gray-500">
                                                Size: {space.spaceSize}GB
                                                <br />
                                                Price: {ethers.formatEther(space.pricePerGB)} ETH/GB
                                            </p>
                                        </div>
                                        <Button
                                            onClick={() => rentAndUpload(space.id)}
                                            disabled={!selectedFile || loading}
                                        >
                                            <Upload className="w-4 h-4 mr-2" />
                                            Rent & Upload
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
