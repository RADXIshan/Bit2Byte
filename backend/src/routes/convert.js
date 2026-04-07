import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import os from 'os';
import { createJob } from '../store/jobs.js';
import { processJob } from '../lib/processJob.js';

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

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded or file exceeds 50MB' });
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

  // Fire and forget
  processJob(jobId);

  res.json({ jobId });
});

export default router;
