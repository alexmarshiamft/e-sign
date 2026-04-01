import React, { useCallback, useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';

interface Props {
  onUpload: (file: File) => void;
}

export function DocumentUpload({ onUpload }: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (file.type !== 'application/pdf') return;
      onUpload(file);
    },
    [onUpload]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = '';
    },
    [handleFile]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-colors select-none
        ${dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
    >
      <UploadCloud className={`w-10 h-10 ${dragging ? 'text-blue-500' : 'text-gray-400'}`} />
      <p className="text-sm font-medium text-gray-700">
        Drag &amp; drop a PDF here, or <span className="text-blue-600">browse</span>
      </p>
      <p className="text-xs text-gray-400">PDF files only</p>
      <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={onInputChange} />
    </div>
  );
}
