// ***************************************************************
// //////////////// Resize and compress base64 ///////////////////
// ***************************************************************
// This helps to get a bae64 string and compress it to make it compatible for Push Chat

import sharp from "sharp";

// Function to resize and compress a base64 encoded image
export const resizeAndCompressBase64Image = async (base64, width, height, quality) => {
  try {
    const base64ImagePrefix = base64.split(",")[0];
    const base64Image = base64.split(",")[1];
    
    // Decode the base64 image to a buffer
    const imageBuffer = Buffer.from(base64Image, "base64");

    // Use sharp to resize and compress the image
    const compressedImageBuffer = await sharp(imageBuffer)
      .resize(width, height, {
        fit: sharp.fit.inside,
        withoutEnlargement: true,
      })
      .jpeg({ quality: quality }) // Adjust quality (1-100)
      .toBuffer();

    // Encode the processed image buffer back to a base64 string
    const compressedBase64Image = compressedImageBuffer.toString("base64");

    // Form the base64 image string
    return `data:image/jpeg;base64,${compressedBase64Image}`;

  } catch (error) {
    console.error("Error processing image:", error);
    throw error;
  }
};
