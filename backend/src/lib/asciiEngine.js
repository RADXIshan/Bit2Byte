import sharp from 'sharp';

export async function imageToAscii(filePath, options) {
  const { width = 120, charset = ' .:-=+*#%@', invert = false, color = false } = options;

  const image = sharp(filePath);
  const meta = await image.metadata();

  // Correct for character aspect ratio (chars are ~2x taller than wide)
  const height = Math.max(1, Math.round((meta.height / meta.width) * width * 0.43));

  if (color) {
    const { data, info } = await image
      .resize(width, height)
      .raw()
      .toBuffer({ resolveWithObject: true });

    let html = '';
    for (let i = 0; i < data.length; i += 3) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      let idx = Math.floor((lum / 255) * (charset.length - 1));
      if (invert) idx = charset.length - 1 - idx;
      
      const char = charset[idx] === ' ' ? '&nbsp;' : charset[idx];
      html += `<span style="color:rgb(${r},${g},${b})">${char}</span>`;
      
      if ((i / 3 + 1) % width === 0) html += '\n';
    }
    return { type: 'html', content: html };
  } else {
    const { data } = await image
      .resize(width, height)
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    let text = '';
    for (let i = 0; i < data.length; i++) {
      let idx = Math.floor((data[i] / 255) * (charset.length - 1));
      if (invert) idx = charset.length - 1 - idx;
      
      // Ensure we don't go out of bounds somehow
      idx = Math.max(0, Math.min(charset.length - 1, idx));
      text += charset[idx];
      if ((i + 1) % width === 0) text += '\n';
    }
    return { type: 'text', content: text };
  }
}
