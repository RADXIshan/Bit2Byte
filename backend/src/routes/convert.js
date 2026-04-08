import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import os from 'os';
import { createJob } from '../store/jobs.js';
import { processJob } from '../lib/processJob.js';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import fs from 'fs/promises';

ffmpeg.setFfmpegPath(ffmpegStatic);

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, os.tmpdir());
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + uuidv4();
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

router.post('/', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(413).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const mime = req.file.mimetype;
    if (!mime.startsWith('image/') && !mime.startsWith('video/')) {
      return res.status(400).json({ error: 'Invalid file type. Must be image or video.' });
    }

    let options = {};
    if (req.body.options) {
      try {
        options = JSON.parse(req.body.options);
      } catch (err) {
        return res.status(400).json({ error: 'Invalid options JSON.' });
      }
    }
    options.mimeType = mime;

    const jobId = uuidv4();
    createJob(jobId, req.file.path, options);

    // Start processing - on Vercel, this is risky but we trigger it immediately
    // We don't await so we can return the jobId for polling
    processJob(jobId).catch(err => console.error(`Job ${jobId} failed:`, err));

    res.json({ jobId });
  });
});

router.post('/mp4', upload.single('video'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No video uploaded' });

  const inputPath = req.file.path;
  const outputPath = inputPath + '.mp4';

  ffmpeg(inputPath)
    .outputOptions([
      '-c:v libx264',
      '-preset fast',
      '-pix_fmt yuv420p',
      '-movflags +faststart',
      '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2'
    ])
    .toFormat('mp4')
    .on('stderr', (stderrLine) => {
      // Optional: keep track of stderr for more detail on fail
      if (stderrLine.includes('Error')) console.error('FFmpeg Stderr:', stderrLine);
    })
    .on('end', async () => {
      res.download(outputPath, 'video.mp4', async (err) => {
        // Cleanup after download
        await fs.unlink(inputPath).catch(() => {});
        await fs.unlink(outputPath).catch(() => {});
      });
    })
    .on('error', async (err, stdout, stderr) => {
      console.error('FFmpeg error:', err.message);
      console.error('FFmpeg stderr:', stderr);
      await fs.unlink(inputPath).catch(() => {});
      res.status(500).json({ error: 'Conversion failed: ' + err.message });
    })
    .save(outputPath);
});

export default router;
