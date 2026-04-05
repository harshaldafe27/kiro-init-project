import { useEffect, useRef, useState } from 'react';

/**
 * Renders the first page of a base64 PDF on a canvas.
 * Admin clicks to place the name position marker.
 * Returns { nameX, nameY } in PDF coordinate space (bottom-left origin).
 */
export default function CertificatePositionPicker({ templateBase64, onPositionSet, previewName = 'Student Name' }) {
  const canvasRef = useRef(null);
  const [marker, setMarker] = useState(null); // { cx, cy } in canvas pixels
  const [pdfDims, setPdfDims] = useState(null); // { width, height } in PDF points
  const [canvasDims, setCanvasDims] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!templateBase64) return;

    let cancelled = false;

    const renderPdf = async () => {
      setLoading(true);
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url
        ).toString();

        const pdfBytes = Uint8Array.from(atob(templateBase64), (c) => c.charCodeAt(0));
        const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
        const page = await pdf.getPage(1);

        const viewport = page.getViewport({ scale: 1 });
        const containerWidth = canvasRef.current ? canvasRef.current.parentElement.clientWidth - 32 : 600;
        const scale = Math.min(containerWidth / viewport.width, 1.5);
        const scaledViewport = page.getViewport({ scale });

        if (cancelled) return;

        const canvas = canvasRef.current;
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;
        const ctx = canvas.getContext('2d');

        await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;

        if (cancelled) return;

        setPdfDims({ width: viewport.width, height: viewport.height });
        setCanvasDims({ width: scaledViewport.width, height: scaledViewport.height, scale });
        setLoading(false);
      } catch (err) {
        console.error('PDF render error', err);
        setLoading(false);
      }
    };

    renderPdf();
    return () => { cancelled = true; };
  }, [templateBase64]);

  const handleCanvasClick = (e) => {
    if (!pdfDims || !canvasDims) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    // Convert canvas pixels → PDF points (pdf-lib uses bottom-left origin)
    const pdfX = (cx / canvasDims.scale);
    const pdfY = pdfDims.height - (cy / canvasDims.scale);

    setMarker({ cx, cy });
    onPositionSet({ nameX: Math.round(pdfX), nameY: Math.round(pdfY) });
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Click on the preview to set where the student name will appear.
        {marker && <span className="ml-2 text-indigo-600 dark:text-indigo-400 font-medium">Position set ✓</span>}
      </p>

      <div className="relative border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-crosshair">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-10">
            <span className="text-sm text-gray-400">Loading preview…</span>
          </div>
        )}

        <canvas ref={canvasRef} onClick={handleCanvasClick} className="block w-full" />

        {/* Name marker overlay */}
        {marker && (
          <div
            className="absolute pointer-events-none"
            style={{ left: marker.cx, top: marker.cy, transform: 'translate(-50%, -50%)' }}
          >
            <span
              className="text-indigo-700 font-bold whitespace-nowrap"
              style={{ fontSize: 14, textShadow: '0 0 4px white, 0 0 4px white' }}
            >
              {previewName}
            </span>
            <div className="absolute inset-0 border-b-2 border-indigo-500" style={{ top: '100%', left: 0, right: 0 }} />
          </div>
        )}
      </div>

      {marker && (
        <p className="text-xs text-gray-400">
          Name will be placed at approximately ({Math.round(marker.cx / (canvasDims?.scale || 1))}, {Math.round(pdfDims?.height - marker.cy / (canvasDims?.scale || 1))}) pt
        </p>
      )}
    </div>
  );
}
