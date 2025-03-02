
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
  const [textElements, setTextElements] = useState<Element[]>([]);

  // Make text elements in the PDF directly editable
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Find all text elements in the PDF
    const textLayer = containerRef.current.querySelector('.react-pdf__Page__textContent');
    if (textLayer) {
      // Add a small delay to ensure the text layer is fully rendered
      setTimeout(() => {
        const spans = textLayer.querySelectorAll('span[role="presentation"]');
        setTextElements(Array.from(spans));
        
        // Make each text element interactive
        spans.forEach(span => {
          // Add a hover effect to indicate it's editable
          span.classList.add('pdf-text-element');
          
          // Make the text element clickable to create an annotation
          span.addEventListener('click', (e) => {
            if (activeTool === 'text') {
              e.stopPropagation();
              
              const rect = span.getBoundingClientRect();
              const containerRect = containerRef.current!.getBoundingClientRect();
              
              // Create a text annotation positioned exactly over this text element
              dispatch(createTextAnnotation({
                position: {
                  x: (rect.left - containerRect.left) / scale,
                  y: (rect.top - containerRect.top) / scale
                },
                size: {
                  width: rect.width / scale,
                  height: rect.height / scale 
                },
                content: (span as HTMLElement).innerText
              }));
            }
          });
        });
      }, 500);
    }
  }, [currentPage, scale, activeTool, dispatch]);

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
      // If we clicked directly on the PDF (not on a text element)
      // Check if the event target is a text element or one of its parents
      let isTextElement = false;
      let target: Element | null = e.target as Element;
      
      while (target && target !== containerRef.current) {
        if (target.classList.contains('pdf-text-element') || 
            target.classList.contains('react-pdf__Page__textContent')) {
          isTextElement = true;
          break;
        }
        target = target.parentElement;
      }
      
      // Only create a new annotation if we didn't click on a text element
      // (text elements have their own click handlers that create annotations)
      if (!isTextElement) {
        dispatch(createTextAnnotation({ position }));
      }
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
      // Detect form fields in the PDF
      const detectFormFields = async () => {
        try {
          // This would be replaced with actual PDF.js form field detection
          // In a production app, you'd integrate more deeply with PDF.js
          console.log('PDF document loaded and ready for form field detection');
          
          // Get annotations from the PDF document
          try {
            // This is where you would use PDF.js API to get annotations/form fields
            // For demonstration purposes, we're just showing where the code would go
            if (pdfDocument.getAnnotations) {
              const annotations = await pdfDocument.getAnnotations();
              console.log('PDF annotations:', annotations);
              
              // Process form fields
              const formFields = annotations ? annotations.filter((a: any) => a.subtype === 'Widget') : [];
              console.log('Form fields found:', formFields.length);
            }
          } catch (e) {
            console.log('Could not access annotations:', e);
          }
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
      className="pdf-container relative"
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

          {/* Add a custom style to the container for PDF text elements */}
          <style jsx>{`
            .pdf-text-element {
              cursor: text;
              transition: background-color 0.2s linear;
            }
            .pdf-text-element:hover {
              background-color: rgba(0, 123, 255, 0.1);
            }
          `}</style>

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
