import React, { useState, useEffect, useRef } from 'react';
import { Copy, Download, Play, Pause, SkipBack, SkipForward, Check } from 'lucide-react';

export default function OutputViewer({ result, options }) {
  const [fontSize, setFontSize] = useState(7);
  const [copied, setCopied] = useState(false);
  
  // Video frame state
  const isVideo = result.frames && result.frames.length > 0;
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(!options.previewFirstFrame);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isVideo && isPlaying) {
      intervalRef.current = setInterval(() => {
        setFrameIndex((prev) => (prev + 1) % result.frames.length);
      }, 1000 / (options.fps || 6));
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isVideo, isPlaying, options.fps, result?.frames?.length]);

  const currentContent = isVideo ? result.frames[frameIndex] : result.content;
  const isHtml = result.type === 'html';

  const handleCopy = async () => {
    // If it's HTML, copy the raw HTML text
    try {
      await navigator.clipboard.writeText(currentContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const downloadText = () => {
    const blob = new Blob([currentContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `art-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadHtml = () => {
    const htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>ASCII Art</title>
<style>
  body { background: #000; display: flex; justify-content: center; padding: 2rem; margin: 0; min-height: 100vh; }
  pre { font-family: monospace; line-height: 1; font-size: ${fontSize}px; padding: 1rem; }
</style>
</head><body>
<pre>${currentContent}</pre>
</body></html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `art-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white border-4 border-black rounded-xl overflow-hidden shadow-[8px_8px_0_0_black] flex flex-col h-full max-h-[80vh]">
      <div className="flex flex-wrap items-center justify-between p-4 border-b-4 border-black bg-pink-100 gap-4">
        {/* Playback Controls if video */}
        {isVideo ? (
          <div className="flex items-center gap-2 bg-yellow-200 border-2 border-black rounded p-1 shadow-[2px_2px_0_0_black]">
            <button onClick={() => setFrameIndex(Math.max(0, frameIndex - 1))} className="p-1.5 text-black hover:bg-white hover:border-black border-2 border-transparent transition-all rounded active:translate-y-px">
              <SkipBack className="w-5 h-5" />
            </button>
            <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 text-white bg-black border-2 border-black rounded hover:bg-zinc-800 transition-all active:translate-y-px">
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <button onClick={() => setFrameIndex((frameIndex + 1) % result.frames.length)} className="p-1.5 text-black hover:bg-white hover:border-black border-2 border-transparent transition-all rounded active:translate-y-px">
              <SkipForward className="w-5 h-5" />
            </button>
            <span className="text-sm font-black uppercase text-black bg-white border-2 border-black px-2 py-0.5 ml-2 shadow-[1px_1px_0_0_black]">
              {frameIndex + 1} / {result.frames.length}
            </span>
          </div>
        ) : <div />}

        <div className="flex items-center gap-4 flex-wrap">
          {/* Zoom Control */}
          <div className="flex items-center gap-3 bg-white border-2 border-black px-3 py-2 shadow-[2px_2px_0_0_black]">
            <span className="text-sm font-black uppercase">Zoom</span>
            <input 
              type="range" min="4" max="20" 
              value={fontSize} 
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-24 h-2 bg-orange-200 border-2 border-black rounded appearance-none cursor-pointer accent-black shadow-[1px_1px_0_0_black]"
            />
            <span className="text-xs font-black uppercase bg-black text-white px-1 py-0.5">{fontSize}px</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button 
              onClick={handleCopy} 
              className={`flex items-center gap-2 px-4 py-2 font-black uppercase text-black border-2 border-black shadow-[3px_3px_0_0_black] transition-all hover:-translate-y-0.5 active:translate-y-1 active:shadow-none ${copied ? 'bg-emerald-300' : 'bg-cyan-300 hover:bg-cyan-200'}`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button 
              onClick={downloadText} 
              disabled={isHtml} 
              className="flex items-center gap-2 px-4 py-2 font-black uppercase text-black border-2 border-black bg-pink-300 shadow-[3px_3px_0_0_black] transition-all hover:-translate-y-0.5 hover:bg-pink-200 active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-1"
            >
              <Download className="w-4 h-4" /> TXT
            </button>
            <button 
              onClick={downloadHtml} 
              className="flex items-center gap-2 px-4 py-2 font-black uppercase text-black border-2 border-black bg-pink-300 shadow-[3px_3px_0_0_black] transition-all hover:-translate-y-0.5 hover:bg-pink-200 active:translate-y-1 active:shadow-none"
            >
              <Download className="w-4 h-4" /> HTML
            </button>
          </div>
        </div>
      </div>

      {/* Adding an inner border-t if necessary, but the black background separates it well. */}
      <div className="flex-1 overflow-auto bg-black p-4 md:p-8 flex justify-center items-start ascii-output min-h-[400px]">
        {isHtml ? (
          <pre 
            style={{ fontFamily: 'monospace', lineHeight: 1, fontSize: `${fontSize}px` }} 
            dangerouslySetInnerHTML={{ __html: currentContent }}
          />
        ) : (
          <pre style={{ fontFamily: 'monospace', lineHeight: 1, fontSize: `${fontSize}px`, color: '#fff' }}>
            {currentContent}
          </pre>
        )}
      </div>
    </div>
  );
}
