// ***************************************************************
// /////////////////// Format Top NFTs /////////////////////
// ***************************************************************
// To format NFTs, consider 2 types of response - NFT image URL and NFT image as Base64
// Push Chat allows only Base64 encoded image and total payload size should be 1MB 

import { getNfts } from "../apis/getNfts.js";
import { isUrlWorking } from "../utils/isUrlWorking.js";
import { isValidUrl } from "../utils/isValidUrl.js";
import { isBase64Encoded } from "../utils/isBase64Encoded.js";
import { fetchImageAsBase64 } from "../utils/fetchImageAsBase64.js";
import { resizeAndCompressBase64Image } from "../utils/resizeAndCompressBase64Image.js";

// Image dimensions and quality
const width = 800;
const height = 600;
const quality = 85;

export const getTopNfts = async (address, chainIndex, noOfNfts) => {
  try {
    const response = await getNfts(address, chainIndex);
    const nftArr = [];

    // Return if error
    if (response.error) {
      return { error: true, message: response.message }
    }

    const nfts = response.data;

    for (let i = 0; i < nfts.length; i++) {
      const nft = nfts[i];

      if (nftArr.length >= noOfNfts) {
        break;
      }

      if (!nft.image) {
        continue;
      }

      // 1. Check for URL or base64 encoded image response
      const isUrl = isValidUrl(nft.image); // NFT image is in URL format?
      const isBase64 = isBase64Encoded(nft.image.split(",")[1]); // NFT image is in base64 format?

      // neither?
      if (!isUrl && !isBase64) {
        continue;
      }

      // isUrl?
      if (isUrl) {

        // Check if URL is working
        const imageExists = await isUrlWorking(nft.image);

        if (!imageExists) {
          continue;
        }

        // Convert URL image data to base64
        const imageBase64 = await fetchImageAsBase64(
          nft.image,
          width,
          height,
          quality
        );

        // Add nft to formatted array
        const nftData = {
          name: nft.name,
          imageUrl: nft.image,
          imageBase64: imageBase64,
        };

        nftArr.push(nftData);
      }

      // isBase64?
      if (isBase64) {
        const base64Image = nft.image;

        // Compress base64 to match compatiblity
        const compressedBase64 = await resizeAndCompressBase64Image(
          base64Image,
          width,
          height,
          quality
        );

        // Add nft to formatted array
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
