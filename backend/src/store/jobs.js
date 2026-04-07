import fs from 'fs/promises';

const jobs = new Map();

export function createJob(jobId, filePath, options) {
  jobs.set(jobId, { status: 'queued', progress: 0, filePath, options, result: null, createdAt: Date.now() });
}

export function updateJob(jobId, patch) {
  if (jobs.has(jobId)) {
    jobs.set(jobId, { ...jobs.get(jobId), ...patch });
  }
}

export function getJob(jobId) {
  return jobs.get(jobId);
}

// Cleanup interval to delete stale jobs and files
setInterval(() => {
  const now = Date.now();
  for (const [id, job] of jobs.entries()) {
    if (now - job.createdAt > 10 * 60 * 1000) {
      fs.rm(job.filePath, { force: true }).catch(err => console.error(err));
      if (job.outputPath) {
        fs.rm(job.outputPath, { recursive: true, force: true }).catch(err => console.error(err));
      }
      jobs.delete(id);
    }
  }
}, 60_000);
