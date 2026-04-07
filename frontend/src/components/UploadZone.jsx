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
          className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${
            isDragActive 
              ? 'border-indigo-500 bg-indigo-500/10' 
              : 'border-zinc-700 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-500'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-zinc-400">
            <UploadCloud className="w-12 h-12 mb-4 text-zinc-500" />
            <p className="mb-2 text-sm font-semibold">
              <span className="text-zinc-200">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs">
              SVG, PNG, JPG, GIF or MP4, WebM (MAX. 50MB)
            </p>
          </div>
          {errorProps && (
            <div className="mt-2 text-sm text-red-500 bg-red-500/10 px-3 py-1 rounded-full pointer-events-none">
              {errorProps}
            </div>
          )}
        </div>
      ) : (
        <div className="relative flex flex-col items-center justify-center w-full min-h-64 border border-zinc-700 bg-zinc-900 rounded-xl overflow-hidden group">
          <button 
            onClick={onClear}
            className="absolute top-4 right-4 p-2 bg-zinc-950/70 hover:bg-red-500/80 text-white rounded-full backdrop-blur-sm transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>
          
          {selectedFile.type.startsWith('image/') ? (
            <img 
              src={URL.createObjectURL(selectedFile)} 
              alt="Preview" 
              className="max-h-64 object-contain"
            />
          ) : (
            <div className="relative w-full flex justify-center items-center h-64 bg-black">
              <video 
                src={URL.createObjectURL(selectedFile)} 
                className="max-h-64 object-contain pointer-events-none"
                preload="metadata"
                controls
              />
            </div>
          )}
          
          <div className="absolute bottom-0 inset-x-0 p-3 bg-linear-to-t from-zinc-950 to-transparent">
            <div className="flex items-center gap-2 text-sm text-zinc-200">
              {selectedFile.type.startsWith('image/') ? <FileImage className="w-4 h-4" /> : <FileVideo className="w-4 h-4" />}
              <span className="truncate">{selectedFile.name}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
