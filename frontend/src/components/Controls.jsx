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
    width: 60, // Default wider for comic feel, let's keep reasonable size
    invert: false,
    color: false,
    imageFilter: 'None',
    fps: 6,
    previewFirstFrame: true, // Default true for video
    loop: true // Default true for video
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
      color: options.color,
      imageFilter: options.imageFilter
    };

    if (isVideo) {
      payload.fps = options.fps;
      payload.previewFirstFrame = options.previewFirstFrame;
      payload.loop = options.loop;
    }

    onChange(payload);
  }, [options, isVideo, onChange]);

  const updateOption = (key, value) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b-4 border-black pb-4 mb-6">
        <div className="p-2 bg-pink-300 border-2 border-black shadow-[2px_2px_0_0_black] rounded -rotate-6">
          <Settings className="w-6 h-6 text-black" />
        </div>
        <h3 className="text-2xl font-black uppercase text-black [-webkit-text-stroke:1px_black]">Settings</h3>
      </div>

      {/* Charset Selector */}
      <div className="space-y-3">
        <label className="inline-block text-sm font-black uppercase text-black bg-cyan-200 px-2 py-1 border-2 border-black -rotate-1 shadow-[2px_2px_0_0_black]">Character Set</label>
        <div className="flex flex-col sm:flex-row gap-4 mt-2">
          <select 
            value={options.charsetType}
            onChange={(e) => updateOption('charsetType', e.target.value)}
            className="flex-1 bg-white border-4 border-black text-black font-bold uppercase rounded p-2 focus:ring-0 focus:outline-none shadow-[4px_4px_0_0_black] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all cursor-pointer"
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
              className="flex-1 bg-yellow-100 border-4 border-black text-black font-bold text-center rounded p-2 focus:ring-0 focus:outline-none shadow-[4px_4px_0_0_black]"
              placeholder="e.g. .:#@"
            />
          )}
        </div>
      </div>

      {/* Image Filter Selector */}
      <div className="space-y-3 pt-2">
        <label className="inline-block text-sm font-black uppercase text-black bg-fuchsia-300 px-2 py-1 border-2 border-black rotate-1 shadow-[2px_2px_0_0_black]">Image Filter</label>
        <div className="flex mt-2">
          <select 
            value={options.imageFilter}
            onChange={(e) => updateOption('imageFilter', e.target.value)}
            className="flex-1 bg-white border-4 border-black text-black font-bold uppercase rounded p-2 focus:ring-0 focus:outline-none shadow-[4px_4px_0_0_black] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all cursor-pointer"
          >
            {['None', 'Sharpen', 'Edge Tracing', 'Sepia', 'Grayscale'].map((key) => (
              <option key={key} value={key}>{key}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Width Slider */}
      <div className="space-y-3 pt-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-black uppercase text-black border-b-2 border-black">Output Width</label>
          <span className="text-lg font-black text-white bg-black px-3 py-1 border-2 border-black rounded rotate-2 shadow-[2px_2px_0_0_#eab308]">{options.width}</span>
        </div>
        <input 
          type="range" 
          min="40" 
          max="300" 
          value={options.width}
          onChange={(e) => updateOption('width', Number(e.target.value))}
          className="w-full h-4 bg-orange-200 rounded border-2 border-black appearance-none cursor-pointer accent-black shadow-[3px_3px_0_0_black] hover:accent-pink-600 transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2 gap-3 pt-4">
        {/* Color Mode Toggle */}
        <label className={`relative flex items-center justify-between p-3 border-4 rounded cursor-pointer transition-all ${options.color ? 'border-black bg-indigo-200 shadow-[4px_4px_0_0_black] translate-y-[-2px] translate-x-[-2px]' : 'border-black bg-white hover:bg-gray-50 shadow-[2px_2px_0_0_black]'}`}>
          <div className="flex items-center gap-1.5 flex-1 min-w-0 pr-2">
            <ImageIcon className={`w-5 h-5 shrink-0 ${options.color ? 'text-indigo-900' : 'text-black'}`} />
            <span className="text-xs sm:text-sm font-black uppercase text-black leading-tight wrap-break-word">ANSI Color</span>
          </div>
          <input 
            type="checkbox" 
            checked={options.color}
            onChange={(e) => updateOption('color', e.target.checked)}
            className="sr-only peer"
          />
          <div className="relative shrink-0 w-12 h-6 border-2 border-black bg-white peer-focus:outline-none rounded peer peer-checked:bg-indigo-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-black after:border-black after:border-2 after:rounded-sm after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full peer-checked:after:bg-yellow-300"></div>
        </label>

        {/* Invert Toggle */}
        <label className={`relative flex items-center justify-between p-3 border-4 rounded cursor-pointer transition-all ${options.invert ? 'border-black bg-pink-200 shadow-[4px_4px_0_0_black] translate-y-[-2px] translate-x-[-2px]' : 'border-black bg-white hover:bg-gray-50 shadow-[2px_2px_0_0_black]'}`}>
          <div className="flex flex-col flex-1 min-w-0 pr-2">
            <span className="text-xs sm:text-sm font-black uppercase text-black leading-tight wrap-break-word">Invert Lum</span>
          </div>
          <input 
            type="checkbox" 
            checked={options.invert}
            onChange={(e) => updateOption('invert', e.target.checked)}
            className="sr-only peer"
          />
          <div className="relative shrink-0 w-12 h-6 border-2 border-black bg-white peer-focus:outline-none rounded peer peer-checked:bg-pink-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-black after:border-black after:border-2 after:rounded-sm after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full peer-checked:after:bg-yellow-300"></div>
        </label>
      </div>

      {/* Video Specific Controls */}
      {isVideo && (
        <div className="pt-6 mt-4 border-t-4 border-black border-dashed space-y-6">
          <div className="inline-flex items-center gap-2 mb-2 bg-emerald-200 p-2 border-2 border-black shadow-[3px_3px_0_0_black] rotate-1">
            <Film className="w-5 h-5 text-black" />
            <h4 className="text-sm font-black uppercase text-black">Video Opts</h4>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-black uppercase text-black">Frames Per Second (FPS)</label>
              <span className="text-lg font-black text-black bg-emerald-300 px-3 py-1 border-2 border-black rounded shadow-[2px_2px_0_0_black] -rotate-2">{options.fps}</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="15" 
              value={options.fps}
              onChange={(e) => updateOption('fps', Number(e.target.value))}
              className="w-full h-4 bg-emerald-100 rounded border-2 border-black appearance-none cursor-pointer accent-black shadow-[3px_3px_0_0_black] hover:accent-emerald-600 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-start gap-4 cursor-pointer group bg-zinc-100 p-3 border-4 border-black hover:bg-zinc-200 transition-colors shadow-[4px_4px_0_0_black] rounded active:translate-y-1 active:translate-x-1 active:shadow-none">
              <div className="relative flex items-center mt-1">
                <input 
                  type="checkbox" 
                  checked={options.previewFirstFrame}
                  onChange={(e) => updateOption('previewFirstFrame', e.target.checked)}
                  className="w-5 h-5 rounded-none bg-white border-2 border-black text-black focus:ring-black accent-black shadow-[2px_2px_0_0_black] cursor-pointer"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black uppercase text-black">Preview Only</span>
                <span className="text-[10px] font-bold text-zinc-600 uppercase">First frame</span>
              </div>
            </label>

            <label className="flex items-start gap-4 cursor-pointer group bg-zinc-100 p-3 border-4 border-black hover:bg-zinc-200 transition-colors shadow-[4px_4px_0_0_black] rounded active:translate-y-1 active:translate-x-1 active:shadow-none">
              <div className="relative flex items-center mt-1">
                <input 
                  type="checkbox" 
                  checked={options.loop}
                  onChange={(e) => updateOption('loop', e.target.checked)}
                  className="w-5 h-5 rounded-none bg-white border-2 border-black text-black focus:ring-black accent-black shadow-[2px_2px_0_0_black] cursor-pointer"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black uppercase text-black">Loop Video</span>
                <span className="text-[10px] font-bold text-zinc-600 uppercase">Repeat always</span>
              </div>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
