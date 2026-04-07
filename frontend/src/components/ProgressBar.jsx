import React from 'react';
import { Loader2 } from 'lucide-react';

export default function ProgressBar({ progress, label }) {
  return (
    <div className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-lg">
      <div className="flex justify-between items-end mb-3">
        <div className="flex items-center gap-2">
          {progress < 100 && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />}
          <span className="text-sm font-medium text-zinc-300">
            {label || (progress < 100 ? 'Processing...' : 'Complete!')}
          </span>
        </div>
        <span className="text-sm font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded">
          {progress}%
        </span>
      </div>
      <div className="w-full bg-zinc-950 rounded-full h-3 overflow-hidden border border-zinc-800">
        <div 
          className="bg-indigo-500 h-3 rounded-full transition-all duration-300 relative overflow-hidden" 
          style={{ width: `${progress}%` }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]"></div>
        </div>
      </div>
    </div>
  );
}
