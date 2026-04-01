# e-sign

A fully client-side electronic signature application — no backend required, all state persisted in `localStorage`.

## Stack

- **React 18 + TypeScript + Vite**
- **Tailwind CSS**, lucide-react
- `react-pdf` — PDF rendering
- `pdf-lib` — signature embedding into PDF bytes

## Features

- **Document Management** — drag-and-drop or file-picker PDF upload; sidebar with per-document status badges (`Unsigned` → `Pending` → `Signed`); delete documents
- **Signature Creation** — Draw (canvas pad with undo), Type (rendered in 4 font styles), or Upload (PNG/JPG)
- **Field Placement** — four field types (`signature`, `initials`, `text`, `date`); click to place, drag to reposition, resize via corner handles
- **Sign & Export** — Sign Now attaches the selected signature to all unsigned fields, then `pdf-lib` embeds each field into the PDF; Download saves a new signed PDF

![App screenshot](https://github.com/user-attachments/assets/03f0691f-2cca-4c5e-9d62-78460882c893)

## Try it locally

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server (hot-reload)
npm run dev
# → http://localhost:5173

# — or — build once and preview the production bundle
npm run build
npm run preview
# → http://localhost:4173
```

Then open the URL in your browser, upload any PDF, draw or type a signature, place fields, and click **Sign Now** to embed the signature and download the signed document.

## Running the tests

The project includes [Playwright](https://playwright.dev/) end-to-end tests that verify the core UI flows.

```bash
# Install Playwright browsers (only needed once)
npx playwright install chromium

# Build the app, then run all tests
npm run build
npm test
```

The test suite spins up the production preview server automatically, then exercises:

| # | Test |
|---|------|
| 1 | Home page loads with sidebar and empty state |
| 2 | "New Document" button opens the upload area |
| 3 | "Upload a Document" empty-state button opens the upload area |
| 4 | Uploading a PDF adds it to the document list |
| 5 | Uploaded document shows an "Unsigned" status badge |
| 6 | A success toast is shown after upload |
| 7 | Field-placement toolbar is visible after upload |
| 8 | "Sign Now" button is visible after upload |
| 9 | Deleting a document removes it from the sidebar |
| 10 | "Manage Signatures" opens the Create Signature modal |
| 11 | Cancel button closes the modal |
| 12 | Draw / Type / Upload tabs are switchable |
| 13 | Creating a typed signature saves it and shows a count badge |
