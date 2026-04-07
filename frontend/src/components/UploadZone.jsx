import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileImage, FileVideo, X } from 'lucide-react';

export default function UploadZone({ onFileSelect, selectedFile, onClear }) {
  const [errorProps, setErrorProps] = useState(null);

  const onDrop = useCallback((acceptedFiles, fileRejections) => {
    setErrorProps(null);
    if (fileRejections.length > 0) {
      const { errors } = fileRejections[0];
      if (errors[0].code === 'file-too-large') {
        setErrorProps('File exceeds 50MB limit.');
      } else {
        setErrorProps('Invalid file type.');
      }
      return;
    }
    
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
      'video/*': []
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: false
  });

  return (
    <div className="w-full">
      {!selectedFile ? (
        <div 
          {...getRootProps()} 
          className={`flex flex-col items-center justify-center w-full min-h-64 border-4 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
            isDragActive 
              ? 'border-black bg-cyan-300 shadow-[inset_0px_0px_0px_4px_black]' 
              : 'border-black bg-white hover:bg-cyan-100 hover:-translate-y-1 hover:shadow-[4px_4px_0_0_black]'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-black p-4 text-center">
            <div className="bg-cyan-300 p-4 border-4 border-black shadow-[4px_4px_0_0_black] rounded-full mb-6 rotate-3">
              <UploadCloud className="w-10 h-10 text-black" />
            </div>
            <p className="mb-2 text-xl font-black uppercase">
              Click to upload or drag & drop
            </p>
            <p className="text-sm font-bold bg-yellow-200 px-3 py-1 border-2 border-black rounded shadow-[2px_2px_0_0_black] mt-2">
              SVG, PNG, JPG, GIF or MP4, WebM (MAX 50MB)
            </p>
          </div>
          {errorProps && (
            <div className="mt-4 text-sm font-bold text-black bg-red-400 border-4 border-black px-4 py-2 shadow-[2px_2px_0_0_black] rounded pointer-events-none mb-4 uppercase">
              ⚠️ {errorProps}
            </div>
          )}
        </div>
      ) : (
        <div className="relative flex flex-col items-center justify-center w-full min-h-64 border-4 border-black bg-black rounded-xl overflow-hidden group">
          <button 
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="absolute top-4 right-4 p-2 bg-red-500 border-2 border-black hover:bg-red-400 text-black font-black flex items-center justify-center shadow-[4px_4px_0_0_black] rounded transition-transform hover:-translate-y-0.5 active:translate-y-1 active:shadow-none z-10 uppercase text-xs"
          >
            <X className="w-4 h-4 mr-1" /> REMOVE
          </button>
          
          {selectedFile.type.startsWith('image/') ? (
            <div className="w-full h-64 bg-zinc-800 p-4 flex items-center justify-center">
              <img 
                src={URL.createObjectURL(selectedFile)} 
                alt="Preview" 
                className="max-h-56 object-contain border-4 border-black bg-white shadow-[8px_8px_0_0_rgba(0,0,0,1)]"
              />
            </div>
          ) : (
            <div className="relative w-full flex justify-center items-center h-64 bg-zinc-800 p-4">
              <video 
                src={URL.createObjectURL(selectedFile)} 
                className="max-h-56 object-contain border-4 border-black bg-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] pointer-events-none"
                preload="metadata"
                controls
              />
            </div>
          )}
          
          <div className="absolute bottom-0 inset-x-0 p-3 bg-white border-t-4 border-black">
            <div className="flex items-center gap-2 text-sm font-bold text-black uppercase">
              {selectedFile.type.startsWith('image/') ? <FileImage className="w-5 h-5 text-indigo-500" /> : <FileVideo className="w-5 h-5 text-red-500" />}
              <span className="truncate">{selectedFile.name}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
