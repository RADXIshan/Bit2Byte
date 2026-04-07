import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://bit2byte-server.vercel.app' : 'http://localhost:3001');

export async function submitJob(file, options, onUploadProgress) {
  const form = new FormData();
  form.append('file', file);
  form.append('options', JSON.stringify(options));
  
  try {
    const { data } = await axios.post(`${BASE}/convert`, form, { 
      onUploadProgress 
    });
    return data; // { jobId }
  } catch (err) {
    if (err.response?.data?.error) {
      throw new Error(err.response.data.error);
    }
    if (err.code === 'ERR_NETWORK') {
      throw new Error('Connection failed. This might be due to CORS or a file that is too large for the server (Max 4.5MB).');
    }
    throw err;
  }
}

export async function pollJob(jobId) {
  const { data } = await axios.get(`${BASE}/job/${jobId}`);
  return data; // { status, progress, result }
}
