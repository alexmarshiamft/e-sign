import { useState, useCallback } from 'react';
import { ESignDocument, SignatureField, DocumentStatus, AuditLogEntry } from '../types';
import { arrayBufferToBase64 } from '../utils/pdfUtils';

const STORAGE_KEY = 'esign_documents';

function loadFromStorage(): ESignDocument[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return parsed.map((doc: any) => ({
      ...doc,
      auditTrail: doc.auditTrail || []
    }));
  } catch {
    return [];
  }
}

function saveToStorage(docs: ESignDocument[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  } catch {
    // storage quota exceeded – ignore
  }
}

export function useDocuments() {
  const [documents, setDocuments] = useState<ESignDocument[]>(loadFromStorage);

  const persist = useCallback((docs: ESignDocument[]) => {
    setDocuments(docs);
    saveToStorage(docs);
  }, []);

  const addDocument = useCallback(
    async (file: File) => {
      const buffer = await file.arrayBuffer();
      const base64 = arrayBufferToBase64(buffer);
      const doc: ESignDocument = {
        id: crypto.randomUUID(),
        name: file.name,
        data: base64,
        status: 'unsigned',
        uploadedAt: Date.now(),
        fields: [],
        auditTrail: [
          {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            action: 'Document Uploaded',
            details: `File "${file.name}" uploaded to system`,
          }
        ]
      };
      persist([...loadFromStorage(), doc]);
      return doc;
    },
    [persist]
  );

  const deleteDocument = useCallback(
    (id: string) => {
      persist(loadFromStorage().filter((d) => d.id !== id));
    },
    [persist]
  );

  const updateDocument = useCallback(
    (id: string, updates: Partial<ESignDocument>) => {
      const current = loadFromStorage();
      persist(current.map((d) => (d.id === id ? { ...d, ...updates } : d)));
    },
    [persist]
  );

  const logAuditEvent = useCallback(
    (id: string, action: string, details?: string) => {
      const current = loadFromStorage();
      persist(
        current.map((d) => {
          if (d.id === id) {
            const entry: AuditLogEntry = {
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              action,
              details,
            };
            return { ...d, auditTrail: [...(d.auditTrail || []), entry] };
          }
          return d;
        })
      );
    },
    [persist]
  );

  const updateFields = useCallback(
    (id: string, fields: SignatureField[]) => {
      updateDocument(id, {
        fields,
        status: fields.length > 0 ? 'pending' : 'unsigned',
      });
    },
    [updateDocument]
  );

  const markSigned = useCallback(
    (id: string, signedData: string) => {
      const current = loadFromStorage();
      persist(
        current.map((d) => {
          if (d.id === id) {
            const entry: AuditLogEntry = {
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              action: 'Document Signed',
              details: 'Signatures and fields embedded into document',
            };
            return {
              ...d,
              status: 'signed' as DocumentStatus,
              signedData,
              auditTrail: [...(d.auditTrail || []), entry],
            };
          }
          return d;
        })
      );
    },
    [persist]
  );

  return { documents, addDocument, deleteDocument, updateDocument, updateFields, markSigned, logAuditEvent };
}
