import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { imageToAscii } from './asciiEngine.js';
import path from 'path';
import fs from 'fs/promises';

ffmpeg.setFfmpegPath(ffmpegStatic);

export async function videoToAscii(filePath, options, onProgress) {
  const { fps = 6, width = 100, charset, invert, color } = options;
  const framesDir = filePath + '_frames';
  await fs.mkdir(framesDir, { recursive: true });

  // Get original video dimensions
  let originalMetadata = { width: 1280, height: 720 }; // Fallback
  try {
    const probe = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) reject(err);
        else resolve(metadata);
      });
    });
    const videoStream = probe.streams.find(s => s.codec_type === 'video');
    if (videoStream) {
      originalMetadata.width = videoStream.width;
      originalMetadata.height = videoStream.height;
    }
  } catch (err) {
    console.error('ffprobe error:', err);
  }

  try {
    // Extract frames - limiting to max 60 frames for reliability on serverless
    // If the video is 10 seconds at 6FPS, that's exactly 60 frames.
    const maxFrames = 60;
    
    await new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .outputOptions([
          `-vf fps=${fps},scale=${width}:-1`, // Resize during extraction for speed
          `-vframes ${maxFrames}`, // Safety cap
          `-q:v 2`
        ])
        .output(path.join(framesDir, 'frame-%04d.jpg'))
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    const frameFiles = (await fs.readdir(framesDir))
      .filter(f => f.endsWith('.jpg'))
      .sort();

    const asciiFrames = [];
    const totalFrames = frameFiles.length;
    
    for (let i = 0; i < totalFrames; i++) {
      const framePath = path.join(framesDir, frameFiles[i]);
      const result = await imageToAscii(framePath, { width, charset, invert, color });
      asciiFrames.push(result.content);
      // Dedicate 80% of progress to this phase
      onProgress(Math.round((i / totalFrames) * 80) + 15); 
    }

    return { type: color ? 'html' : 'text', frames: asciiFrames, metadata: originalMetadata };
  } finally {
    // Ensure cleanup happens even on error
    await fs.rm(framesDir, { recursive: true, force: true }).catch(() => {});
  }
}
