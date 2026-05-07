import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Check,
  Download,
  FileSignature,
  LockKeyhole,
  PenLine,
  Printer,
  RotateCcw,
  Save,
  ShieldCheck,
} from 'lucide-react';
import './styles.css';

type WeekRow = {
  id: string;
  weekOf: string;
  direct: string;
  diagnosis: string;
  nonClinical: string;
  individualSupervision: string;
  groupSupervision: string;
  supervisorSignature?: string;
  supervisorSignedAt?: string;
};

type AuditEvent = {
  id: string;
  at: string;
  label: string;
  detail: string;
};

type WeeklyLogState = {
  traineeLast: string;
  traineeFirst: string;
  traineeMiddle: string;
  supervisorName: string;
  workSetting: string;
  workAddress: string;
  bbsFileNumber: string;
  amftNumber: string;
  year: string;
  supervisorEmail: string;
  rows: WeekRow[];
  traineePreparedAt?: string;
  audit: AuditEvent[];
};

const blankRows = Array.from({ length: 10 }, () => createWeekRow());

const initialState: WeeklyLogState = {
  traineeLast: 'Marshi',
  traineeFirst: 'Alexander',
  traineeMiddle: 'Emile',
  supervisorName: 'Alex Lerza',
  supervisorEmail: 'alex.lerza@example.com',
  workSetting: 'Integrated Therapy and Recovery Inc',
  workAddress: '12030 Donner Pass Rd, Suite 1-433, Truckee, CA 96161',
  bbsFileNumber: '',
  amftNumber: '159153',
  year: '2026',
  rows: blankRows,
  audit: [],
};

function createWeekRow(): WeekRow {
  return {
    id: crypto.randomUUID(),
    weekOf: '',
    direct: '',
    diagnosis: '',
    nonClinical: '',
    individualSupervision: '',
    groupSupervision: '',
  };
}

function audit(label: string, detail: string): AuditEvent {
  return {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    label,
    detail,
  };
}

function readState(): WeeklyLogState {
  const saved = localStorage.getItem('signflow.bbsWeeklyLog');
  if (!saved) {
    return {
      ...initialState,
      rows: Array.from({ length: 10 }, () => createWeekRow()),
      audit: [audit('BBS log opened', 'Weekly log template loaded for signing.')],
    };
  }

  try {
    const parsed = JSON.parse(saved) as WeeklyLogState;
    return {
      ...initialState,
      ...parsed,
      rows: parsed.rows?.length ? parsed.rows : Array.from({ length: 10 }, () => createWeekRow()),
      audit: parsed.audit?.length ? parsed.audit : [audit('BBS log recovered', 'Saved weekly log data was restored.')],
    };
  } catch {
    return {
      ...initialState,
      rows: Array.from({ length: 10 }, () => createWeekRow()),
      audit: [audit('BBS log reset', 'Saved weekly log data was unreadable, so a fresh log was created.')],
    };
  }
}

function toNumber(value: string) {
  const numeric = Number.parseFloat(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatHours(value: number) {
  if (!value) return '';
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

function rowTotal(row: WeekRow) {
  return toNumber(row.direct) + toNumber(row.nonClinical);
}

function App() {
  const [log, setLog] = useState<WeeklyLogState>(() => readState());
  const [supervisorSignature, setSupervisorSignature] = useState(log.supervisorName);

  const totals = useMemo(
    () =>
      log.rows.reduce(
        (sum, row) => ({
          direct: sum.direct + toNumber(row.direct),
          diagnosis: sum.diagnosis + toNumber(row.diagnosis),
          nonClinical: sum.nonClinical + toNumber(row.nonClinical),
          individualSupervision: sum.individualSupervision + toNumber(row.individualSupervision),
          groupSupervision: sum.groupSupervision + toNumber(row.groupSupervision),
          total: sum.total + rowTotal(row),
        }),
        {
          direct: 0,
          diagnosis: 0,
          nonClinical: 0,
          individualSupervision: 0,
          groupSupervision: 0,
          total: 0,
        },
      ),
    [log.rows],
  );

  const signedRows = log.rows.filter((row) => row.supervisorSignedAt).length;
  const completedRows = log.rows.filter(
    (row) => row.weekOf || row.direct || row.diagnosis || row.nonClinical || row.individualSupervision || row.groupSupervision,
  ).length;

  function persist(next: WeeklyLogState) {
    localStorage.setItem('signflow.bbsWeeklyLog', JSON.stringify(next));
    setLog(next);
  }

  function updateField(field: keyof WeeklyLogState, value: string) {
    persist({
      ...log,
      [field]: value,
    });
  }

  function updateRow(id: string, field: keyof WeekRow, value: string) {
    persist({
      ...log,
      rows: log.rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    });
  }

  function markPrepared() {
    persist({
      ...log,
      traineePreparedAt: new Date().toISOString(),
      audit: [...log.audit, audit('Prepared by trainee', `${log.traineeFirst} ${log.traineeLast} marked the weekly log ready for supervisor review.`)],
    });
  }

  function signRow(id: string) {
    const row = log.rows.find((candidate) => candidate.id === id);
    if (!row || !supervisorSignature.trim()) return;

    persist({
      ...log,
      rows: log.rows.map((candidate) =>
        candidate.id === id
          ? {
              ...candidate,
              supervisorSignature: supervisorSignature.trim(),
              supervisorSignedAt: new Date().toISOString(),
            }
          : candidate,
      ),
      audit: [
        ...log.audit,
        audit('Supervisor signed week', `${supervisorSignature.trim()} signed week "${row.weekOf || 'undated row'}".`),
      ],
    });
  }

  function signAllFilledRows() {
    if (!supervisorSignature.trim()) return;
    const signedAt = new Date().toISOString();
    let count = 0;

    const rows = log.rows.map((row) => {
      const hasHours = row.weekOf || row.direct || row.nonClinical || row.diagnosis || row.individualSupervision || row.groupSupervision;
      if (!hasHours || row.supervisorSignedAt) return row;
      count += 1;
      return {
        ...row,
        supervisorSignature: supervisorSignature.trim(),
        supervisorSignedAt: signedAt,
      };
    });

    persist({
      ...log,
      rows,
      audit: [...log.audit, audit('Supervisor signed packet', `${supervisorSignature.trim()} signed ${count} filled week row(s).`)],
    });
  }

  function clearRowSignature(id: string) {
    persist({
      ...log,
      rows: log.rows.map((row) =>
        row.id === id ? { ...row, supervisorSignature: undefined, supervisorSignedAt: undefined } : row,
      ),
      audit: [...log.audit, audit('Signature cleared', 'A weekly supervisor signature was cleared.')],
    });
  }

  function resetLog() {
    persist({
      ...initialState,
      rows: Array.from({ length: 10 }, () => createWeekRow()),
      audit: [audit('BBS log reset', 'A fresh weekly log was created.')],
    });
    setSupervisorSignature(initialState.supervisorName);
  }

  function exportSignedHtml() {
    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>BBS Weekly Log - ${escapeHtml(log.traineeLast)}</title>
  <style>${document.querySelector('style[data-export-style]')?.textContent || ''}</style>
</head>
<body>
  ${document.querySelector('.printPacket')?.outerHTML || ''}
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bbs-weekly-log-${log.traineeLast.toLowerCase()}-${log.year}.html`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="app">
      <style data-export-style>{exportStyles}</style>
      <aside className="sidebar">
        <div className="brand">
          <div className="brandMark">
            <FileSignature size={26} />
          </div>
          <div>
            <strong>BBS SignFlow</strong>
            <span>weekly experience log signer</span>
          </div>
        </div>

        <div className="statusCard">
          <ShieldCheck size={22} />
          <div>
            <strong>{signedRows}/{completedRows || 10} rows signed</strong>
            <span>{formatHours(totals.total) || '0'} total A + B hours</span>
          </div>
        </div>

        <div className="sidePanel">
          <h2>Supervisor Signature</h2>
          <label>
            Legal signature
            <input value={supervisorSignature} onChange={(event) => setSupervisorSignature(event.target.value)} />
          </label>
          <button className="primary full" onClick={signAllFilledRows}>
            <PenLine size={17} /> Sign filled rows
          </button>
          <p>Each row receives an individual timestamped audit event for review and export.</p>
        </div>

        <div className="audit">
          <h2>Audit Trail</h2>
          {log.audit
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
            <p className="eyebrow">California BBS Form 37A-525</p>
            <h1>Weekly Log of Experience Hours</h1>
          </div>
          <div className="actions">
            <a className="ghost" href="/bbs-weekly-log-template.pdf" target="_blank" rel="noreferrer">
              Original PDF
            </a>
            <button className="ghost" onClick={resetLog}>
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
          <div className="panel">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Prepared Fields</p>
                <h2>Trainee and work setting</h2>
              </div>
              <span className="saved">
                <Save size={15} /> Saved locally
              </span>
            </div>
            <div className="formGrid three">
              <label>
                Last
                <input value={log.traineeLast} onChange={(event) => updateField('traineeLast', event.target.value)} />
              </label>
              <label>
                First
                <input value={log.traineeFirst} onChange={(event) => updateField('traineeFirst', event.target.value)} />
              </label>
              <label>
                Middle
                <input value={log.traineeMiddle} onChange={(event) => updateField('traineeMiddle', event.target.value)} />
              </label>
            </div>
            <div className="formGrid two">
              <label>
                Supervisor
                <input value={log.supervisorName} onChange={(event) => updateField('supervisorName', event.target.value)} />
              </label>
              <label>
                Work setting
                <input value={log.workSetting} onChange={(event) => updateField('workSetting', event.target.value)} />
              </label>
            </div>
            <label>
              Address of work setting
              <input value={log.workAddress} onChange={(event) => updateField('workAddress', event.target.value)} />
            </label>
            <div className="formGrid three">
              <label>
                BBS file no.
                <input value={log.bbsFileNumber} onChange={(event) => updateField('bbsFileNumber', event.target.value)} />
              </label>
              <label>
                AMFT number
                <input value={log.amftNumber} onChange={(event) => updateField('amftNumber', event.target.value)} />
              </label>
              <label>
                Year
                <input value={log.year} onChange={(event) => updateField('year', event.target.value)} />
              </label>
            </div>
            <button className="primary" onClick={markPrepared}>
              <Check size={17} /> Mark ready for supervisor
            </button>
          </div>

          <div className="panel pdfPanel">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Source Template</p>
                <h2>Original BBS log</h2>
              </div>
              <LockKeyhole size={18} />
            </div>
            <img src="/bbs-weekly-log-template.png" alt="BBS Weekly Log template preview" />
          </div>
        </section>

        <section className="panel hoursPanel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Weekly Rows</p>
              <h2>Experience hours and signatures</h2>
            </div>
            <button className="ghost" onClick={signAllFilledRows}>
              <PenLine size={17} /> Sign all filled
            </button>
          </div>

          <div className="hoursTable" role="table" aria-label="Weekly log rows">
            <div className="hoursHeader" role="row">
              <span>Week of</span>
              <span>A Direct</span>
              <span>A1 Dx/Treatment</span>
              <span>B Non-clinical</span>
              <span>B1 Individual/Triadic</span>
              <span>B2 Group</span>
              <span>C Total</span>
              <span>Supervisor signature</span>
            </div>
            {log.rows.map((row, index) => (
              <div className="hoursRow" role="row" key={row.id}>
                <input
                  aria-label={`Week ${index + 1} date`}
                  placeholder="MM/DD/YYYY"
                  value={row.weekOf}
                  onChange={(event) => updateRow(row.id, 'weekOf', event.target.value)}
                />
                <input value={row.direct} inputMode="decimal" onChange={(event) => updateRow(row.id, 'direct', event.target.value)} />
                <input value={row.diagnosis} inputMode="decimal" onChange={(event) => updateRow(row.id, 'diagnosis', event.target.value)} />
                <input value={row.nonClinical} inputMode="decimal" onChange={(event) => updateRow(row.id, 'nonClinical', event.target.value)} />
                <input
                  value={row.individualSupervision}
                  inputMode="decimal"
                  onChange={(event) => updateRow(row.id, 'individualSupervision', event.target.value)}
                />
                <input value={row.groupSupervision} inputMode="decimal" onChange={(event) => updateRow(row.id, 'groupSupervision', event.target.value)} />
                <strong>{formatHours(rowTotal(row))}</strong>
                <div className="rowSignature">
                  {row.supervisorSignedAt ? (
                    <>
                      <span className="script">{row.supervisorSignature}</span>
                      <small>{new Date(row.supervisorSignedAt).toLocaleString()}</small>
                      <button className="ghost tiny danger" onClick={() => clearRowSignature(row.id)}>
                        Clear
                      </button>
                    </>
                  ) : (
                    <button className="ghost tiny" onClick={() => signRow(row.id)}>
                      Sign row
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div className="hoursRow totals">
              <strong>Total Hours</strong>
              <strong>{formatHours(totals.direct)}</strong>
              <strong>{formatHours(totals.diagnosis)}</strong>
              <strong>{formatHours(totals.nonClinical)}</strong>
              <strong>{formatHours(totals.individualSupervision)}</strong>
              <strong>{formatHours(totals.groupSupervision)}</strong>
              <strong>{formatHours(totals.total)}</strong>
              <strong>{signedRows ? `${signedRows} signed` : 'Unsigned'}</strong>
            </div>
          </div>
        </section>

        <section className="panel previewPanel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Print Packet</p>
              <h2>Signed BBS weekly log</h2>
            </div>
          </div>
          <PrintPacket log={log} totals={totals} />
        </section>
      </main>
    </div>
  );
}

function PrintPacket({ log, totals }: { log: WeeklyLogState; totals: Record<string, number> }) {
  return (
    <div className="printPacket">
      <div className="bbsHeader">
        <div>
          <p>TRAINEE OR ASSOCIATE MARRIAGE AND FAMILY THERAPIST</p>
          <h2>WEEKLY LOG OF<br />EXPERIENCE HOURS</h2>
        </div>
        <img src="/bbs-weekly-log-template.png" alt="" />
      </div>
      <p className="bbsInstructions">Use a separate log for each supervisor and for each work setting.<br />Do not submit to the Board unless specifically requested.</p>
      <div className="bbsInfoGrid">
        <div>Name of Trainee/Associate: Last<br /><strong>{log.traineeLast}</strong></div>
        <div>First<br /><strong>{log.traineeFirst}</strong></div>
        <div>Middle<br /><strong>{log.traineeMiddle}</strong></div>
        <div>Supervisor Name<br /><strong>{log.supervisorName}</strong></div>
        <div>Name of Work Setting<br /><strong>{log.workSetting}</strong></div>
        <div className="wide">Address of Work Setting<br /><strong>{log.workAddress}</strong></div>
        <div className="wide">BBS File No (if known): <strong>{log.bbsFileNumber || '________________'}</strong> &nbsp;&nbsp; AMFT Number: <strong>{log.amftNumber}</strong></div>
      </div>
      <table className="bbsTable">
        <thead>
          <tr>
            <th>YEAR: {log.year}</th>
            <th>A. Direct Counseling</th>
            <th>A1. Diagnosis and Treatment</th>
            <th>B. Non-Clinical</th>
            <th>B1. Individual/Triadic Supervision</th>
            <th>B2. Group Supervision</th>
            <th>C. Total Hours Per Week</th>
            <th>Supervisor Signature</th>
          </tr>
        </thead>
        <tbody>
          {log.rows.map((row) => (
            <tr key={row.id}>
              <td>Week of: {row.weekOf}</td>
              <td>{row.direct}</td>
              <td>{row.diagnosis}</td>
              <td>{row.nonClinical}</td>
              <td>{row.individualSupervision}</td>
              <td>{row.groupSupervision}</td>
              <td>{formatHours(rowTotal(row))}</td>
              <td>
                <span className="script">{row.supervisorSignature || ''}</span>
                {row.supervisorSignedAt && <small>{new Date(row.supervisorSignedAt).toLocaleDateString()}</small>}
              </td>
            </tr>
          ))}
          <tr className="totalRow">
            <td>Total Hours</td>
            <td>{formatHours(totals.direct)}</td>
            <td>{formatHours(totals.diagnosis)}</td>
            <td>{formatHours(totals.nonClinical)}</td>
            <td>{formatHours(totals.individualSupervision)}</td>
            <td>{formatHours(totals.groupSupervision)}</td>
            <td>{formatHours(totals.total)}</td>
            <td />
          </tr>
        </tbody>
      </table>
      <div className="bbsFootnotes">
        <p>* Line A1 is a sub-category of “A” and Lines B1 and B2 are subcategories of “B.” When totaling weekly hours do NOT include the subcategories - use the formula found in box “C.”</p>
        <p>** Non-Clinical Experience includes supervision, psychological testing, writing clinical reports, writing progress or process notes, client-centered advocacy, and workshops, seminars, training sessions or conferences.</p>
      </div>
      <section className="auditSheet">
        <h3>Electronic Signature Audit Trail</h3>
        {log.traineePreparedAt && <p>Prepared by trainee on {new Date(log.traineePreparedAt).toLocaleString()}</p>}
        {log.audit.map((event) => (
          <p key={event.id}>
            <strong>{event.label}</strong> - {new Date(event.at).toLocaleString()}<br />
            {event.detail}
          </p>
        ))}
      </section>
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

const exportStyles = `
body { margin: 0; font-family: Arial, sans-serif; color: #111827; }
.printPacket { max-width: 1000px; margin: 24px auto; padding: 24px; background: white; }
.bbsHeader { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; }
.bbsHeader p { margin: 0 0 6px; font-size: 20px; }
.bbsHeader h2 { margin: 0; color: #082a66; font-size: 34px; letter-spacing: 0.04em; }
.bbsHeader img { width: 220px; height: 90px; object-fit: cover; object-position: 78% 0; }
.bbsInstructions { text-align: center; font-style: italic; font-size: 18px; line-height: 1.45; }
.bbsInfoGrid { display: grid; grid-template-columns: 1.2fr 0.7fr 0.7fr; border: 1px solid #111; }
.bbsInfoGrid div { min-height: 54px; padding: 8px; border-right: 1px solid #111; border-bottom: 1px solid #111; font-size: 17px; }
.bbsInfoGrid div:nth-child(3n), .bbsInfoGrid .wide { border-right: 0; }
.bbsInfoGrid .wide { grid-column: 1 / -1; }
.bbsTable { width: 100%; border-collapse: collapse; table-layout: fixed; margin-top: 0; }
.bbsTable th, .bbsTable td { border: 1px solid #111; min-height: 42px; padding: 7px; text-align: center; vertical-align: middle; font-size: 13px; }
.bbsTable th:first-child, .bbsTable td:first-child { width: 190px; text-align: left; }
.bbsTable th:last-child, .bbsTable td:last-child { width: 210px; }
.totalRow td { border-top: 4px solid #111; font-weight: 800; }
.script { display: block; font-family: "Brush Script MT", "Segoe Script", cursive; font-size: 24px; line-height: 1; }
small { display: block; color: #4b5563; font-size: 10px; }
.bbsFootnotes { font-size: 15px; line-height: 1.3; }
.auditSheet { break-before: page; margin-top: 24px; border-top: 2px solid #111; padding-top: 16px; }
.auditSheet h3 { margin-top: 0; }
@media print { body { background: white; } .printPacket { margin: 0; padding: 0; max-width: none; } }
`;

createRoot(document.getElementById('root')!).render(<App />);
