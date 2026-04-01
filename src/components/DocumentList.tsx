import React from 'react';
import { FileText, Trash2, CheckCircle, Clock, File } from 'lucide-react';
import { ESignDocument } from '../types';

interface Props {
  documents: ESignDocument[];
  selectedId: string | null;
  onSelect: (doc: ESignDocument) => void;
  onDelete: (id: string) => void;
}

const statusConfig = {
  unsigned: { label: 'Unsigned', icon: File, color: 'text-gray-500 bg-gray-100' },
  pending: { label: 'Pending', icon: Clock, color: 'text-yellow-600 bg-yellow-100' },
  signed: { label: 'Signed', icon: CheckCircle, color: 'text-green-600 bg-green-100' },
};

export function DocumentList({ documents, selectedId, onSelect, onDelete }: Props) {
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
        <FileText className="w-8 h-8" />
        <p className="text-sm">No documents yet</p>
      </div>
    );
  }

  return (
    <ul className="space-y-1">
      {documents.map((doc) => {
        const cfg = statusConfig[doc.status];
        const StatusIcon = cfg.icon;
        const isSelected = doc.id === selectedId;
        return (
          <li key={doc.id}>
            <button
              onClick={() => onSelect(doc)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors group
                ${isSelected ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-gray-100'}`}
            >
              <FileText className="w-4 h-4 shrink-0 text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-gray-800">{doc.name}</p>
                <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-medium ${cfg.color}`}>
                  <StatusIcon className="w-3 h-3" />
                  {cfg.label}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(doc.id);
                }}
                className="shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 transition-all"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
