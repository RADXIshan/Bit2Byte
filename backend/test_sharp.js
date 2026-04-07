const sharp = require('sharp');
async function test() {
  const buf = Buffer.from(
    '<svg width="10" height="10"><rect width="10" height="10" fill="rgba(255,0,0,0.5)"/></svg>'
  );
  try {
    const {data, info} = await sharp(buf)
      .flatten({ background: '#000000' })
      .toColorspace('srgb')
      .raw()
      .toBuffer({ resolveWithObject: true });
    console.log("Success! Channels:", info.channels);
  } catch (err) {
    console.error(err);
  }
}
test();
