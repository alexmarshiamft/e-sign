import React, { useRef, useState, useEffect, useCallback } from 'react';

interface Props {
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
}

const FONTS = [
  { label: 'Dancing Script', className: 'font-signature1' },
  { label: 'Great Vibes', className: 'font-signature2' },
  { label: 'Pacifico', className: 'font-signature3' },
  { label: 'Caveat', className: 'font-signature4' },
];

export function SignatureTypeInput({ onSave, onCancel }: Props) {
  const [text, setText] = useState('');
  const [fontIdx, setFontIdx] = useState(0);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleSave = useCallback(async () => {
    if (!text.trim() || !previewRef.current) return;
    const el = previewRef.current;
    const { width, height } = el.getBoundingClientRect();

    const canvas = document.createElement('canvas');
    const scale = window.devicePixelRatio || 1;
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(scale, scale);

    // Wait for font to be loaded before drawing to canvas
    const fontFamily = FONTS[fontIdx].label;
    const fontSize = Math.min(height * 0.55, 54);
    try {
      await document.fonts.load(`${fontSize}px "${fontFamily}"`);
    } catch {
      // proceed even if font load check fails
    }

    ctx.font = `${fontSize}px "${fontFamily}", cursive`;
    ctx.fillStyle = '#1a1a2e';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(text, width / 2, height / 2);

    onSave(canvas.toDataURL('image/png'));
  }, [text, fontIdx, onSave]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Your name</label>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your full name"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">Choose style</label>
        <div className="grid grid-cols-2 gap-2">
          {FONTS.map((f, i) => (
            <button
              key={f.label}
              onClick={() => setFontIdx(i)}
              className={`border rounded-lg py-3 px-2 text-2xl transition-colors ${
                fontIdx === i ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              } ${f.className}`}
            >
              {text || 'Your Signature'}
            </button>
          ))}
        </div>
      </div>
      {/* hidden preview div for canvas capture */}
      <div
        ref={previewRef}
        className={`${FONTS[fontIdx].className} text-4xl text-[#1a1a2e] flex items-center justify-center`}
        style={{ height: '80px', pointerEvents: 'none', position: 'absolute', left: '-9999px' }}
      >
        {text || 'Signature'}
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!text.trim()}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Use Signature
        </button>
      </div>
    </div>
  );
}
