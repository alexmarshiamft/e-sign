import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Minimal valid PDF fixture used across tests
const TEST_PDF_PATH = path.join(__dirname, 'fixtures', 'sample.pdf');

/** Navigate to the upload view and upload the sample PDF, then wait for the doc in the sidebar. */
async function uploadSamplePdf(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: /new document/i }).click();
  await expect(page.getByRole('heading', { name: 'Upload Document' })).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles({
    name: 'sample.pdf',
    mimeType: 'application/pdf',
    buffer: fs.readFileSync(TEST_PDF_PATH),
  });
  // Wait for the document to appear in the sidebar document list
  await expect(page.locator('aside').getByText('sample.pdf')).toBeVisible({ timeout: 10_000 });
}

test.describe('E-Sign Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  // ── Home page ──────────────────────────────────────────────────────────────

  test('loads the home page with sidebar and empty state', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'E-Sign' })).toBeVisible();
    await expect(page.getByRole('button', { name: /new document/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /manage signatures/i })).toBeVisible();
    await expect(page.getByText('No document selected')).toBeVisible();
    await expect(page.getByText(/upload a pdf or select one/i)).toBeVisible();
  });

  test('opens upload area when "New Document" is clicked', async ({ page }) => {
    await page.getByRole('button', { name: /new document/i }).click();
    await expect(page.getByRole('heading', { name: 'Upload Document' })).toBeVisible();
    await expect(page.getByText(/drag & drop a pdf here/i)).toBeVisible();
  });

  test('opens upload area when "Upload a Document" empty-state button is clicked', async ({ page }) => {
    await page.getByRole('button', { name: /upload a document/i }).click();
    await expect(page.getByRole('heading', { name: 'Upload Document' })).toBeVisible();
  });

  // ── Document upload ────────────────────────────────────────────────────────

  test('uploads a PDF and shows it in the document list', async ({ page }) => {
    await uploadSamplePdf(page);
    await expect(page.locator('aside').getByText('sample.pdf')).toBeVisible();
  });

  test('shows "Unsigned" badge after upload', async ({ page }) => {
    await uploadSamplePdf(page);
    await expect(page.locator('aside').getByText('Unsigned')).toBeVisible();
  });

  test('displays a success toast when a document is uploaded', async ({ page }) => {
    await uploadSamplePdf(page);
    await expect(page.getByText(/sample\.pdf.*uploaded/i)).toBeVisible();
  });

  // ── Document toolbar (visible after upload) ────────────────────────────────

  test('shows field tool buttons after uploading a PDF', async ({ page }) => {
    await uploadSamplePdf(page);
    await expect(page.getByTitle('Add Signature field')).toBeVisible();
    await expect(page.getByTitle('Add Initials field')).toBeVisible();
    await expect(page.getByTitle('Add Text field')).toBeVisible();
    await expect(page.getByTitle('Add Date field')).toBeVisible();
  });

  test('shows "Sign Now" button after uploading a PDF', async ({ page }) => {
    await uploadSamplePdf(page);
    await expect(page.getByRole('button', { name: /sign now/i })).toBeVisible();
  });

  // ── Delete document ────────────────────────────────────────────────────────

  test('deletes a document from the sidebar', async ({ page }) => {
    await uploadSamplePdf(page);
    const docItem = page.locator('aside').getByText('sample.pdf');
    await docItem.hover();
    await page.getByTitle('Delete').click();
    await expect(page.locator('aside').getByText('sample.pdf')).not.toBeVisible();
    await expect(page.getByText(/document removed/i)).toBeVisible();
  });

  // ── Signature creator ──────────────────────────────────────────────────────

  test('opens signature creator modal from sidebar button', async ({ page }) => {
    await page.getByRole('button', { name: /manage signatures/i }).click();
    await expect(page.getByRole('heading', { name: 'Create Signature' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Draw' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Type' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Upload', exact: true })).toBeVisible();
  });

  test('closes signature creator modal with Cancel button', async ({ page }) => {
    await page.getByRole('button', { name: /manage signatures/i }).click();
    await expect(page.getByRole('heading', { name: 'Create Signature' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Create Signature' })).not.toBeVisible();
  });

  test('can switch between Draw, Type, and Upload tabs in signature creator', async ({ page }) => {
    await page.getByRole('button', { name: /manage signatures/i }).click();
    // Draw tab is default: canvas should be visible
    await expect(page.locator('canvas')).toBeVisible();
    // Switch to Type tab
    await page.getByRole('button', { name: 'Type' }).click();
    await expect(page.getByPlaceholder(/type your full name/i)).toBeVisible();
    // Switch to Upload tab
    await page.getByRole('button', { name: 'Upload', exact: true }).click();
    await expect(page.getByText(/click to upload signature image/i)).toBeVisible();
    // Back to Draw tab
    await page.getByRole('button', { name: 'Draw' }).click();
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('creates a typed signature and shows count badge', async ({ page }) => {
    await page.getByRole('button', { name: /manage signatures/i }).click();
    await page.getByRole('button', { name: 'Type' }).click();
    await page.getByPlaceholder(/type your full name/i).fill('Jane Smith');
    await page.getByRole('button', { name: 'Use Signature' }).click();
    await expect(page.getByText(/signature saved/i)).toBeVisible();
    // Signature count badge (1) should appear on the Manage Signatures button
    await expect(page.getByRole('button', { name: /manage signatures/i }).getByText('1')).toBeVisible();
  });
});

