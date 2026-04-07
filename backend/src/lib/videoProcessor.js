import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { imageToAscii } from './asciiEngine.js';
import path from 'path';
import fs from 'fs/promises';

ffmpeg.setFfmpegPath(ffmpegStatic);

export async function videoToAscii(filePath, options, onProgress) {
  const { fps = 6, width = 120, charset, invert, color } = options;
  const framesDir = filePath + '_frames';
  await fs.mkdir(framesDir, { recursive: true });

  // Extract frames
  await new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .outputOptions([`-vf fps=${fps}`, `-q:v 2`])
      .output(path.join(framesDir, 'frame-%04d.jpg'))
      .on('end', resolve)
      .on('error', reject)
      .run();
  });

  const frameFiles = (await fs.readdir(framesDir))
    .filter(f => f.endsWith('.jpg'))
    .sort();

  const asciiFrames = [];
  for (let i = 0; i < frameFiles.length; i++) {
    const framePath = path.join(framesDir, frameFiles[i]);
    const result = await imageToAscii(framePath, { width, charset, invert, color });
    asciiFrames.push(result.content);
    // Dedicate 90% of progress to this phase (first 10% could be extraction theoretically, but we use 0-90 here for processing per original instructions)
    onProgress(Math.round((i / frameFiles.length) * 90) + 5); 
  }

  await fs.rm(framesDir, { recursive: true, force: true }).catch(err => console.error(err));
  return { type: color ? 'html' : 'text', frames: asciiFrames };
}
