export type DocumentStatus = 'unsigned' | 'pending' | 'signed';

export type FieldType = 'signature' | 'text' | 'initials' | 'date';

export interface SignatureField {
  id: string;
  type: FieldType;
  pageNumber: number;
  x: number; // percentage of page width
  y: number; // percentage of page height
  width: number; // percentage of page width
  height: number; // percentage of page height
  value?: string; // text content or signature id
  signatureDataUrl?: string;
}

export interface ESignDocument {
  id: string;
  name: string;
  data: string; // base64 encoded PDF
  status: DocumentStatus;
  uploadedAt: number;
  fields: SignatureField[];
  signedData?: string; // base64 of the signed PDF
}

export type SignatureMethod = 'draw' | 'type' | 'upload';

export interface SavedSignature {
  id: string;
  name: string;
  dataUrl: string;
  createdAt: number;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
