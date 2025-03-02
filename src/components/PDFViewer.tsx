
import React, { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { useAppDispatch, useAppSelector } from '@/store';
import { setTotalPages } from '@/store/slices/pdfSlice';
import { setIsDrawing } from '@/store/slices/annotationSlice';
import DrawingCanvas from './DrawingCanvas';
import { Position } from '@/types';
import { toast } from 'sonner';
import { makeTextElementsEditable } from '@/utils/pdfTextEdit';
import PDFLoadingStates from './PDFLoadingStates';
import PDFAnnotationsLayer from './PDFAnnotationsLayer';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PDFViewer: React.FC = () => {
  const dispatch = useAppDispatch();
  const { url, currentPage, totalPages, scale } = useAppSelector(state => state.pdf);
  const { activeTool, selectedAnnotationId, history } = useAppSelector(state => state.annotation);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageSizes, setPageSizes] = useState<{ width: number; height: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<Error | null>(null);

  // Make text elements editable after PDF rendering
  useEffect(() => {
    if (!url || isLoading) return;

    // Wait for the PDF to render
    const timeout = setTimeout(() => {
      makeTextElementsEditable(containerRef);
    }, 500);

    return () => clearTimeout(timeout);
  }, [url, isLoading, scale]);

  // Handle PDF click (only for drawing now)
  const handlePDFClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    // Only handle clicks for drawing
    if (activeTool === 'draw') {
      // Get click position relative to the PDF container
      const rect = containerRef.current.getBoundingClientRect();
      const position: Position = {
        x: (e.clientX - rect.left) / scale,
        y: (e.clientY - rect.top) / scale,
      };
      
      dispatch(setIsDrawing(true));
    }
  };

  // Handle document load success
  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    dispatch(setTotalPages(numPages));
    setIsLoading(false);
    // Initialize page sizes array
    setPageSizes(Array(numPages).fill({ width: 0, height: 0 }));
    toast(`Document loaded with ${numPages} pages`);
  };

  // Handle document load error
  const handleDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    setLoadError(error);
    setIsLoading(false);
    toast.error('Failed to load PDF document');
  };

  // Handle page render success to get page dimensions
  const handlePageRenderSuccess = (page: any, index: number) => {
    const viewport = page.getViewport({ scale: 1 });
    setPageSizes(prev => {
      const newSizes = [...prev];
      newSizes[index] = {
        width: viewport.width * scale,
        height: viewport.height * scale,
      };
      return newSizes;
    });
  };

  return (
    <div 
      ref={containerRef}
      className="pdf-container"
      onClick={handlePDFClick}
    >
      {/* Show loading states or errors if present */}
      <PDFLoadingStates 
        url={url} 
        isLoading={isLoading} 
        loadError={loadError} 
      />

      {/* Render PDF document */}
      {url && (
        <div className="relative flex flex-col items-center space-y-6 py-6">
          <Document
            file={url}
            onLoadSuccess={handleDocumentLoadSuccess}
            onLoadError={handleDocumentLoadError}
            loading={<div>Loading PDF...</div>}
            className="animate-fade-in"
          >
            {Array.from(new Array(totalPages), (_, index) => (
              <div key={`page_${index + 1}`} className="relative mb-8">
                <Page
                  pageNumber={index + 1}
                  scale={scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  onRenderSuccess={(page) => handlePageRenderSuccess(page, index)}
                  className="shadow-lg"
                />
                
                {/* Drawing canvas overlay for each page */}
                <DrawingCanvas
                  pageWidth={pageSizes[index]?.width || 0}
                  pageHeight={pageSizes[index]?.height || 0}
                />
                
                {/* Render all annotations for each page */}
                <PDFAnnotationsLayer 
                  history={history.present.filter(item => (item as any).pageNumber === index + 1)} 
                  selectedAnnotationId={selectedAnnotationId}
                />
              </div>
            ))}
          </Document>
        </div>
      )}
    </div>
  );
};

export default PDFViewer;
