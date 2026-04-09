import React from 'react';
import { X, Clock, FileText, PenLine, FileSignature } from 'lucide-react';
import { AuditLogEntry } from '../types';

interface Props {
  entries: AuditLogEntry[];
  onClose: () => void;
}

export function AuditTrailPanel({ entries, onClose }: Props) {
  const getIcon = (action: string) => {
    if (action.includes('Upload')) return <FileText className="w-4 h-4 text-blue-500" />;
    if (action.includes('Signed')) return <FileSignature className="w-4 h-4 text-green-500" />;
    return <PenLine className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="w-80 bg-white border-l shadow-lg flex flex-col h-full shrink-0 animate-in slide-in-from-right">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" />
          Audit Trail
        </h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-200 rounded text-gray-500 transition-colors"
          title="Close Audit Trail"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {entries.length === 0 ? (
          <p className="text-sm text-gray-500 text-center mt-4">No audit events recorded.</p>
        ) : (
          <div className="space-y-4">
            {entries.map((entry, index) => (
              <div key={entry.id} className="relative pl-6">
                {/* Timeline line */}
                {index !== entries.length - 1 && (
                  <div className="absolute left-[11px] top-6 bottom-[-16px] w-px bg-gray-200" />
                )}
                
                {/* Icon bubble */}
                <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center z-10">
                  {getIcon(entry.action)}
                </div>

                <div className="text-sm text-gray-800 font-medium">
                  {entry.action}
                </div>
                {entry.details && (
                  <div className="text-xs text-gray-500 mt-0.5">
                    {entry.details}
                  </div>
                )}
                <div className="text-[10px] text-gray-400 mt-1">
                  {new Date(entry.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
