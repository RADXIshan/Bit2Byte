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
    <div className="bg-zinc-900 border border-zinc-700/50 rounded-xl overflow-hidden shadow-2xl flex flex-col h-full max-h-[80vh]">
      <div className="flex flex-wrap items-center justify-between p-3 border-b border-zinc-800 bg-zinc-950/50 gap-3">
        {/* Playback Controls if video */}
        {isVideo ? (
          <div className="flex items-center gap-2 bg-zinc-900 rounded-lg p-1 border border-zinc-800">
            <button onClick={() => setFrameIndex(Math.max(0, frameIndex - 1))} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded">
              <SkipBack className="w-4 h-4" />
            </button>
            <button onClick={() => setIsPlaying(!isPlaying)} className="p-1.5 text-indigo-400 hover:text-indigo-300 hover:bg-zinc-800 rounded">
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button onClick={() => setFrameIndex((frameIndex + 1) % result.frames.length)} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded">
              <SkipForward className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-zinc-500 px-2 min-w-[60px] text-center">
              {frameIndex + 1} / {result.frames.length}
            </span>
          </div>
        ) : <div />}

        <div className="flex items-center gap-4 flex-wrap">
          {/* Zoom Control */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Aa</span>
            <input 
              type="range" min="4" max="20" 
              value={fontSize} 
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-24 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <span className="text-xs text-zinc-400 font-mono">{fontSize}px</span>
          </div>

          <div className="h-4 w-px bg-zinc-800 mx-1"></div>

          {/* Action Buttons */}
          <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button onClick={downloadText} disabled={isHtml} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <Download className="w-3.5 h-3.5" /> TXT
          </button>
          <button onClick={downloadHtml} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors">
            <Download className="w-3.5 h-3.5" /> HTML
          </button>
        </div>
      </div>

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
