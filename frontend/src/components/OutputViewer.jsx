import React, { useState, useEffect, useRef } from 'react';
import { Copy, Download, Play, Pause, SkipBack, SkipForward, Check, Video, Image as ImageIcon, Filter } from 'lucide-react';

const POST_FILTERS = {
  'Normal': 'none',
  'Sepia': 'sepia(1)',
  'Matrix': 'hue-rotate(120deg) saturate(2) brightness(1.2)',
  'Cyberpunk': 'hue-rotate(270deg) contrast(1.5)',
  'Synthwave': 'hue-rotate(270deg) saturate(2)',
  'Vintage': 'contrast(1.2) sepia(0.5) brightness(0.9)',
  'Invert': 'invert(1)'
};

export default function OutputViewer({ result, options }) {
  const [fontSize, setFontSize] = useState(7);
  const [copied, setCopied] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [postFilter, setPostFilter] = useState('none');
  
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

  const renderContentToCanvas = async (contentStr) => {
    const canvas = document.createElement('canvas');
    const strippedSample = contentStr.replace(/<[^>]*>?/gm, '');
    const columns = Math.max(10, strippedSample.split('\\n')[0].length);
    const rows = strippedSample.split('\\n').length;
    
    const charW = fontSize * 0.6;
    const charH = fontSize;
    canvas.width = Math.max(100, Math.floor(columns * charW) + 40);
    canvas.height = Math.max(100, Math.floor(rows * charH) + 40);

    const ctx = canvas.getContext('2d');
    
    return new Promise((resolve) => {
      ctx.filter = postFilter !== 'none' ? postFilter : 'none';
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (isHtml) {
        const safeContent = contentStr.replace(/&nbsp;/g, '&#160;');
        const svg = `
          <svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
            <foreignObject width="100%" height="100%">
              <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: monospace; line-height: 1; font-size: ${fontSize}px; padding: 20px; color: #fff; background: transparent; margin: 0; white-space: pre; box-sizing: border-box;">
                ${safeContent}
              </div>
            </foreignObject>
          </svg>
        `;
        const img = new Image();
        const safeSvg = svg.replace(/#/g, '%23').replace(/\\n/g, '');
        const url = 'data:image/svg+xml;charset=utf-8,' + safeSvg;
        
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
          resolve(canvas);
        };
        img.onerror = () => {
          resolve(canvas); 
        };
        img.src = url;
      } else {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `${fontSize}px monospace`;
        ctx.textBaseline = 'top';
        const lines = contentStr.split('\\n');
        for (let i = 0; i < lines.length; i++) {
          ctx.fillText(lines[i], 20, 20 + i * charH);
        }
        resolve(canvas);
      }
    });
  };

  const downloadImage = async () => {
    setIsRendering(true);
    try {
      const canvas = await renderContentToCanvas(currentContent);
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `art-${Date.now()}.png`;
      a.click();
    } catch (err) {
      console.error(err);
    }
    setIsRendering(false);
  };

  const downloadVideo = async () => {
    if (!isVideo || result.frames.length === 0) return;
    setIsRendering(true);

    try {
      const canvas = document.createElement('canvas');
      const sample = result.frames[0];
      const strippedSample = sample.replace(/<[^>]*>?/gm, '');
      const columns = Math.max(10, strippedSample.split('\\n')[0].length);
      const rows = strippedSample.split('\\n').length;
      
      const charW = fontSize * 0.6;
      const charH = fontSize;
      canvas.width = Math.max(100, Math.floor(columns * charW) + 40);
      canvas.height = Math.max(100, Math.floor(rows * charH) + 40);

      const ctx = canvas.getContext('2d');
      const fps = options.fps || 6;
      const stream = canvas.captureStream(fps);
      // Ensure we use a widely supported mime type
      const mimeType = 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks = [];

      recorder.ondataavailable = e => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.start();

      for (let i = 0; i < result.frames.length; i++) {
        const frameCanvas = await renderContentToCanvas(result.frames[i]);
        // Actually rendering logic overrides original canvas, so we need to just draw to main canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(frameCanvas, 0, 0);
        // Request a frame explicitly for browsers that need it
        if (stream.getVideoTracks().length > 0 && typeof stream.getVideoTracks()[0].requestFrame === 'function') {
          stream.getVideoTracks()[0].requestFrame(); 
        }
        await new Promise(r => setTimeout(r, 1000 / fps));
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `art-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setIsRendering(false);
      };
      
      recorder.stop();
    } catch (err) {
      console.error(err);
      setIsRendering(false);
    }
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
              onClick={downloadImage} 
              disabled={isRendering}
              className="flex items-center gap-2 px-4 py-2 font-black uppercase text-black border-2 border-black bg-pink-300 shadow-[3px_3px_0_0_black] transition-all hover:-translate-y-0.5 hover:bg-pink-200 active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-1"
            >
              {isRendering && !isVideo ? (
                <span className="w-4 h-4 inline-block border-2 border-black border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <ImageIcon className="w-4 h-4" />
              )}
              {isRendering && !isVideo ? 'Saving...' : 'PNG'}
            </button>
            {isVideo && (
              <button 
                onClick={downloadVideo} 
                disabled={isRendering}
                className="flex items-center gap-2 px-4 py-2 font-black uppercase text-black border-2 border-black bg-yellow-300 shadow-[3px_3px_0_0_black] transition-all hover:-translate-y-0.5 hover:bg-yellow-200 active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-1"
              >
                {isRendering ? (
                  <span className="w-4 h-4 inline-block border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <Video className="w-4 h-4" />
                )}
                {isRendering ? 'Rendering...' : 'WEBM'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between p-4 border-b-4 border-black bg-violet-200 gap-4" style={{ backgroundColor: '#ddd6fe' }}>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-black hidden sm:block" />
          <select 
            value={Object.keys(POST_FILTERS).find(key => POST_FILTERS[key] === postFilter) || 'Normal'}
            onChange={(e) => setPostFilter(POST_FILTERS[e.target.value])}
            className="bg-white border-2 border-black text-black font-bold uppercase rounded px-2 py-1 focus:ring-0 focus:outline-none shadow-[2px_2px_0_0_black] active:translate-y-px active:translate-x-px active:shadow-none transition-all cursor-pointer text-sm"
          >
            {Object.keys(POST_FILTERS).map((key) => (
              <option key={key} value={key}>{key} Filter</option>
            ))}
          </select>
        </div>
      </div>

      {/* Adding an inner border-t if necessary, but the black background separates it well. */}
      <div 
        className="flex-1 overflow-auto bg-black p-4 md:p-8 flex justify-center items-start ascii-output min-h-[400px]"
        style={{ filter: postFilter !== 'none' ? postFilter : 'none', transition: 'filter 0.3s ease' }}
      >
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
