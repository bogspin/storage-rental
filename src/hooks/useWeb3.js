import { useState, useEffect } from 'react';
import { storageContract } from '../contracts/StorageContract';

export function useWeb3() {
    const [isConnected, setIsConnected] = useState(false);
    const [account, setAccount] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const init = async () => {
            try {
                if (typeof window.ethereum === 'undefined') {
                    throw new Error('Please install MetaMask!');
                }

                window.ethereum.on('accountsChanged', (accounts) => {
                    if (accounts.length > 0) {
                        setAccount(accounts[0]);
                        setIsConnected(true);
                    } else {
                        setAccount(null);
                        setIsConnected(false);
                    }
                });

                await storageContract.initialize();
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                    setIsConnected(true);
                }
            } catch (err) {
                setError(err.message);
            }
        };

        init();

        return () => {
            if (window.ethereum) {
                window.ethereum.removeAllListeners('accountsChanged');
            }
        };
    }, []);

    const connectWallet = async () => {
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                setAccount(accounts[0]);
                setIsConnected(true);
            }
        } catch (err) {
            setError(err.message);
        }
    };

    return { isConnected, account, error, connectWallet };
}
