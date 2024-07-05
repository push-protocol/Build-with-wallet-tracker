// ***************************************************************
// /////////////////// Valid Wallet Address /////////////////////
// ***************************************************************
// This helps to check if an Ethereum address is valid or not

import { ethers } from 'ethers';

export function checkValidWalletAddress(address) {
    // Basic check for length and prefix
    if (!address || address.length !== 42 || !address.startsWith('0x')) {
        return false;
    }

    // Check for valid hex characters
    const hexRegex = /^0x[0-9A-Fa-f]{40}$/;
    if (!hexRegex.test(address)) {
        return false;
    }

    // Use ethers.js to validate the checksum
    try {
        const checksumAddress = ethers.getAddress(address);
        return checksumAddress === address;
    } catch (error) {
        return false;
    }
}
