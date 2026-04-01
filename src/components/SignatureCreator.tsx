import React, { useCallback, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { SignaturePad } from './SignaturePad';
import { SignatureTypeInput } from './SignatureTypeInput';
import { SignatureMethod } from '../types';

interface Props {
  onSave: (name: string, dataUrl: string) => void;
  onClose: () => void;
}

export function SignatureCreator({ onSave, onClose }: Props) {
  const [method, setMethod] = useState<SignatureMethod>('draw');
  const [color, setColor] = useState('#1a1a2e');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = useCallback(
    (dataUrl: string) => {
      onSave(`Signature ${new Date().toLocaleTimeString()}`, dataUrl);
    },
    [onSave]
  );

  const handleUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          handleSave(reader.result);
        }
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    },
    [handleSave]
  );

  const tabs: { id: SignatureMethod; label: string }[] = [
    { id: 'draw', label: 'Draw' },
    { id: 'type', label: 'Type' },
    { id: 'upload', label: 'Upload' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Create Signature</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex gap-1 p-4 pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMethod(tab.id)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                method === tab.id ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {method === 'draw' && (
            <SignaturePad
              color={color}
              onColorChange={setColor}
              onSave={handleSave}
              onCancel={onClose}
            />
          )}
          {method === 'type' && <SignatureTypeInput onSave={handleSave} onCancel={onClose} />}
          {method === 'upload' && (
            <div className="flex flex-col gap-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-10 flex flex-col items-center gap-2 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <p className="text-sm font-medium text-gray-700">Click to upload signature image</p>
                <p className="text-xs text-gray-400">PNG or JPG recommended</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                className="hidden"
                onChange={handleUpload}
              />
              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
