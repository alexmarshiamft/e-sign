import React, { useState, useCallback, useRef } from 'react';
import { PenLine, FileText, Plus } from 'lucide-react';
import { DocumentList } from './components/DocumentList';
import { DocumentUpload } from './components/DocumentUpload';
import { DocumentViewer } from './components/DocumentViewer';
import { SignatureCreator } from './components/SignatureCreator';
import { ToastContainer } from './components/Toast';
import { useDocuments } from './hooks/useDocuments';
import { useSignatures } from './hooks/useSignatures';
import { Toast } from './types';
import { ESignDocument } from './types';

let toastCounter = 0;

export default function App() {
  const { documents, addDocument, deleteDocument, updateFields, markSigned } = useDocuments();
  const { signatures, addSignature } = useSignatures();
  const [selectedDoc, setSelectedDoc] = useState<ESignDocument | null>(null);
  const [showCreator, setShowCreator] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = String(++toastCounter);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleUpload = useCallback(
    async (file: File) => {
      const doc = await addDocument(file);
      setSelectedDoc(doc);
      setShowUpload(false);
      addToast(`"${file.name}" uploaded`, 'success');
    },
    [addDocument, addToast]
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteDocument(id);
      if (selectedDoc?.id === id) setSelectedDoc(null);
      addToast('Document removed', 'info');
    },
    [deleteDocument, selectedDoc, addToast]
  );

  const handleSaveSignature = useCallback(
    (name: string, dataUrl: string) => {
      addSignature(name, dataUrl);
      setShowCreator(false);
      addToast('Signature saved', 'success');
    },
    [addSignature, addToast]
  );

  const handleUpdateFields = useCallback(
    (id: string, fields: Parameters<typeof updateFields>[1]) => {
      updateFields(id, fields);
      // Keep selectedDoc in sync
      setSelectedDoc((prev) =>
        prev?.id === id ? { ...prev, fields, status: fields.length > 0 ? 'pending' : 'unsigned' } : prev
      );
    },
    [updateFields]
  );

  const handleMarkSigned = useCallback(
    (id: string, signedData: string) => {
      markSigned(id, signedData);
      setSelectedDoc((prev) => (prev?.id === id ? { ...prev, status: 'signed', signedData } : prev));
    },
    [markSigned]
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col shrink-0">
        <div className="flex items-center gap-2 px-4 py-4 border-b">
          <PenLine className="w-6 h-6 text-blue-600" />
          <h1 className="text-lg font-bold text-gray-800">E-Sign</h1>
        </div>

        <div className="p-3 border-b">
          <button
            onClick={() => setShowUpload(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Document
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 mb-1">Documents</p>
          <DocumentList
            documents={documents}
            selectedId={selectedDoc?.id ?? null}
            onSelect={(d) => {
              setSelectedDoc(d);
              setShowUpload(false);
            }}
            onDelete={handleDelete}
          />
        </div>

        <div className="p-3 border-t">
          <button
            onClick={() => setShowCreator(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <PenLine className="w-4 h-4" />
            Manage Signatures
            {signatures.length > 0 && (
              <span className="ml-auto text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">
                {signatures.length}
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {showUpload ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-lg">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload Document</h2>
              <DocumentUpload onUpload={handleUpload} />
            </div>
          </div>
        ) : selectedDoc ? (
          <DocumentViewer
            key={selectedDoc.id}
            document={selectedDoc}
            signatures={signatures}
            onUpdateFields={handleUpdateFields}
            onMarkSigned={handleMarkSigned}
            onOpenSignatureCreator={() => setShowCreator(true)}
            onToast={addToast}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4">
            <FileText className="w-16 h-16" />
            <div className="text-center">
              <p className="text-lg font-medium text-gray-600">No document selected</p>
              <p className="text-sm mt-1">Upload a PDF or select one from the sidebar</p>
            </div>
            <button
              onClick={() => setShowUpload(true)}
              className="mt-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              Upload a Document
            </button>
          </div>
        )}
      </main>

      {/* Modals */}
      {showCreator && (
        <SignatureCreator onSave={handleSaveSignature} onClose={() => setShowCreator(false)} />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
