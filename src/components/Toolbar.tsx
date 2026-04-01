import React from 'react';
import { PenLine, Type, CalendarDays, AlignLeft, CheckSquare, Download } from 'lucide-react';
import { FieldType, SavedSignature } from '../types';

interface Props {
  activeTool: FieldType | null;
  onToolSelect: (tool: FieldType | null) => void;
  signatures: SavedSignature[];
  selectedSignatureId: string | null;
  onSignatureSelect: (id: string) => void;
  onSignNow: () => void;
  onDownload: () => void;
  canDownload: boolean;
  onOpenSignatureCreator: () => void;
}

const tools: { id: FieldType; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { id: 'signature', label: 'Signature', Icon: PenLine },
  { id: 'initials', label: 'Initials', Icon: CheckSquare },
  { id: 'text', label: 'Text', Icon: Type },
  { id: 'date', label: 'Date', Icon: CalendarDays },
];

export function Toolbar({
  activeTool,
  onToolSelect,
  signatures,
  selectedSignatureId,
  onSignatureSelect,
  onSignNow,
  onDownload,
  canDownload,
  onOpenSignatureCreator,
}: Props) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-white border-b shadow-sm flex-wrap">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mr-1">Add Field</span>
      {tools.map(({ id, label, Icon }) => (
        <button
          key={id}
          onClick={() => onToolSelect(activeTool === id ? null : id)}
          title={`Add ${label} field`}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
            ${activeTool === id ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          <Icon className="w-4 h-4" />
          {label}
        </button>
      ))}

      <div className="h-5 w-px bg-gray-200 mx-1" />

      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mr-1">Signature</span>
      {signatures.length > 0 ? (
        <select
          value={selectedSignatureId ?? ''}
          onChange={(e) => onSignatureSelect(e.target.value)}
          className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select saved signature…</option>
          {signatures.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      ) : null}

      <button
        onClick={onOpenSignatureCreator}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
      >
        <PenLine className="w-4 h-4" />
        New Signature
      </button>

      <div className="flex-1" />

      <button
        onClick={onSignNow}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
      >
        <CheckSquare className="w-4 h-4" />
        Sign Now
      </button>

      {canDownload && (
        <button
          onClick={onDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download
        </button>
      )}
    </div>
  );
}
