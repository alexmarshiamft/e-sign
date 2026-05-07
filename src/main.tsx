import React, { useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Check,
  Clock,
  Download,
  FileSignature,
  Mail,
  PenLine,
  Plus,
  Printer,
  RotateCcw,
  Save,
  Send,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
} from 'lucide-react';
import './styles.css';

type Recipient = {
  id: string;
  name: string;
  email: string;
  role: string;
  signedAt?: string;
  signature?: string;
};

type AuditEvent = {
  id: string;
  at: string;
  label: string;
  detail: string;
};

type DocumentState = {
  title: string;
  body: string;
  recipients: Recipient[];
  activeRecipientId: string;
  status: 'draft' | 'sent' | 'completed';
  audit: AuditEvent[];
};

const starterDocument = `SERVICE AGREEMENT

This agreement is entered into by and between the sender and the recipient listed below.

1. Scope of Work
The provider will deliver the services described in the accompanying statement of work.

2. Payment
Payment is due according to the schedule agreed by both parties.

3. Acceptance
By signing this document, the signer confirms that they have reviewed and accepted the terms.

Signature:

Name:

Date:`;

const initialState: DocumentState = {
  title: 'Service Agreement',
  body: starterDocument,
  recipients: [
    {
      id: crypto.randomUUID(),
      name: 'Jordan Lee',
      email: 'jordan@example.com',
      role: 'Client',
    },
  ],
  activeRecipientId: '',
  status: 'draft',
  audit: [],
};

function nowStamp() {
  return new Date().toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function createAudit(label: string, detail: string): AuditEvent {
  return {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    label,
    detail,
  };
}

function readSavedState(): DocumentState {
  const saved = localStorage.getItem('signflow.document');
  if (!saved) {
    const firstId = initialState.recipients[0].id;
    return {
      ...initialState,
      activeRecipientId: firstId,
      audit: [createAudit('Document created', 'Draft initialized in this browser.')],
    };
  }

  try {
    const parsed = JSON.parse(saved) as DocumentState;
    return {
      ...parsed,
      activeRecipientId: parsed.activeRecipientId || parsed.recipients[0]?.id || '',
    };
  } catch {
    return {
      ...initialState,
      activeRecipientId: initialState.recipients[0].id,
      audit: [createAudit('Document recovered', 'Saved data was invalid, so a fresh draft was created.')],
    };
  }
}

function App() {
  const [documentState, setDocumentState] = useState<DocumentState>(() => readSavedState());
  const [signatureText, setSignatureText] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeRecipient = useMemo(
    () => documentState.recipients.find((recipient) => recipient.id === documentState.activeRecipientId),
    [documentState.activeRecipientId, documentState.recipients],
  );

  const completedCount = documentState.recipients.filter((recipient) => recipient.signedAt).length;
  const isComplete = completedCount === documentState.recipients.length && documentState.recipients.length > 0;

  function updateState(updater: (current: DocumentState) => DocumentState) {
    setDocumentState((current) => {
      const next = updater(current);
      localStorage.setItem('signflow.document', JSON.stringify(next));
      return next;
    });
  }

  function addRecipient() {
    const newRecipient: Recipient = {
      id: crypto.randomUUID(),
      name: '',
      email: '',
      role: 'Signer',
    };

    updateState((current) => ({
      ...current,
      recipients: [...current.recipients, newRecipient],
      activeRecipientId: newRecipient.id,
      audit: [...current.audit, createAudit('Recipient added', 'A new signer was added to the envelope.')],
    }));
  }

  function removeRecipient(id: string) {
    updateState((current) => {
      const recipients = current.recipients.filter((recipient) => recipient.id !== id);
      return {
        ...current,
        recipients,
        activeRecipientId: recipients[0]?.id || '',
        status: recipients.every((recipient) => recipient.signedAt) && recipients.length ? 'completed' : current.status,
        audit: [...current.audit, createAudit('Recipient removed', 'A signer was removed from the envelope.')],
      };
    });
  }

  function updateRecipient(id: string, field: keyof Recipient, value: string) {
    updateState((current) => ({
      ...current,
      recipients: current.recipients.map((recipient) =>
        recipient.id === id ? { ...recipient, [field]: value } : recipient,
      ),
    }));
  }

  function sendEnvelope() {
    updateState((current) => ({
      ...current,
      status: 'sent',
      audit: [...current.audit, createAudit('Envelope sent', `${current.recipients.length} signer invitation(s) prepared.`)],
    }));
  }

  function signActiveRecipient() {
    const signer = activeRecipient;
    if (!signer || !signatureText.trim()) return;

    updateState((current) => {
      const nextRecipients = current.recipients.map((recipient) =>
        recipient.id === signer.id
          ? {
              ...recipient,
              signature: signatureText.trim(),
              signedAt: new Date().toISOString(),
            }
          : recipient,
      );
      const nextComplete = nextRecipients.every((recipient) => recipient.signedAt);

      return {
        ...current,
        status: nextComplete ? 'completed' : current.status === 'draft' ? 'sent' : current.status,
        recipients: nextRecipients,
        audit: [
          ...current.audit,
          createAudit('Signature completed', `${signer.name || signer.email || 'A signer'} signed the document.`),
        ],
      };
    });
    setSignatureText('');
  }

  function clearSignature(id: string) {
    updateState((current) => ({
      ...current,
      status: 'sent',
      recipients: current.recipients.map((recipient) =>
        recipient.id === id ? { ...recipient, signature: undefined, signedAt: undefined } : recipient,
      ),
      audit: [...current.audit, createAudit('Signature cleared', 'A signer signature was reset.')],
    }));
  }

  function resetDocument() {
    const firstId = crypto.randomUUID();
    const next = {
      ...initialState,
      recipients: [{ id: firstId, name: 'Jordan Lee', email: 'jordan@example.com', role: 'Client' }],
      activeRecipientId: firstId,
      audit: [createAudit('Document reset', 'A new draft was created.')],
    };
    localStorage.setItem('signflow.document', JSON.stringify(next));
    setDocumentState(next);
    setSignatureText('');
  }

  async function importTextFile(file: File) {
    const text = await file.text();
    updateState((current) => ({
      ...current,
      body: text,
      title: file.name.replace(/\.[^.]+$/, '') || current.title,
      audit: [...current.audit, createAudit('Document imported', `${file.name} was loaded into the editor.`)],
    }));
  }

  function exportSignedHtml() {
    const signedHtml = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(documentState.title)} - Signed</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #172033; }
    pre { white-space: pre-wrap; line-height: 1.5; font-family: Georgia, serif; }
    .box { border: 1px solid #ccd4e0; border-radius: 12px; padding: 18px; margin-top: 18px; }
    .sig { font-family: "Brush Script MT", cursive; font-size: 32px; }
    small { color: #667085; }
  </style>
</head>
<body>
  <h1>${escapeHtml(documentState.title)}</h1>
  <pre>${escapeHtml(documentState.body)}</pre>
  <h2>Signatures</h2>
  ${documentState.recipients
    .map(
      (recipient) => `<div class="box">
        <div class="sig">${escapeHtml(recipient.signature || 'Unsigned')}</div>
        <strong>${escapeHtml(recipient.name || 'Unnamed signer')}</strong><br />
        <small>${escapeHtml(recipient.email)} ${recipient.signedAt ? `signed ${new Date(recipient.signedAt).toLocaleString()}` : ''}</small>
      </div>`,
    )
    .join('')}
  <h2>Audit Trail</h2>
  ${documentState.audit
    .map((event) => `<p><strong>${escapeHtml(event.label)}</strong><br /><small>${new Date(event.at).toLocaleString()} - ${escapeHtml(event.detail)}</small></p>`)
    .join('')}
</body>
</html>`;

    const blob = new Blob([signedHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${documentState.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'signed-document'}.html`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brandMark">
            <FileSignature size={26} />
          </div>
          <div>
            <strong>SignFlow</strong>
            <span>browser e-sign workspace</span>
          </div>
        </div>

        <div className="statusCard">
          <span className={`statusDot ${documentState.status}`} />
          <div>
            <strong>{documentState.status === 'completed' ? 'Completed' : documentState.status === 'sent' ? 'Out for signature' : 'Draft'}</strong>
            <span>
              {completedCount}/{documentState.recipients.length} signatures complete
            </span>
          </div>
        </div>

        <nav className="steps">
          <Step done={Boolean(documentState.title && documentState.body)} icon={<FileSignature size={18} />} label="Prepare document" />
          <Step done={documentState.recipients.length > 0} icon={<UserRound size={18} />} label="Add signers" />
          <Step done={documentState.status !== 'draft'} icon={<Send size={18} />} label="Send envelope" />
          <Step done={isComplete} icon={<ShieldCheck size={18} />} label="Complete audit trail" />
        </nav>

        <div className="audit">
          <h2>Audit Trail</h2>
          {documentState.audit
            .slice()
            .reverse()
            .map((event) => (
              <div className="auditItem" key={event.id}>
                <strong>{event.label}</strong>
                <span>{new Date(event.at).toLocaleString()}</span>
                <p>{event.detail}</p>
              </div>
            ))}
        </div>
      </aside>

      <main>
        <header className="topbar">
          <div>
            <p className="eyebrow">Functional MVP</p>
            <h1>Prepare, send, sign, and export agreements</h1>
          </div>
          <div className="actions">
            <button className="ghost" onClick={resetDocument}>
              <RotateCcw size={17} /> Reset
            </button>
            <button className="ghost" onClick={() => window.print()}>
              <Printer size={17} /> Print
            </button>
            <button className="primary" onClick={exportSignedHtml}>
              <Download size={17} /> Export
            </button>
          </div>
        </header>

        <section className="workspace">
          <div className="panel editor">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Document</p>
                <h2>Envelope details</h2>
              </div>
              <input
                ref={fileInputRef}
                hidden
                type="file"
                accept=".txt,.md,.html"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void importTextFile(file);
                  event.currentTarget.value = '';
                }}
              />
              <button className="ghost compact" onClick={() => fileInputRef.current?.click()}>
                <Upload size={16} /> Import text
              </button>
            </div>

            <label>
              Title
              <input
                value={documentState.title}
                onChange={(event) =>
                  updateState((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
              />
            </label>

            <label>
              Document text
              <textarea
                value={documentState.body}
                onChange={(event) =>
                  updateState((current) => ({
                    ...current,
                    body: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <div className="panel">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Recipients</p>
                <h2>Signer routing</h2>
              </div>
              <button className="ghost compact" onClick={addRecipient}>
                <Plus size={16} /> Add
              </button>
            </div>

            <div className="recipientList">
              {documentState.recipients.map((recipient, index) => (
                <article
                  className={`recipient ${recipient.id === documentState.activeRecipientId ? 'active' : ''}`}
                  key={recipient.id}
                  onClick={() => updateState((current) => ({ ...current, activeRecipientId: recipient.id }))}
                >
                  <div className="recipientTop">
                    <span>{index + 1}</span>
                    {recipient.signedAt ? <Check size={18} /> : <Clock size={18} />}
                  </div>
                  <input
                    aria-label="Recipient name"
                    value={recipient.name}
                    placeholder="Signer name"
                    onChange={(event) => updateRecipient(recipient.id, 'name', event.target.value)}
                  />
                  <input
                    aria-label="Recipient email"
                    value={recipient.email}
                    placeholder="email@example.com"
                    onChange={(event) => updateRecipient(recipient.id, 'email', event.target.value)}
                  />
                  <input
                    aria-label="Recipient role"
                    value={recipient.role}
                    placeholder="Role"
                    onChange={(event) => updateRecipient(recipient.id, 'role', event.target.value)}
                  />
                  <div className="recipientActions">
                    {recipient.signedAt && (
                      <button className="ghost tiny" onClick={() => clearSignature(recipient.id)}>
                        Clear
                      </button>
                    )}
                    <button className="ghost tiny danger" onClick={() => removeRecipient(recipient.id)}>
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <button className="sendButton" onClick={sendEnvelope}>
              <Mail size={18} />
              Prepare signing links
            </button>
          </div>
        </section>

        <section className="signingGrid">
          <div className="documentPreview panel">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Preview</p>
                <h2>{documentState.title}</h2>
              </div>
              <span className="saved">
                <Save size={15} /> Saved locally
              </span>
            </div>
            <pre>{documentState.body}</pre>
            <div className="signatureBlocks">
              {documentState.recipients.map((recipient) => (
                <div className="signatureBlock" key={recipient.id}>
                  <span>{recipient.role || 'Signer'}</span>
                  <strong className="script">{recipient.signature || 'Unsigned'}</strong>
                  <small>
                    {recipient.name || 'Unnamed signer'}
                    {recipient.signedAt ? ` - ${new Date(recipient.signedAt).toLocaleString()}` : ''}
                  </small>
                </div>
              ))}
            </div>
          </div>

          <div className="panel signerPanel">
            <p className="eyebrow">Signing Room</p>
            <h2>{activeRecipient ? `Sign as ${activeRecipient.name || activeRecipient.email || 'selected signer'}` : 'Select a signer'}</h2>
            <p className="helper">
              Type a legal signature below. The app records signer identity, timestamp, status, and exportable audit trail.
            </p>
            <div className="signatureInput">
              <PenLine size={20} />
              <input
                value={signatureText}
                placeholder="Type full legal name"
                onChange={(event) => setSignatureText(event.target.value)}
              />
            </div>
            <button className="primary full" disabled={!activeRecipient || !signatureText.trim()} onClick={signActiveRecipient}>
              Apply signature
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

function Step({ done, icon, label }: { done: boolean; icon: React.ReactNode; label: string }) {
  return (
    <div className={`step ${done ? 'done' : ''}`}>
      {icon}
      <span>{label}</span>
      {done && <Check size={16} />}
    </div>
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

createRoot(document.getElementById('root')!).render(<App />);
