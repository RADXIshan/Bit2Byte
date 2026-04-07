import sharp from 'sharp';

export async function imageToAscii(filePath, options) {
  const { width = 120, charset = ' .:-=+*#%@', invert = false, color = false, imageFilter = 'None' } = options;

  let image = sharp(filePath);
  const meta = await image.metadata();

  // Correct for character aspect ratio
  const height = Math.max(1, Math.round((meta.height / meta.width) * width * 0.45));

  image = image
    .resize({ width, height, fastShrinkOnLoad: true, kernel: sharp.kernel.lanczos3 })
    .normalize()
    .modulate({ saturation: 1.2, brightness: 1.05 });

  // Apply filters
  if (imageFilter === 'Sharpen') {
    image = image.sharpen();
  } else if (imageFilter === 'Edge Tracing') {
    image = image.convolve({
      width: 3,
      height: 3,
      kernel: [
        -1, -1, -1,
        -1,  8, -1,
        -1, -1, -1
      ]
    });
  } else if (imageFilter === 'Sepia') {
    image = image.recomb([
      [0.393, 0.769, 0.189],
      [0.349, 0.686, 0.168],
      [0.272, 0.534, 0.131]
    ]);
  } else if (imageFilter === 'Grayscale') {
    image = image.greyscale();
  }

  if (color) {
    const { data, info } = await image
      .flatten({ background: '#000000' })
      .toColorspace('srgb')
      .raw()
      .toBuffer({ resolveWithObject: true });

    const channels = info.channels || 3;
    let htmlArray = [];
    
    for (let i = 0; i < data.length; i += channels) {
      const r = data[i];
      // For grayscale images returned as 1 channel even after toColorspace (depends on sharp version), ensure we don't read out of bounds.
      const g = channels > 1 ? data[i + 1] : r;
      const b = channels > 2 ? data[i + 2] : r;
      
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      let idx = Math.round((lum / 255) * (charset.length - 1));
      if (invert) idx = charset.length - 1 - idx;
      idx = Math.max(0, Math.min(charset.length - 1, idx));
      
      if (charset[idx] === ' ') {
        htmlArray.push('&nbsp;');
      } else {
        htmlArray.push(`<span style="color:rgb(${r},${g},${b})">${charset[idx]}</span>`);
      }
      
      if ((i / channels + 1) % width === 0) htmlArray.push('\n');
    }
    return { type: 'html', content: htmlArray.join(''), metadata: { width: meta.width, height: meta.height } };
  } else {
    const { data } = await image
      .flatten({ background: '#000000' })
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    let text = '';
    for (let i = 0; i < data.length; i++) {
      let idx = Math.round((data[i] / 255) * (charset.length - 1));
      if (invert) idx = charset.length - 1 - idx;
      
      idx = Math.max(0, Math.min(charset.length - 1, idx));
      text += charset[idx];
      if ((i + 1) % width === 0) text += '\n';
    }
    return { type: 'text', content: text, metadata: { width: meta.width, height: meta.height } };
  }
}
