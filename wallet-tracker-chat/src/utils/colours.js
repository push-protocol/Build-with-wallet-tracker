const getRandomColor = () => {
    // Slightly vary the color to add diversity while keeping it bright
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);

    return `rgb(${r}, ${g}, ${b})`;
}

export const getColours = (entries) => {
    const colors = [];
    
    for (let i = 0; i < entries; i++) {
        colors.push(getRandomColor());
    }
    
    // console.log(colors);
    return colors;
}