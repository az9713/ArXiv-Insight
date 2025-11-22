import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BoundingBox, SelectionData } from '../types';
import { Spinner } from './Spinner';
import { ZoomIn, ZoomOut } from 'lucide-react';

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

interface PageProps {
  pdfDoc: any;
  pageNumber: number;
  scale: number;
  isSelectionActive: boolean;
  onSelectionStart: (pageNumber: number) => void;
  onSelectionComplete: (data: SelectionData) => void;
}

const PDFPage: React.FC<PageProps> = ({ 
  pdfDoc, 
  pageNumber, 
  scale, 
  isSelectionActive, 
  onSelectionStart, 
  onSelectionComplete 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendering, setRendering] = useState(false);
  const [selectionBox, setSelectionBox] = useState<BoundingBox | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const startPos = useRef<{ x: number; y: number } | null>(null);

  // Render specific page
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;
    
    setRendering(true);
    try {
      const page = await pdfDoc.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) return;

      // Only resize if dimensions change to avoid flickering
      if (canvas.width !== viewport.width || canvas.height !== viewport.height) {
        canvas.height = viewport.height;
        canvas.width = viewport.width;
      }

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
    } catch (e) {
      // console.error(`Page ${pageNumber} render error`, e);
    } finally {
      setRendering(false);
    }
  }, [pdfDoc, pageNumber, scale]);

  useEffect(() => {
    renderPage();
  }, [renderPage]);

  // Clear selection if another page becomes active
  useEffect(() => {
    if (!isSelectionActive) {
      setSelectionBox(null);
    }
  }, [isSelectionActive]);

  // Mouse Interactions
  const getCanvasCoordinates = (e: React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    onSelectionStart(pageNumber);
    setIsSelecting(true);
    const { x, y } = getCanvasCoordinates(e);
    startPos.current = { x, y };
    setSelectionBox({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || !startPos.current) return;
    const { x, y } = getCanvasCoordinates(e);
    
    const width = x - startPos.current.x;
    const height = y - startPos.current.y;

    setSelectionBox({
      x: width > 0 ? startPos.current.x : x,
      y: height > 0 ? startPos.current.y : y,
      width: Math.abs(width),
      height: Math.abs(height),
    });
  };

  const handleMouseUp = () => {
    if (!isSelecting || !selectionBox || !canvasRef.current) {
      setIsSelecting(false);
      return;
    }
    setIsSelecting(false);
    startPos.current = null;

    if (selectionBox.width < 10 || selectionBox.height < 10) {
      setSelectionBox(null); // Ignore tiny clicks
      return;
    }

    // Capture Image
    const canvas = canvasRef.current;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = selectionBox.width;
    tempCanvas.height = selectionBox.height;
    const ctx = tempCanvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(
        canvas,
        selectionBox.x, selectionBox.y, selectionBox.width, selectionBox.height,
        0, 0, selectionBox.width, selectionBox.height
      );
      const imageBase64 = tempCanvas.toDataURL('image/png');
      
      onSelectionComplete({
        pageNumber: pageNumber,
        rect: selectionBox,
        imageBase64,
      });
    }
  };

  return (
    <div className="relative mb-8 shadow-lg bg-white transition-transform duration-200 origin-top">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="block"
      />
      {/* Selection Overlay */}
      {selectionBox && (
        <div
          className="absolute border-2 border-indigo-500 bg-indigo-500/10 pointer-events-none"
          style={{
            left: selectionBox.x,
            top: selectionBox.y,
            width: selectionBox.width,
            height: selectionBox.height,
          }}
        />
      )}
      {/* Loading Overlay */}
      {rendering && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
          <Spinner className="text-indigo-600" />
        </div>
      )}
      <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
        Page {pageNumber}
      </div>
    </div>
  );
};

interface ViewerProps {
  file: File | null;
  onSelectionComplete: (data: SelectionData) => void;
}

export const PaperViewer: React.FC<ViewerProps> = ({ file, onSelectionComplete }) => {
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [scale, setScale] = useState(1.2);
  const [activeSelectionPage, setActiveSelectionPage] = useState<number | null>(null);

  // Load PDF Document
  useEffect(() => {
    if (!file) {
        setPdfDoc(null);
        return;
    }

    const loadPdf = async () => {
      const fileReader = new FileReader();
      fileReader.onload = async function () {
        const typedarray = new Uint8Array(this.result as ArrayBuffer);
        try {
          const loadingTask = window.pdfjsLib.getDocument(typedarray);
          const doc = await loadingTask.promise;
          setPdfDoc(doc);
        } catch (error) {
          console.error('Error loading PDF:', error);
        }
      };
      fileReader.readAsArrayBuffer(file);
    };

    loadPdf();
  }, [file]);

  // When a selection starts on a specific page, we clear highlights on others
  const handleSelectionStart = (pageNumber: number) => {
    setActiveSelectionPage(pageNumber);
  };

  return (
    <div className="flex flex-col h-full bg-slate-100/50 relative">
      {/* Toolbar */}
      <div className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-4 shadow-sm z-10 shrink-0">
        <div className="flex items-center space-x-4">
           <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {pdfDoc ? `${pdfDoc.numPages} Pages` : 'No Document'}
           </span>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded" title="Zoom Out">
            <ZoomOut size={16} />
          </button>
          <span className="text-xs text-slate-500 w-10 text-center select-none">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(s => Math.min(3.0, s + 0.1))} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded" title="Zoom In">
            <ZoomIn size={16} />
          </button>
        </div>
      </div>

      {/* Scrollable Area */}
      <div className="flex-1 overflow-auto bg-slate-200/50 p-8">
        {!file && (
             <div className="flex flex-col items-center justify-center h-full text-slate-400">
                 <p>Upload a PDF to begin</p>
             </div>
        )}
        
        <div className="flex flex-col items-center">
            {pdfDoc && Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1).map((pageNum) => (
                <PDFPage
                    key={pageNum}
                    pageNumber={pageNum}
                    pdfDoc={pdfDoc}
                    scale={scale}
                    isSelectionActive={activeSelectionPage === pageNum}
                    onSelectionStart={handleSelectionStart}
                    onSelectionComplete={onSelectionComplete}
                />
            ))}
        </div>
      </div>
    </div>
  );
};
