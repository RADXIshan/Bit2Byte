import React, { useState, useEffect, useCallback, useRef } from 'react';
import UploadZone from './components/UploadZone';
import Controls from './components/Controls';
import OutputViewer from './components/OutputViewer';
import ProgressBar from './components/ProgressBar';
import { submitJob, pollJob } from './services/api';
import { Sparkles, Terminal } from 'lucide-react';

export default function App() {
  const [file, setFile] = useState(null);
  const [options, setOptions] = useState({});
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState('idle'); // idle, uploading, processing, done, failed
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  const pollIntervalRef = useRef(null);

  const startPolling = useCallback((id) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    
    pollIntervalRef.current = setInterval(async () => {
      try {
        const data = await pollJob(id);
        setProgress(data.progress || 0);

        if (data.status === 'done') {
          clearInterval(pollIntervalRef.current);
          setResult(data.result);
          setJobStatus('done');
        } else if (data.status === 'failed') {
          clearInterval(pollIntervalRef.current);
          setErrorMsg(data.error || 'Job failed');
          setJobStatus('failed');
        }
      } catch (err) {
        console.error('Polling error', err);
        clearInterval(pollIntervalRef.current);
        setErrorMsg('Lost connection to server');
        setJobStatus('failed');
      }
    }, 1500);
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const handleConvert = async () => {
    if (!file) return;
    
    setJobStatus('uploading');
    setProgress(0);
    setErrorMsg('');
    setResult(null);

    try {
      const data = await submitJob(file, options, (event) => {
        const p = Math.round((event.loaded * 100) / event.total);
        // Upload is only the first part, let's say 100% upload is 'uploading'
        if (p < 100) {
          setProgress(p);
        } else {
          setJobStatus('processing');
          setProgress(0);
        }
      });
      
      setJobId(data.jobId);
      startPolling(data.jobId);
    } catch (err) {
      console.error(err);
      setJobStatus('failed');
      setErrorMsg(err.response?.data?.error || err.message);
    }
  };

  const handleClear = () => {
    setFile(null);
    setResult(null);
    setJobId(null);
    setJobStatus('idle');
    setProgress(0);
    setErrorMsg('');
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex items-center gap-3 py-4 border-b border-zinc-800">
          <div className="p-3 bg-indigo-500/10 rounded-xl">
            <Terminal className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-indigo-400 to-emerald-400">
              Bit2Byte
            </h1>
            <p className="text-zinc-400 text-sm">Next-gen ASCII & Binary Art Converter</p>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column - Inputs */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-xl">
              <UploadZone 
                onFileSelect={setFile} 
                selectedFile={file} 
                onClear={handleClear}
              />
            </div>

            <Controls 
              onChange={setOptions} 
              fileType={file?.type} 
            />
            
            <button
              onClick={handleConvert}
              disabled={!file || jobStatus === 'uploading' || jobStatus === 'processing'}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all bg-linear-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] active:translate-y-0"
            >
              <Sparkles className="w-5 h-5" />
              CONVERT NOW
            </button>
          </div>

          {/* Right Column - Outputs */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Progress Area */}
            {(jobStatus === 'uploading' || jobStatus === 'processing') && (
              <ProgressBar 
                progress={progress} 
                label={jobStatus === 'uploading' ? 'Uploading file...' : 'Processing on server...'} 
              />
            )}
            
            {/* Error State */}
            {jobStatus === 'failed' && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-6 text-center">
                <p className="font-semibold mb-1">Conversion Failed</p>
                <p className="text-sm opacity-80">{errorMsg}</p>
              </div>
            )}

            {/* Empty State */}
            {jobStatus === 'idle' && !result && (
              <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/50 p-12 text-zinc-500 min-h-[400px]">
                <Terminal className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg">Awaiting Input</p>
                <p className="text-sm opacity-70">Upload a file and click convert to see magic happen.</p>
              </div>
            )}

            {/* Viewer */}
            {result && (
              <OutputViewer result={result} options={options} />
            )}
            
          </div>
        </main>

      </div>
    </div>
  );
}