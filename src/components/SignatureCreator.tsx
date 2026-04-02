import React, { useCallback, useRef, useState } from 'react';
import { X, Plus, Trash2, Check } from 'lucide-react';
import { SignaturePad } from './SignaturePad';
import { SignatureTypeInput } from './SignatureTypeInput';
import { SignatureMethod, SavedSignature } from '../types';

interface Props {
  signatures: SavedSignature[];
  onSave: (name: string, dataUrl: string) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
  selectedId: string | null;
  onClose: () => void;
}

export function SignatureCreator({ signatures, onSave, onDelete, onSelect, selectedId, onClose }: Props) {
  const [view, setView] = useState<'list' | 'create'>(signatures.length === 0 ? 'create' : 'list');
  const [method, setMethod] = useState<SignatureMethod>('draw');
  const [color, setColor] = useState('#1a1a2e');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = useCallback(
    (dataUrl: string) => {
      onSave(`Signature ${new Date().toLocaleTimeString()}`, dataUrl);
      setView('list');
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            {view === 'create' && signatures.length > 0 && (
              <button
                onClick={() => setView('list')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                ← Back
              </button>
            )}
            <h2 className="text-lg font-semibold text-gray-800">
              {view === 'list' ? 'My Signatures' : 'Create Signature'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {view === 'list' ? (
            <div className="p-5 flex flex-col gap-4">
              {/* Saved signature cards */}
              {signatures.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No signatures saved yet.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {signatures.map((sig) => (
                    <div
                      key={sig.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-colors cursor-pointer
                        ${selectedId === sig.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-gray-50'}`}
                      onClick={() => { onSelect(sig.id); onClose(); }}
                    >
                      {/* Signature preview */}
                      <div className="w-32 h-12 bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                        <img src={sig.dataUrl} alt={sig.name} className="max-w-full max-h-full object-contain p-1" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{sig.name}</p>
                        <p className="text-xs text-gray-400">{new Date(sig.createdAt).toLocaleString()}</p>
                      </div>
                      {selectedId === sig.id && (
                        <Check className="w-5 h-5 text-blue-600 shrink-0" />
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(sig.id); }}
                        className="p-1.5 rounded-lg hover:bg-red-100 hover:text-red-600 text-gray-400 transition-colors shrink-0"
                        title="Delete signature"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Create new button */}
              <button
                onClick={() => setView('create')}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 text-sm font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create New Signature
              </button>
            </div>
          ) : (
            <div className="p-5 flex flex-col gap-0">
              {/* Method tabs */}
              <div className="flex gap-1 mb-4">
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

              {method === 'draw' && (
                <SignaturePad
                  color={color}
                  onColorChange={setColor}
                  onSave={handleSave}
                  onCancel={signatures.length > 0 ? () => setView('list') : onClose}
                />
              )}
              {method === 'type' && (
                <SignatureTypeInput
                  onSave={handleSave}
                  onCancel={signatures.length > 0 ? () => setView('list') : onClose}
                />
              )}
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
                      onClick={signatures.length > 0 ? () => setView('list') : onClose}
                      className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
