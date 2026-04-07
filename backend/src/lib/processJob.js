import { getJob, updateJob } from '../store/jobs.js';
import { imageToAscii } from './asciiEngine.js';
import { videoToAscii } from './videoProcessor.js';

export async function processJob(jobId) {
  const job = getJob(jobId);
  if (!job) return;
  
  updateJob(jobId, { status: 'processing', progress: 5 });

  try {
    const mime = job.options.mimeType || '';
    let result;

    if (mime.startsWith('video/')) {
      result = await videoToAscii(job.filePath, job.options, (p) => {
        updateJob(jobId, { progress: p });
      });
    } else {
      result = await imageToAscii(job.filePath, job.options);
      updateJob(jobId, { progress: 90 });
    }

    updateJob(jobId, { status: 'done', progress: 100, result });
  } catch (err) {
    console.error("Job processing error:", err);
    updateJob(jobId, { status: 'failed', error: err.message });
  }
}
