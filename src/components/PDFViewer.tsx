
import React, { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { useAppDispatch, useAppSelector } from '@/store';
import { setTotalPages } from '@/store/slices/pdfSlice';
import { createTextAnnotation, setIsDrawing } from '@/store/slices/annotationSlice';
import DrawingCanvas from './DrawingCanvas';
import TextAnnotation from './TextAnnotation';
import SignatureBox from './SignatureBox';
import { Annotation, Position } from '@/types';
import { toast } from 'sonner';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PDFViewer: React.FC = () => {
  const dispatch = useAppDispatch();
  const { url, currentPage, scale } = useAppSelector(state => state.pdf);
  const { activeTool, selectedAnnotationId, history } = useAppSelector(state => state.annotation);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [pdfDocument, setPdfDocument] = useState<any>(null);

  // Handle PDF click for adding annotations
  const handlePDFClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    // Get click position relative to the PDF container
    const rect = containerRef.current.getBoundingClientRect();
    const position: Position = {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };

    // Create appropriate annotation based on active tool
    if (activeTool === 'text') {
      // Check if clicking on a form field
      const target = e.target as HTMLElement;
      if (target.classList.contains('textLayer')) {
        // Try to detect if we're clicking on a form field area
        // This is a simple heuristic - in a real app, you'd use PDF.js to detect form fields
        const textElements = target.querySelectorAll('span');
        for (const element of textElements) {
          const rect = element.getBoundingClientRect();
          const elementX = (e.clientX - rect.left) / scale;
          const elementY = (e.clientY - rect.top) / scale;
          
          if (elementX >= 0 && elementX <= rect.width && 
              elementY >= 0 && elementY <= rect.height) {
            // We've found a text element under the cursor
            // Create a text annotation positioned at this element
            dispatch(createTextAnnotation({ 
              position: {
                x: (rect.left - containerRef.current.getBoundingClientRect().left) / scale,
                y: (rect.top - containerRef.current.getBoundingClientRect().top) / scale
              }
            }));
            return;
          }
        }
      }
      
      // Default behavior if not clicking on a text element
      dispatch(createTextAnnotation({ position }));
    } else if (activeTool === 'draw') {
      dispatch(setIsDrawing(true));
    }
  };

  // Handle document load success
  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    dispatch(setTotalPages(numPages));
    setIsLoading(false);
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
  const handlePageRenderSuccess = (page: any) => {
    const viewport = page.getViewport({ scale: 1 });
    setPageSize({
      width: viewport.width * scale,
      height: viewport.height * scale,
    });
    
    // Store reference to PDF document for form field detection
    setPdfDocument(page);
  };

  // Function to create editable annotations for PDF form fields
  useEffect(() => {
    if (pdfDocument && url) {
      // In a real implementation, you would use PDF.js API to get form fields
      // This is a placeholder for that functionality
      const detectFormFields = async () => {
        try {
          // This would be replaced with actual PDF.js form field detection
          // For now, we're just simulating the behavior
          
          // You'd typically access form fields like this:
          // const annotations = await pdfDocument.getAnnotations();
          // const formFields = annotations.filter(a => a.subtype === 'Widget');
          
          // For demonstration purposes, we're not actually implementing this
          // as it would require deeper PDF.js integration
          
          console.log('PDF document loaded and ready for form field detection');
        } catch (error) {
          console.error('Error detecting form fields:', error);
        }
      };
      
      detectFormFields();
    }
  }, [pdfDocument, url, currentPage]);

  // Render annotations
  const renderAnnotations = () => {
    return history.present.map((annotation: Annotation) => {
      switch (annotation.type) {
        case 'text':
          return (
            <TextAnnotation
              key={annotation.id}
              annotation={annotation}
              isSelected={selectedAnnotationId === annotation.id}
            />
          );
        case 'signature':
          return (
            <SignatureBox
              key={annotation.id}
              annotation={annotation}
              isSelected={selectedAnnotationId === annotation.id}
            />
          );
        default:
          return null;
      }
    });
  };

  return (
    <div 
      ref={containerRef}
      className="pdf-container"
      onClick={handlePDFClick}
    >
      {/* Default message when no PDF is loaded */}
      {!url && !isLoading && !loadError && (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-2xl font-light text-muted-foreground animate-fade-in">
            No PDF document loaded
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Use the file picker above to select a PDF file
          </p>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="animate-pulse text-xl font-light text-muted-foreground">
            Loading PDF...
          </div>
        </div>
      )}

      {/* Error state */}
      {loadError && (
        <div className="flex flex-col items-center justify-center h-full text-destructive">
          <div className="text-xl font-medium">Error loading PDF</div>
          <p className="text-sm mt-2">{loadError.message}</p>
        </div>
      )}

      {/* Render PDF document */}
      {url && (
        <div className="relative flex justify-center">
          <Document
            file={url}
            onLoadSuccess={handleDocumentLoadSuccess}
            onLoadError={handleDocumentLoadError}
            loading={<div>Loading PDF...</div>}
            className="animate-fade-in"
          >
            <Page
              pageNumber={currentPage}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              onRenderSuccess={handlePageRenderSuccess}
              className="shadow-lg"
            />
          </Document>

          {/* Drawing canvas overlay */}
          <DrawingCanvas
            pageWidth={pageSize.width}
            pageHeight={pageSize.height}
          />
          
          {/* Render all annotations */}
          {renderAnnotations()}
        </div>
      )}
    </div>
  );
};

export default PDFViewer;
