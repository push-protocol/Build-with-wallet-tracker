import { getNfts } from "../apis/getNftsMoralis.js";
import { isUrlWorking } from "../utils/isUrlWorking.js";
import { isValidUrl } from "../utils/isValidUrl.js";
import { isBase64Encoded } from "../utils/isBase64Encoded.js";
import { fetchImageAsBase64 } from "../utils/fetchImageAsBase64.js";
import { resizeAndCompressBase64Image } from "../utils/resizeAndCompressBase64Image.js";

const width = 800;
const height = 600;
const quality = 85;

export const getTopNfts = async (address, chainIndex, noOfNfts) => {
  try {
    const nfts = await getNfts(address, chainIndex);
    const nftArr = [];

    for (let i = 0; i < nfts.length; i++) {
      const nft = nfts[i];

      if (nftArr.length >= noOfNfts) {
        break;
      }

      if (!nft.image) {
        continue;
      }

      // 1. Check for URL or base64 encoded image response
      const isUrl = isValidUrl(nft.image);
      const isBase64 = isBase64Encoded(nft.image);

      // neither
      if (!isUrl && !isBase64) {
        continue;
      }

      // isUrl
      if (isUrl) {
        const imageExists = await isUrlWorking(nft.image);

        if (!imageExists) {
          continue;
        }

        const imageBase64 = await fetchImageAsBase64(
          nft.image,
          width,
          height,
          quality
        );

        const nftData = {
          name: nft.name,
          imageUrl: nft.image,
          imageBase64: imageBase64,
        };

        nftArr.push(nftData);
      }

      // isBase64
      if (isBase64) {
        const base64Image = nft.image;

        const compressedBase64 = await resizeAndCompressBase64Image(
          base64Image,
          width,
          height,
          quality
        );

        const nftData = {
          name: nft.name,
          imageUrl: nft.image,
          imageBase64: compressedBase64,
        };

        nftArr.push(nftData);
      }
    }

    // return data
    return nftArr;
  } catch (error) {
    return {
      error: true,
      message: "Something went wrong while getting top NFTs.",
    };
  }
};