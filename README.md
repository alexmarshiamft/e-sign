# BBS SignFlow

A browser-based signing workflow for the California BBS Weekly Log of
Experience Hours template.

## Run locally

```bash
npm install
npm run dev
```

## Features

- Bundled source PDF/template preview
- Prefilled trainee, supervisor, work-setting, AMFT, and year fields
- Ten weekly experience-hour rows matching the BBS log
- Automatic C totals using A + B only
- Supervisor signature capture per week row
- One-click signing for all filled rows
- Local browser persistence
- Timestamped audit trail
- Printable BBS weekly log packet
- Exportable signed HTML packet

This MVP stores data in the browser with `localStorage`, which makes it useful
for local preparation and supervisor review workflows without requiring a
backend.
