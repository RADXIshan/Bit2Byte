import React, { useState, useEffect } from 'react';
import { Settings, Image as ImageIcon, Film } from 'lucide-react';

const CHARSETS = {
  'Binary': '01 ', // Using 10 with space for blank
  'Standard': ' .:-=+*#%@',
  'Blocks': ' ░▒▓█',
  'Custom': '' // placeholder
};

export default function Controls({ onChange, fileType }) {
  const isVideo = fileType && fileType.startsWith('video/');

  const [options, setOptions] = useState({
    charsetType: 'Binary',
    customCharset: '01 ',
    width: 120,
    invert: false,
    color: false,
    fps: 6,
    previewFirstFrame: true // Default true for video
  });

  useEffect(() => {
    // Determine the actual charset string
    let charset = CHARSETS[options.charsetType];
    if (options.charsetType === 'Custom') {
      charset = options.customCharset || ' ';
    } else if (options.charsetType === 'Binary') {
      // The instructions mention binary should use "10 "
      charset = '10 ';
    }

    const payload = {
      charset,
      width: options.width,
      invert: options.invert,
      color: options.color
    };

    if (isVideo) {
      payload.fps = options.fps;
      payload.previewFirstFrame = options.previewFirstFrame;
      // Force monochrome for video per instructions ('disabled for video')
      payload.color = false; 
    }

    onChange(payload);
  }, [options, isVideo, onChange]);

  const updateOption = (key, value) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-zinc-900 border border-zinc-700/50 rounded-xl p-5 shadow-xl space-y-6">
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-4 mb-4">
        <Settings className="w-5 h-5 text-indigo-400" />
        <h3 className="text-lg font-medium text-white">Conversion Settings</h3>
      </div>

      {/* Charset Selector */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-zinc-300">Character Set</label>
        <div className="flex flex-col sm:flex-row gap-3">
          <select 
            value={options.charsetType}
            onChange={(e) => updateOption('charsetType', e.target.value)}
            className="flex-1 bg-zinc-950 border border-zinc-700 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 transition-all"
          >
            {Object.keys(CHARSETS).map((key) => (
              <option key={key} value={key}>{key}</option>
            ))}
          </select>
          {options.charsetType === 'Custom' && (
            <input 
              type="text" 
              value={options.customCharset}
              onChange={(e) => updateOption('customCharset', e.target.value)}
              className="flex-1 bg-zinc-950 border border-zinc-700 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 font-mono"
              placeholder="e.g. .:#@"
            />
          )}
        </div>
      </div>

      {/* Width Slider */}
      <div className="space-y-3">
        <div className="flex justify-between">
          <label className="text-sm font-medium text-zinc-300">Output Columns (Width)</label>
          <span className="text-sm font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">{options.width}</span>
        </div>
        <input 
          type="range" 
          min="40" 
          max="300" 
          value={options.width}
          onChange={(e) => updateOption('width', Number(e.target.value))}
          className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        {/* Color Mode Toggle */}
        <label className={`relative flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${isVideo ? 'opacity-50 cursor-not-allowed border-zinc-800 bg-zinc-950/20' : options.color ? 'border-indigo-500 bg-indigo-500/5' : 'border-zinc-700 bg-zinc-950/50 hover:bg-zinc-800'}`}>
          <div className="flex items-center gap-2">
            <ImageIcon className={`w-4 h-4 ${options.color ? 'text-indigo-400' : 'text-zinc-500'}`} />
            <span className="text-sm font-medium text-zinc-200">ANSI HTML Color</span>
          </div>
          <input 
            type="checkbox" 
            checked={isVideo ? false : options.color}
            disabled={isVideo}
            onChange={(e) => updateOption('color', e.target.checked)}
            className="sr-only peer"
          />
          <div className="relative w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:bg-indigo-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
        </label>

        {/* Invert Toggle */}
        <label className={`relative flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${options.invert ? 'border-indigo-500 bg-indigo-500/5' : 'border-zinc-700 bg-zinc-950/50 hover:bg-zinc-800'}`}>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-zinc-200">Invert Luminance</span>
          </div>
          <input 
            type="checkbox" 
            checked={options.invert}
            onChange={(e) => updateOption('invert', e.target.checked)}
            className="sr-only peer"
          />
          <div className="relative w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:bg-indigo-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
        </label>
      </div>

      {/* Video Specific Controls */}
      {isVideo && (
        <div className="pt-4 mt-4 border-t border-zinc-800 space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <Film className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-medium text-emerald-400">Video Properties</h4>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <label className="text-sm font-medium text-zinc-300">Frames Per Second (FPS)</label>
              <span className="text-sm font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">{options.fps}</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="15" 
              value={options.fps}
              onChange={(e) => updateOption('fps', Number(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative flex items-center">
              <input 
                type="checkbox" 
                checked={options.previewFirstFrame}
                onChange={(e) => updateOption('previewFirstFrame', e.target.checked)}
                className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-emerald-500 focus:ring-emerald-500/20"
              />
            </div>
            <span className="text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors">Preview first frame only (disables auto-play loop)</span>
          </label>
        </div>
      )}
    </div>
  );
}
