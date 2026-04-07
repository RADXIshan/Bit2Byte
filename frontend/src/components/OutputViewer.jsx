import React, { useState, useEffect, useRef } from 'react';
import { Copy, Download, Play, Pause, SkipBack, SkipForward, Check, Video, Image as ImageIcon, Filter, RotateCcw } from 'lucide-react';

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
        setFrameIndex((prev) => {
          const next = prev + 1;
          if (next >= result.frames.length) {
            if (options.loop === false) {
              setIsPlaying(false);
              return prev;
            }
            return 0;
          }
          return next;
        });
      }, 1000 / (options.fps || 6));
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isVideo, isPlaying, options.fps, options.loop, result?.frames?.length]);

  const currentContent = isVideo ? result.frames[frameIndex] : result.content;
  const isHtml = result.type === 'html';
  const isAtEnd = isVideo && !options.loop && frameIndex === result.frames.length - 1 && !isPlaying;

  const handleRestart = () => {
    setFrameIndex(0);
    setIsPlaying(true);
  };

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

  const renderContentToCanvas = async (contentStr, targetCanvas = null) => {
    // 1. Pre-process content to find the bounding box (actual pixels)
    const allLines = contentStr.split(/\r?\n|\\n/);
    // Strip HTML tags for measurement and trim trailing whitespace
    const strippedLines = allLines.map(line => 
      line.replace(/<[^>]*>?/gm, '').replace(/\s+$/, '')
    );

    // Find first and last non-empty lines (Vertical crop)
    let firstLine = 0;
    while (firstLine < strippedLines.length && strippedLines[firstLine].trim().length === 0) {
      firstLine++;
    }
    let lastLine = strippedLines.length - 1;
    while (lastLine > firstLine && strippedLines[lastLine].trim().length === 0) {
      lastLine--;
    }

    if (firstLine > lastLine) { // Empty input or only whitespace
      firstLine = 0;
      lastLine = 0;
    }

    const verticalTrimmedStripped = strippedLines.slice(firstLine, lastLine + 1);
    const verticalTrimmedRaw = allLines.slice(firstLine, lastLine + 1);
    
    // Find minimum leading whitespace across all non-empty lines (Horizontal crop)
    let minLeadingSpaces = Infinity;
    verticalTrimmedStripped.forEach(line => {
      if (line.trim().length > 0) {
        const leading = line.match(/^(\s*)/)[0].length;
        if (leading < minLeadingSpaces) minLeadingSpaces = leading;
      }
    });
    if (minLeadingSpaces === Infinity) minLeadingSpaces = 0;

    // Final lines for measurement and plain drawing
    const finalStrippedLines = verticalTrimmedStripped.map(l => l.slice(minLeadingSpaces));
    
    // Find absolute max width from trimmed lines
    const columns = Math.max(1, ...finalStrippedLines.map(l => l.length));
    const rows = finalStrippedLines.length;

    // 2. Setup Canvas
    const metadata = result.metadata || {};
    const charAspectRatio = 0.55;
    // Calculate ideal font size based on original metadata width if possible
    const idealFontSize = metadata.width ? (metadata.width / (columns * charAspectRatio)) : 24;
    const exportFontSize = Math.max(12, Math.floor(idealFontSize));
    const charW = exportFontSize * charAspectRatio;
    const charH = exportFontSize;
    
    const canvas = targetCanvas || document.createElement('canvas');
    canvas.width = Math.floor(columns * charW);
    canvas.height = Math.floor(rows * charH);

    const ctx = canvas.getContext('2d', { alpha: true });
    
    // Clear and Apply Filter Early
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (postFilter !== 'none') {
      ctx.filter = postFilter;
    }

    // Draw Background (Filtered)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 3. Draw Text
    ctx.textBaseline = 'top';
    ctx.font = `${exportFontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;

    const horizontalOffset = minLeadingSpaces * charW;

    for (let y = 0; y < verticalTrimmedRaw.length; y++) {
      const line = verticalTrimmedRaw[y];
      let xOffset = 0;

      if (isHtml) {
        // Match spans with color, &nbsp; or other text
        const regex = /<span style="color:(rgb\(\d+,\d+,\d+\))">([^<]+)<\/span>|(&nbsp;)|([^<>&]+)/g;
        let match;
        while ((match = regex.exec(line)) !== null) {
          if (match[1]) { // Colored span
            ctx.fillStyle = match[1];
            ctx.fillText(match[2], xOffset - horizontalOffset, y * charH);
            xOffset += match[2].length * charW;
          } else if (match[3]) { // &nbsp;
            xOffset += charW;
          } else if (match[4]) { // Plain text
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(match[4], xOffset - horizontalOffset, y * charH);
            xOffset += match[4].length * charW;
          }
        }
      } else {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(finalStrippedLines[y], 0, y * charH);
      }
    }
    
    return canvas;
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
      // Create a template canvas to get the dimensions right
      const firstFrameCanvas = await renderContentToCanvas(result.frames[0]);
      const canvas = document.createElement('canvas');
      canvas.width = firstFrameCanvas.width;
      canvas.height = firstFrameCanvas.height;

      const ctx = canvas.getContext('2d');
      const fps = options.fps || 6;
      
      // We need to capture the stream from the canvas
      const stream = canvas.captureStream(fps);
      const mimeType = 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks = [];

      recorder.ondataavailable = e => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.start();

      // Render each frame to the main canvas
      for (let i = 0; i < result.frames.length; i++) {
        // We render to an offscreen canvas first to get the cropping/filtering right
        // Then we draw it to our recording canvas
        const frameCanvas = await renderContentToCanvas(result.frames[i]);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(frameCanvas, 0, 0);

        if (stream.getVideoTracks().length > 0 && typeof stream.getVideoTracks()[0].requestFrame === 'function') {
          stream.getVideoTracks()[0].requestFrame(); 
        }
        await new Promise(r => setTimeout(r, 1000 / fps));
      }

      recorder.onstop = async () => {
        const webmBlob = new Blob(chunks, { type: 'video/webm' });
        // ... rest of the conversion logic stays the same ...

        
        // Vercel limit check - only apply if not on localhost
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const SERVER_LIMIT = 4.5 * 1024 * 1024;
        
        if (!isLocalhost && webmBlob.size > SERVER_LIMIT) {
          console.warn('WebM too large for server-side MP4 conversion');
          alert(`Video too large for server-side MP4 conversion (${(webmBlob.size / (1024 * 1024)).toFixed(2)}MB). Maximum allowed is 4.5MB. Downloading raw WebM instead.`);
          const url = URL.createObjectURL(webmBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `art-${Date.now()}.webm`;
          a.click();
          setIsRendering(false);
          return;
        }

        try {
          const formData = new FormData();
          formData.append('video', webmBlob, 'video.webm');

          // Use the correct API URL (v1/convert/mp4)
          const response = await fetch(`${import.meta.env.VITE_API_URL}/convert/mp4`, {
            method: 'POST',
            body: formData
          });

          if (!response.ok) throw new Error('Conversion failed');

          const mp4Blob = await response.blob();
          const url = URL.createObjectURL(mp4Blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `art-${Date.now()}.mp4`;
          a.click();
          URL.revokeObjectURL(url);
        } catch (err) {
          console.error('Video conversion error:', err);
          alert('Failed to convert video to MP4. Downloading raw WebM instead.');
          const url = URL.createObjectURL(webmBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `art-${Date.now()}.webm`;
          a.click();
        } finally {
          setIsRendering(false);
        }
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
            <button onClick={handleRestart} title="Restart" className="p-1.5 text-black hover:bg-white hover:border-black border-2 border-transparent transition-all rounded active:translate-y-px">
              <RotateCcw className="w-5 h-5" />
            </button>
            <button onClick={() => setFrameIndex(Math.max(0, frameIndex - 1))} className="p-1.5 text-black hover:bg-white hover:border-black border-2 border-transparent transition-all rounded active:translate-y-px">
              <SkipBack className="w-5 h-5" />
            </button>
            <button 
              onClick={() => isAtEnd ? handleRestart() : setIsPlaying(!isPlaying)} 
              className="p-2 text-white bg-black border-2 border-black rounded hover:bg-zinc-800 transition-all active:translate-y-px"
            >
              {isAtEnd ? <RotateCcw className="w-5 h-5" /> : (isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />)}
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
            {!isVideo && (
              <>
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
              </>
            )}
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
                {isRendering ? 'Saving Video...' : 'MP4'}
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
        className="flex-1 overflow-auto bg-black p-4 md:p-8 flex justify-center items-start ascii-output min-h-[400px] relative"
        style={{ filter: postFilter !== 'none' ? postFilter : 'none', transition: 'filter 0.3s ease' }}
      >
        {isAtEnd && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all animate-in fade-in duration-300">
            <button 
              onClick={handleRestart}
              className="group flex flex-col items-center gap-4 p-8 bg-yellow-300 border-4 border-black shadow-[8px_8px_0_0_black] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all active:bg-yellow-400"
            >
              <RotateCcw className="w-16 h-16 text-black group-hover:rotate-45 transition-transform duration-300" />
              <span className="text-2xl font-black uppercase text-black tracking-widest">Replay Video</span>
            </button>
          </div>
        )}
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
