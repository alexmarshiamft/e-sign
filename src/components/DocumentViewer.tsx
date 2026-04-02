import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { ESignDocument, SignatureField, FieldType, SavedSignature } from '../types';
import { SignatureFieldOverlay } from './SignatureField';
import { Toolbar } from './Toolbar';
import { embedSignaturesIntoPdf, downloadBlob } from '../utils/pdfUtils';

// Use locally bundled worker to avoid CDN version mismatches
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();

interface Props {
  document: ESignDocument;
  signatures: SavedSignature[];
  selectedSignatureId: string | null;
  onSelectedSignatureChange: (id: string | null) => void;
  onUpdateFields: (id: string, fields: SignatureField[]) => void;
  onMarkSigned: (id: string, signedData: string) => void;
  onOpenSignatureCreator: () => void;
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export function DocumentViewer({
  document: doc,
  signatures,
  selectedSignatureId,
  onSelectedSignatureChange,
  onUpdateFields,
  onMarkSigned,
  onOpenSignatureCreator,
  onToast,
}: Props) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [activeTool, setActiveTool] = useState<FieldType | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const [signing, setSigning] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Show signed PDF if available, otherwise original
  const pdfBase64 = doc.status === 'signed' && doc.signedData ? doc.signedData : doc.data;
  const pdfDataUri = `data:application/pdf;base64,${pdfBase64}`;

  const onDocumentLoadSuccess = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(n);
    setCurrentPage(1);
  }, []);

  const onPageLoadSuccess = useCallback(() => {
    // Measure the container after the page renders
    const el = pageContainerRef.current;
    if (el) {
      setContainerSize({ width: el.offsetWidth, height: el.offsetHeight });
    }
  }, []);

  // Keep container size in sync with scale changes and window resize
  const updateContainerSize = useCallback(() => {
    const el = pageContainerRef.current;
    if (el) setContainerSize({ width: el.offsetWidth, height: el.offsetHeight });
  }, []);

  useEffect(() => {
    const ro = new ResizeObserver(updateContainerSize);
    if (pageContainerRef.current) ro.observe(pageContainerRef.current);
    return () => ro.disconnect();
  }, [updateContainerSize]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveTool(null);
        setSelectedFieldId(null);
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedFieldId) {
        // Don't delete when typing in a text field
        const active = document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;
        const updated = doc.fields.filter((f) => f.id !== selectedFieldId);
        onUpdateFields(doc.id, updated);
        setSelectedFieldId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFieldId, doc.fields, doc.id, onUpdateFields]);

  const handlePageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!activeTool) {
        setSelectedFieldId(null);
        return;
      }
      const container = e.currentTarget;
      const rect = container.getBoundingClientRect();
      const xPct = (e.clientX - rect.left) / rect.width;
      const yPct = (e.clientY - rect.top) / rect.height;

      const defaultW = activeTool === 'signature' ? 0.35 : activeTool === 'initials' ? 0.15 : 0.25;
      const defaultH = activeTool === 'signature' ? 0.08 : activeTool === 'initials' ? 0.06 : 0.05;

      const newField: SignatureField = {
        id: crypto.randomUUID(),
        type: activeTool,
        pageNumber: currentPage,
        // Clamp so field never goes off-page
        x: Math.max(0, Math.min(xPct - defaultW / 2, 1 - defaultW)),
        y: Math.max(0, Math.min(yPct - defaultH / 2, 1 - defaultH)),
        width: defaultW,
        height: defaultH,
        value: activeTool === 'date' ? new Date().toLocaleDateString() : undefined,
        signatureDataUrl:
          activeTool === 'signature' || activeTool === 'initials'
            ? signatures.find((s) => s.id === selectedSignatureId)?.dataUrl
            : undefined,
      };

      const updated = [...doc.fields, newField];
      onUpdateFields(doc.id, updated);
      setSelectedFieldId(newField.id);
    },
    [activeTool, currentPage, doc.fields, doc.id, onUpdateFields, selectedSignatureId, signatures]
  );

  const updateField = useCallback(
    (fieldId: string, updates: Partial<SignatureField>) => {
      const updated = doc.fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f));
      onUpdateFields(doc.id, updated);
    },
    [doc.fields, doc.id, onUpdateFields]
  );

  const deleteField = useCallback(
    (fieldId: string) => {
      const updated = doc.fields.filter((f) => f.id !== fieldId);
      onUpdateFields(doc.id, updated);
      if (selectedFieldId === fieldId) setSelectedFieldId(null);
    },
    [doc.fields, doc.id, onUpdateFields, selectedFieldId]
  );

  const clearAllFields = useCallback(() => {
    onUpdateFields(doc.id, []);
    setSelectedFieldId(null);
  }, [doc.id, onUpdateFields]);

  const handleSignNow = useCallback(async () => {
    if (signatures.length === 0) {
      onToast('Please create a signature first', 'info');
      onOpenSignatureCreator();
      return;
    }
    const sigToUse = signatures.find((s) => s.id === selectedSignatureId) || signatures[0];
    if (!sigToUse) {
      onToast('No signature available', 'error');
      return;
    }

    let fields = doc.fields;
    // If no fields placed, auto-place one at bottom of page 1
    if (fields.length === 0) {
      fields = [
        {
          id: crypto.randomUUID(),
          type: 'signature',
          pageNumber: 1,
          x: 0.05,
          y: 0.85,
          width: 0.35,
          height: 0.08,
          signatureDataUrl: sigToUse.dataUrl,
        },
      ];
    } else {
      // Attach signature to unsigned signature/initials fields
      fields = fields.map((f) => {
        if ((f.type === 'signature' || f.type === 'initials') && !f.signatureDataUrl) {
          return { ...f, signatureDataUrl: sigToUse.dataUrl };
        }
        return f;
      });
    }

    onUpdateFields(doc.id, fields);
    setSigning(true);
    onToast('Embedding signatures…', 'info');

    try {
      const allDims = await buildAllPageDims(pdfDataUri, numPages);
      const signed = await embedSignaturesIntoPdf(doc.data, fields, allDims);
      onMarkSigned(doc.id, signed);
      onToast('Document signed successfully!', 'success');
    } catch (err) {
      console.error(err);
      onToast('Failed to embed signatures', 'error');
    } finally {
      setSigning(false);
    }
  }, [
    doc,
    signatures,
    selectedSignatureId,
    numPages,
    pdfDataUri,
    onUpdateFields,
    onMarkSigned,
    onOpenSignatureCreator,
    onToast,
  ]);

  const handleDownload = useCallback(() => {
    if (!doc.signedData) return;
    downloadBlob(doc.signedData, doc.name.replace(/\.pdf$/i, '') + '_signed.pdf');
    onToast('Download started', 'success');
  }, [doc, onToast]);

  const pageFields = doc.fields.filter((f) => f.pageNumber === currentPage);

  return (
    <div className="flex flex-col h-full" tabIndex={-1}>
      <Toolbar
        activeTool={activeTool}
        onToolSelect={setActiveTool}
        signatures={signatures}
        selectedSignatureId={selectedSignatureId}
        onSignatureSelect={onSelectedSignatureChange}
        onSignNow={handleSignNow}
        onDownload={handleDownload}
        canDownload={doc.status === 'signed'}
        onOpenSignatureCreator={onOpenSignatureCreator}
        hasFields={doc.fields.length > 0}
        onClearFields={clearAllFields}
        isSigned={doc.status === 'signed'}
      />

      {/* Scroll area */}
      <div className="flex-1 overflow-auto bg-gray-200 p-4">
        {/* Page nav + zoom */}
        <div className="flex items-center justify-center gap-4 mb-3">
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="p-1 rounded hover:bg-gray-300 disabled:opacity-40"
            title="Previous page"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-gray-700">
            Page {currentPage} / {numPages || '—'}
          </span>
          <button
            disabled={currentPage >= numPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="p-1 rounded hover:bg-gray-300 disabled:opacity-40"
            title="Next page"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="h-4 w-px bg-gray-400" />
          <button
            onClick={() => setScale((s) => Math.max(0.5, +(s - 0.1).toFixed(1)))}
            className="p-1 rounded hover:bg-gray-300"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-600 w-9 text-center">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale((s) => Math.min(2.5, +(s + 0.1).toFixed(1)))}
            className="p-1 rounded hover:bg-gray-300"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        {/* Hint when tool active */}
        {activeTool && (
          <p className="text-center text-xs text-blue-600 font-medium mb-2">
            Click on the document to place a <strong>{activeTool}</strong> field · Press <kbd className="bg-white px-1 rounded border text-xs">Esc</kbd> to cancel
          </p>
        )}

        {/* PDF Page */}
        <div className="flex justify-center">
          <div className="relative shadow-xl" style={{ display: 'inline-block' }}>
            {/* Overlay for field placement & rendering */}
            <div
              ref={pageContainerRef}
              className={`absolute inset-0 z-10 ${activeTool ? 'cursor-crosshair' : 'cursor-default'}`}
              onClick={handlePageClick}
            >
              {pageFields.map((f) => (
                <SignatureFieldOverlay
                  key={f.id}
                  field={f}
                  containerWidth={containerSize.width}
                  containerHeight={containerSize.height}
                  signatures={signatures}
                  isSelected={selectedFieldId === f.id}
                  onSelect={setSelectedFieldId}
                  onUpdate={updateField}
                  onDelete={deleteField}
                />
              ))}
            </div>

            <Document
              file={pdfDataUri}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="w-[612px] h-[792px] bg-white flex items-center justify-center text-gray-400">
                  Loading PDF…
                </div>
              }
              error={
                <div className="w-[612px] h-[792px] bg-white flex items-center justify-center text-red-400">
                  Failed to load PDF
                </div>
              }
            >
              <Page
                pageNumber={currentPage}
                scale={scale}
                onLoadSuccess={onPageLoadSuccess}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>
          </div>
        </div>
      </div>

      {/* Signing overlay */}
      {signing && (
        <div className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 shadow-2xl text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700">Signing document…</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Build actual PDF page dimensions at scale=1 using pdf.js
async function buildAllPageDims(
  dataUri: string,
  numPages: number
): Promise<Array<{ width: number; height: number }>> {
  const loadingTask = pdfjs.getDocument(dataUri);
  const pdfDoc = await loadingTask.promise;
  const dims: Array<{ width: number; height: number }> = [];
  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    dims.push({ width: viewport.width, height: viewport.height });
  }
  return dims;
}
