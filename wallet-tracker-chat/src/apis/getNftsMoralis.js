import Moralis from "moralis";
import "dotenv/config";

// Eth, Pol, Bsc, Arb
const CHAINS = ["0x1", "0x89", "0x38", "0xa4b1"];
const MORALIS_API_KEY = process.env.MORALIS_API_KEY;

await Moralis.start({
  apiKey: MORALIS_API_KEY,
});

export const getNfts = async (address, chainIndex) => {
  try {
    const response = await Moralis.EvmApi.nft.getWalletNFTs({
      chain: CHAINS[chainIndex].toString(),
      format: "decimal",
      mediaItems: false,
      excludeSpam: true,
      address: address,
    });

    const data = response.raw.result;

    const results = [];

    data.map((nft, index) => {
      const nftMetadata = JSON.parse(nft.metadata);

      results.push(nftMetadata);
    });

    return results;
  } catch (e) {
    return { error: true, message: "Error while fetching wallet NFTs!" };
  }
};
