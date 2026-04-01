import React, { useCallback, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { SignatureField as FieldType, FieldType as FT } from '../types';
import { SavedSignature } from '../types';

interface Props {
  field: FieldType;
  containerWidth: number;
  containerHeight: number;
  signatures: SavedSignature[];
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<FieldType>) => void;
  onDelete: (id: string) => void;
}

const FIELD_LABELS: Record<FT, string> = {
  signature: 'Signature',
  initials: 'Initials',
  text: 'Text',
  date: 'Date',
};

const FIELD_COLORS: Record<FT, string> = {
  signature: 'border-blue-400 bg-blue-50',
  initials: 'border-purple-400 bg-purple-50',
  text: 'border-green-400 bg-green-50',
  date: 'border-orange-400 bg-orange-50',
};

export function SignatureFieldOverlay({
  field,
  containerWidth,
  containerHeight,
  signatures,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
}: Props) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ mouseX: number; mouseY: number; fieldX: number; fieldY: number } | null>(null);
  const resizeStart = useRef<{ mouseX: number; mouseY: number; w: number; h: number } | null>(null);
  const [editingText, setEditingText] = useState(false);

  const px = field.x * containerWidth;
  const py = field.y * containerHeight;
  const pw = field.width * containerWidth;
  const ph = field.height * containerHeight;

  // ── Drag ──────────────────────────────────────────────────────────────────
  const onDragPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      onSelect(field.id);
      dragStart.current = { mouseX: e.clientX, mouseY: e.clientY, fieldX: px, fieldY: py };
      const el = fieldRef.current!;
      el.setPointerCapture(e.pointerId);
    },
    [field.id, px, py, onSelect]
  );

  const onDragPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragStart.current) return;
      const dx = e.clientX - dragStart.current.mouseX;
      const dy = e.clientY - dragStart.current.mouseY;
      let newX = (dragStart.current.fieldX + dx) / containerWidth;
      let newY = (dragStart.current.fieldY + dy) / containerHeight;
      newX = Math.max(0, Math.min(newX, 1 - field.width));
      newY = Math.max(0, Math.min(newY, 1 - field.height));
      onUpdate(field.id, { x: newX, y: newY });
    },
    [field.id, field.width, field.height, containerWidth, containerHeight, onUpdate]
  );

  const onDragPointerUp = useCallback(() => {
    dragStart.current = null;
  }, []);

  // ── Resize ────────────────────────────────────────────────────────────────
  const onResizePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      resizeStart.current = { mouseX: e.clientX, mouseY: e.clientY, w: pw, h: ph };
      const el = e.currentTarget as HTMLElement;
      el.setPointerCapture(e.pointerId);
    },
    [pw, ph]
  );

  const onResizePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!resizeStart.current) return;
      const dx = e.clientX - resizeStart.current.mouseX;
      const dy = e.clientY - resizeStart.current.mouseY;
      const newW = Math.max(60, resizeStart.current.w + dx);
      const newH = Math.max(30, resizeStart.current.h + dy);
      onUpdate(field.id, {
        width: Math.min(newW / containerWidth, 1 - field.x),
        height: Math.min(newH / containerHeight, 1 - field.y),
      });
    },
    [field.id, field.x, field.y, containerWidth, containerHeight, onUpdate]
  );

  const onResizePointerUp = useCallback(() => {
    resizeStart.current = null;
  }, []);

  const sig = field.signatureDataUrl ? null : signatures.find((s) => s.id === field.value);
  const displaySig = field.signatureDataUrl || sig?.dataUrl;

  return (
    <div
      ref={fieldRef}
      className={`absolute border-2 rounded flex items-center justify-center select-none
        ${FIELD_COLORS[field.type]}
        ${isSelected ? 'ring-2 ring-offset-1 ring-blue-500 shadow-lg' : ''}
      `}
      style={{ left: px, top: py, width: pw, height: ph }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(field.id);
      }}
    >
      {/* Move handle */}
      <div
        className="field-handle absolute inset-0 flex items-center justify-center"
        onPointerDown={onDragPointerDown}
        onPointerMove={onDragPointerMove}
        onPointerUp={onDragPointerUp}
      >
        {displaySig ? (
          <img src={displaySig} alt="signature" className="max-w-full max-h-full object-contain p-1" />
        ) : field.type === 'text' || field.type === 'date' ? (
          editingText ? (
            <input
              autoFocus
              className="w-full h-full bg-transparent text-xs px-1 focus:outline-none"
              value={field.value || ''}
              onChange={(e) => onUpdate(field.id, { value: e.target.value })}
              onBlur={() => setEditingText(false)}
              onPointerDown={(e) => e.stopPropagation()}
              placeholder={field.type === 'date' ? new Date().toLocaleDateString() : 'Enter text...'}
            />
          ) : (
            <span
              className="text-xs text-gray-500 px-1 truncate cursor-text w-full text-center"
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (field.type === 'date' && !field.value) {
                  onUpdate(field.id, { value: new Date().toLocaleDateString() });
                }
                setEditingText(true);
              }}
            >
              {field.value || FIELD_LABELS[field.type]}
            </span>
          )
        ) : (
          <span className="text-xs text-gray-400">{FIELD_LABELS[field.type]}</span>
        )}
      </div>

      {/* Controls when selected */}
      {isSelected && (
        <>
          <button
            className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 z-10"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(field.id);
            }}
          >
            <Trash2 className="w-3 h-3" />
          </button>

          {/* Resize handle */}
          <div
            className="resize-handle absolute bottom-0 right-0 w-4 h-4 bg-blue-500 rounded-tl"
            onPointerDown={onResizePointerDown}
            onPointerMove={onResizePointerMove}
            onPointerUp={onResizePointerUp}
          />
        </>
      )}
    </div>
  );
}
