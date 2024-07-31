// ***************************************************************
// //////////////// Compress and convert to base64 ///////////////
// ***************************************************************
// This helps to first compress an image fetched from an URL and then convert it into base64

import axios from "axios";
import sharp from "sharp";

// Function to fetch image and convert to base64
export const fetchImageAsBase64 = async (url, width, height, quality) => {
  try {
    // Fetch the image as binary data
    const response = await axios.get(url, {
      responseType: "arraybuffer",
    });

    // Use sharp to resize and compress the image
    const compressedImageBuffer = await sharp(response.data)
      .resize(width, height, {
        fit: sharp.fit.inside,
        withoutEnlargement: true,
      })
      .jpeg({ quality: quality }) // Adjust quality (1-100)
      .toBuffer();


    // Convert the binary data to a base64 string
    const base64 = compressedImageBuffer.toString("base64");

    // Form the base64 image string
    const base64Image = `data:image/jpeg;base64,${base64}`;

    return base64Image;

  } catch (error) {
    throw error;
  }
};

