export const isIpfsUrl = (url) => {
    const ipfsRegex = /^ipfs:\/\/[a-zA-Z0-9]+(?:\/[a-zA-Z0-9._-]+)*$/;
    return ipfsRegex.test(url);
}