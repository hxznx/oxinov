'use client';

/** Opens the browser's print dialog, where "Save as PDF" creates the PDF export (FR-PLAYER-403). */
export function PrintButton() {
  return (
    <button type="button" className="btn btn-secondary" onClick={() => window.print()}>
      Print or save as PDF
    </button>
  );
}
