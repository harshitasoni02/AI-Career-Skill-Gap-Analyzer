// pdfText.js — extract text from a PDF entirely in the browser.
//
// The Flask backend used PyMuPDF (pymupdf.open + page.get_text()). This is the
// browser equivalent with pdfjs-dist, and it reproduces the same shape: page
// text joined with a newline, plus a page count.
//
// The worker is bundled locally through Vite's ?url import, so nothing is
// fetched from a CDN and the page keeps working offline after first load.

import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

const MAX_BYTES = 20 * 1024 * 1024 // matches the backend's 20 MB upload cap

/**
 * Read a PDF File into text.
 * @param {File} file
 * @returns {Promise<{text: string, pages: number, filename: string}>}
 */
export async function readPdfText(file) {
  if (!file) throw new Error('No file received. Make sure a PDF is selected.')
  if (!/\.pdf$/i.test(file.name)) throw new Error('Only PDF files are allowed.')

  const isPdfMime = file.type === 'application/pdf' || file.type === ''
  if (!isPdfMime) throw new Error('Only PDF files are allowed.')
  if (file.size > MAX_BYTES) {
    throw new Error('That PDF is larger than 20 MB. Please upload a smaller file.')
  }

  const data = new Uint8Array(await file.arrayBuffer())

  let pdf
  try {
    pdf = await pdfjsLib.getDocument({ data, isEvalSupported: false }).promise
  } catch (err) {
    throw new Error(
      'Could not read that PDF — it may be corrupted or password-protected.',
    )
  }

  let text = ''
  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber)
      const content = await page.getTextContent()

      // Join the page's text items into lines. pdfjs gives positioned fragments,
      // so a newline is emitted whenever the vertical position changes — this
      // keeps headings and bullet lines separate, which the résumé section
      // parser and the evidence lines both depend on.
      let lastY = null
      let pageText = ''
      for (const item of content.items) {
        const str = item.str ?? ''
        if (!str) continue
        const y = item.transform ? Math.round(item.transform[5]) : null
        if (lastY !== null && y !== null && y !== lastY) pageText += '\n'
        pageText += str
        if (item.hasEOL) pageText += '\n'
        lastY = y
      }

      text += pageText + '\n'
      page.cleanup()
    }
  } finally {
    await pdf.destroy()
  }

  const trimmed = text.trim()
  if (!trimmed) {
    throw new Error(
      'No readable text found in this PDF. It looks like a scan or image-only ' +
        'PDF, which needs OCR — not supported here.',
    )
  }

  return { text, pages: pdf.numPages, filename: file.name }
}
