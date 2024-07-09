// ***************************************************************
// /////////////////////////// Capitalize ////////////////////////
// ***************************************************************
// This helps to capitalize the first letter of an element in an array
// Example: ["hello", "hi", "hey"] --> Hello Hi Hey

export const capitalizeEveryWordLetter = (title) => {
    const updateStr = title.map((word) => {
      if (/^[a-zA-Z]$/.test(word.charAt(0))) {
        if (!(word === 'on' || word === 'out' || word === 'in' || word === 'for' || word === 'of')) {
          return word.charAt(0).toUpperCase() + word.slice(1);
        } else return word;
      }
    });
    return updateStr.join(' ');
  }