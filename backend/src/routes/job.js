import express from 'express';
import { getJob } from '../store/jobs.js';

const router = express.Router();

router.get('/:jobId', (req, res) => {
  const jobId = req.params.jobId;
  const job = getJob(jobId);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json({
    status: job.status,
    progress: job.progress,
    result: job.result,
    error: job.error
  });
});

export default router;
