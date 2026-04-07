import React from 'react';
import { Loader2 } from 'lucide-react';

export default function ProgressBar({ progress, label }) {
  return (
    <div className="w-full bg-white border-4 border-black rounded-xl p-6 shadow-[8px_8px_0_0_black]">
      <div className="flex justify-between items-end mb-4">
        <div className="flex items-center gap-3">
          {progress < 100 && <Loader2 className="w-6 h-6 text-black animate-spin" />}
          <span className="text-xl font-black uppercase text-black">
            {label || (progress < 100 ? 'Processing...' : 'Complete!')}
          </span>
        </div>
        <span className="text-2xl font-black text-black bg-yellow-300 px-3 py-1 border-4 border-black rounded shadow-[2px_2px_0_0_black] -rotate-3">
          {progress}%
        </span>
      </div>
      <div className="w-full bg-white rounded-none h-8 border-4 border-black box-border relative shadow-[inset_3px_3px_0px_rgba(0,0,0,0.2)] flex">
        <div 
          className="bg-lime-400 h-full border-r-4 border-black transition-all duration-300 relative overflow-hidden" 
          style={{ width: `${progress}%` }}
        >
          {/* Shimmer effect comic style */}
          <div className="absolute inset-0 bg-white/30 -translate-x-full animate-[shimmer_1s_infinite] w-8 skew-x-[-20deg]"></div>
        </div>
      </div>
    </div>
  );
}
