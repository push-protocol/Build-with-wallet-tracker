export const isBase64Encoded = (str) => {
    if (typeof str !== 'string') {
      return false;
    }
  
    // Base64 regex pattern
    const base64Regex = /^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/;
  
    // Check if the string length is a multiple of 4
    if (str.length % 4 !== 0) {
      return false;
    }
  
    // Test the string against the regex
    return base64Regex.test(str);
  };