// ***************************************************************
// //////////////// Resolve ENS and get address //////////////////
// ***************************************************************
// This helps to resolve an ENS name to get the Ethereum address
// Example: johndoe.eth --> 0x123...abc

import { ethers } from 'ethers';
import 'dotenv/config'

const ETH_RPC_PROVIDER = process.env.ETH_RPC_PROVIDER

export async function resolveENS(ensName) {
    try {
        const provider = new ethers.JsonRpcProvider(ETH_RPC_PROVIDER);
        const resolvedAddress = await provider.resolveName(ensName);

        if (resolvedAddress) {
            return resolvedAddress;
        }

        return { error: true, message: 'Error while resolving ENS address' }

    } catch (error) {
        return { error: true, message: 'Error while resolving ENS address' }
    }
}