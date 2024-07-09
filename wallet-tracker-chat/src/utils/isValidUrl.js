// ***************************************************************
// //////////////////////// Valid URL? ///////////////////////////
// ***************************************************************
// This helps to check if an URL is valid or not based on certain rules

export const isValidUrl = (str) => {
    const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
  
  if (!urlRegex.test(str)) {
    return false;
  }

  try {
    new URL(str);
    return true;
  } catch (_) {
    return false;
  }
};