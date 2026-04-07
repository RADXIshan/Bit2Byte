import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function submitJob(file, options, onUploadProgress) {
  const form = new FormData();
  form.append('file', file);
  form.append('options', JSON.stringify(options));
  
  const { data } = await axios.post(`${BASE}/convert`, form, { 
    onUploadProgress 
  });
  return data; // { jobId }
}

export async function pollJob(jobId) {
  const { data } = await axios.get(`${BASE}/job/${jobId}`);
  return data; // { status, progress, result }
}
