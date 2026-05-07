# SignFlow e-sign

A fully functional browser-based e-signature workspace. It lets you prepare a
document, add multiple signers, mark an envelope as sent, collect typed legal
signatures, maintain an audit trail, print, and export a signed HTML copy.

## Run locally

```bash
npm install
npm run dev
```

## Features

- Document editor with text import
- Multi-recipient signer routing
- Envelope statuses: draft, sent, completed
- Typed signature capture
- Local browser persistence
- Timestamped audit trail
- Printable signed document view
- Exportable signed HTML package

This MVP stores data in the browser with `localStorage`, which makes it useful
for demos and lightweight internal workflows without requiring a backend.
