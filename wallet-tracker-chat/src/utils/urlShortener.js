import axios from "axios";
import "dotenv/config";

const BITLY_ACCESS_TOKEN = process.env.BITLY_ACCESS_TOKEN;

export const urlShortener = async (longUrl) => {
  try {
    const response = await axios.post(
      "https://api-ssl.bitly.com/v4/shorten",
      {
        long_url: longUrl,
        domain: "bit.ly",
      },
      {
        headers: {
          Authorization: `Bearer ${BITLY_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.link;
  } catch (error) {
    console.error(error.response ? error.response.data : error.message);
    return {
      error: true,
      message: "Something went wrong while shortening the URL",
    };
  }
};
