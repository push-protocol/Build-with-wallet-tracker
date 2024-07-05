import axios from "axios";

// Function to check if a URL is working
export const isUrlWorking = async (url) => {
    try {
      const response = await axios.head(url);
      return response.status === 200;
    } catch (error) {
      return false;
    }
  };