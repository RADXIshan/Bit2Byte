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
    <div className="min-h-screen p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex items-center gap-4 py-4 mb-4 border-b-4 border-black pb-6">
          <div className="p-3 bg-yellow-300 border-4 border-black shadow-[4px_4px_0_0_black] rounded-xl flex items-center justify-center -rotate-3 hover:rotate-3 transition-transform">
            <Terminal className="w-8 h-8 text-black" />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-white [-webkit-text-stroke:2px_black] drop-shadow-[4px_4px_0_rgba(0,0,0,1)]">
              Bit2Byte
            </h1>
            <p className="text-black font-bold text-lg mt-1 background-white px-2 py-0.5 bg-white border-2 border-black inline-block shadow-[2px_2px_0_0_black]">
              Next-gen ASCII & Binary Art Converter
            </p>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column - Inputs */}
          <div className="lg:col-span-12 xl:col-span-4 space-y-6">
            <div className="bg-white border-4 border-black rounded-xl p-5 shadow-[8px_8px_0_0_black]">
              <UploadZone 
                onFileSelect={setFile} 
                selectedFile={file} 
                onClear={handleClear}
              />
            </div>

            <div className="bg-white border-4 border-black rounded-xl p-5 shadow-[8px_8px_0_0_black]">
              <Controls 
                onChange={setOptions} 
                fileType={file?.type} 
              />
            </div>
            
            <button
              onClick={handleConvert}
              disabled={!file || jobStatus === 'uploading' || jobStatus === 'processing'}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-black text-xl text-black bg-lime-400 border-4 border-black shadow-[6px_6px_0_0_black] transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 hover:shadow-[8px_8px_0_0_black] active:translate-y-1.5 active:translate-x-1.5 active:shadow-none hover:bg-lime-300"
            >
              <Sparkles className="w-6 h-6" />
              CONVERT NOW
            </button>
          </div>

          {/* Right Column - Outputs */}
          <div className="lg:col-span-12 xl:col-span-8 flex flex-col gap-6">
            
            {/* Progress Area */}
            {(jobStatus === 'uploading' || jobStatus === 'processing') && (
              <ProgressBar 
                progress={progress} 
                label={jobStatus === 'uploading' ? 'Uploading file...' : 'Processing on server...'} 
              />
            )}
            
            {/* Error State */}
            {jobStatus === 'failed' && (
              <div className="bg-red-200 border-4 border-black text-red-900 rounded-xl p-6 shadow-[8px_8px_0_0_black] font-bold text-center">
                <p className="text-xl mb-2 flex items-center justify-center gap-2">
                  <span className="text-2xl">⚠️</span> Conversion Failed
                </p>
                <p className="text-sm border-2 border-black bg-white inline-block px-3 py-1 mt-2">{errorMsg}</p>
              </div>
            )}

            {/* Empty State */}
            {jobStatus === 'idle' && !result && (
              <div className="flex-1 flex flex-col items-center justify-center border-4 border-black border-dashed rounded-xl bg-white/50 p-12 text-black min-h-[400px]">
                <Terminal className="w-20 h-20 mb-6 text-black opacity-30" />
                <p className="text-3xl font-black uppercase mb-4 text-white [-webkit-text-stroke:2px_black] drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">Awaiting Input</p>
                <p className="font-bold text-lg bg-yellow-200 px-4 py-2 border-2 border-black shadow-[4px_4px_0_0_black]">Upload a file and click convert to see magic happen.</p>
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