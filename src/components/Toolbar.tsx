import React from 'react';
import { PenLine, Type, CalendarDays, CheckSquare, Download, Trash2, BadgeCheck, FileClock } from 'lucide-react';
import { FieldType, SavedSignature } from '../types';

interface Props {
  activeTool: FieldType | null;
  onToolSelect: (tool: FieldType | null) => void;
  signatures: SavedSignature[];
  selectedSignatureId: string | null;
  onSignatureSelect: (id: string | null) => void;
  onSignNow: () => void;
  onDownload: () => void;
  canDownload: boolean;
  onOpenSignatureCreator: () => void;
  hasFields: boolean;
  onClearFields: () => void;
  isSigned: boolean;
  onToggleAuditTrail: () => void;
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
  hasFields,
  onClearFields,
  isSigned,
  onToggleAuditTrail,
}: Props) {
  const selectedSig = signatures.find((s) => s.id === selectedSignatureId);

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-white border-b shadow-sm flex-wrap">
      {/* Field tools */}
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mr-1">Add Field</span>
      {tools.map(({ id, label, Icon }) => (
        <button
          key={id}
          onClick={() => onToolSelect(activeTool === id ? null : id)}
          title={`Add ${label} field (click document to place)`}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
            ${activeTool === id
              ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          <Icon className="w-4 h-4" />
          {label}
        </button>
      ))}

      {hasFields && (
        <button
          onClick={onClearFields}
          title="Remove all placed fields"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Clear
        </button>
      )}

      <div className="h-5 w-px bg-gray-200 mx-1" />

      {/* Signature selector */}
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mr-1">Signature</span>

      {/* Preview chip */}
      {selectedSig && (
        <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1 shrink-0">
          <img src={selectedSig.dataUrl} alt={selectedSig.name} className="h-6 w-16 object-contain" />
        </div>
      )}

      {signatures.length > 0 ? (
        <select
          value={selectedSignatureId ?? ''}
          onChange={(e) => onSignatureSelect(e.target.value || null)}
          className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[160px]"
        >
          <option value="">Select signature…</option>
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
        {signatures.length > 0 ? 'Manage' : 'New Signature'}
      </button>

      <div className="flex-1" />

      {/* Audit Trail */}
      <button
        onClick={onToggleAuditTrail}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
        title="View Audit Trail"
      >
        <FileClock className="w-4 h-4" />
        Audit Trail
      </button>

      {/* Signed badge */}
      {isSigned && (
        <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
          <BadgeCheck className="w-4 h-4" />
          Signed
        </span>
      )}

      {/* Sign Now */}
      {!isSigned && (
        <button
          onClick={onSignNow}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
        >
          <CheckSquare className="w-4 h-4" />
          Sign Now
        </button>
      )}

      {/* Download */}
      {canDownload && (
        <button
          onClick={onDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          Download
        </button>
      )}
    </div>
  );
}
