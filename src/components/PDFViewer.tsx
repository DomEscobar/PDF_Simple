import React, { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { useAppDispatch, useAppSelector } from '@/store';
import { setTotalPages } from '@/store/slices/pdfSlice';
import { setIsDrawing } from '@/store/slices/annotationSlice';
import DrawingCanvas from './DrawingCanvas';
import TextAnnotation from './TextAnnotation';
import SignatureBox from './SignatureBox';
import { Annotation, Position } from '@/types';
import { toast } from 'sonner';
import { showEditingToolbar, hideAllToolbars } from '@/utils/textEditingTools';

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

  // Make text elements editable after PDF rendering
  useEffect(() => {
    if (!url || isLoading) return;

    // Wait for the PDF to render
    const timeout = setTimeout(() => {
      makeTextElementsEditable();
    }, 500);

    return () => clearTimeout(timeout);
  }, [url, currentPage, isLoading, scale]);

  // Function to make text elements editable
  const makeTextElementsEditable = () => {
    if (!containerRef.current) return;

    // Find all text span elements in the PDF
    const textElements = containerRef.current.querySelectorAll('.textLayer span');

    textElements.forEach((element) => {
      // Make each text element editable
      element.setAttribute('contenteditable', 'true');
      
      // Save original font size for relative sizing
      const computedStyle = window.getComputedStyle(element);
      const fontSize = computedStyle.fontSize;
      element.setAttribute('data-original-font-size', fontSize);
      
      // Add styling for better UX
      element.classList.add('pdf-editable-text');
      
      // Add focus and blur event handlers
      element.addEventListener('focus', handleTextFocus);
      element.addEventListener('blur', handleTextBlur);
      
      // Add click handler for the toolbar
      element.addEventListener('click', handleTextClick);
    });

    // Add more CSS for the editable text
    addEditableTextStyles();
  };

  // Handle focus on text element
  const handleTextFocus = (e: Event) => {
    const element = e.target as HTMLElement;
    element.classList.add('pdf-text-editing');
    
    // Save original text for potential restoration
    element.setAttribute('data-original-text', element.textContent || '');
    
    // Hide any existing toolbars (new one will be shown on click)
    hideAllToolbars();
  };

  // Handle blur on text element
  const handleTextBlur = (e: Event) => {
    const element = e.target as HTMLElement;
    element.classList.remove('pdf-text-editing');
    
    // If empty, restore original text
    if (!element.textContent?.trim()) {
      const originalText = element.getAttribute('data-original-text') || '';
      element.textContent = originalText;
    }
    
    // Notify about edit
    toast.success('Text updated');
  };
  
  // Handle click on text element to show the editing toolbar
  const handleTextClick = (e: MouseEvent) => {
    const element = e.target as HTMLElement;
    
    // Don't show toolbar if this text is deleted (white on white)
    if (element.getAttribute('data-deleted') === 'true') return;
    
    // Only show the toolbar when the element is not being edited
    if (!element.matches(':focus')) {
      e.stopPropagation();
      showEditingToolbar(element);
    }
  };

  // Add styles for editable text
  const addEditableTextStyles = () => {
    // Check if styles already exist
    if (document.getElementById('pdf-editable-styles')) return;
    
    // Create style element
    const styleElement = document.createElement('style');
    styleElement.id = 'pdf-editable-styles';
    
    // Define styles
    styleElement.textContent = `
      .pdf-editable-text {
        cursor: text;
        transition: background-color 0.2s linear;
        border-radius: 2px;
        padding: 1px;
      }
      .pdf-editable-text:hover {
        background-color: rgba(255, 255, 0, 0.2);
        outline: 1px dashed rgba(0, 0, 0, 0.3);
      }
      .pdf-text-editing {
        background-color: rgba(255, 255, 255, 0.9) !important;
        outline: 2px solid rgba(0, 120, 255, 0.7) !important;
        box-shadow: 0 0 8px rgba(0, 120, 255, 0.3);
      }
    `;
    
    // Add styles to document
    document.head.appendChild(styleElement);
  };

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
    
    // Close any open toolbars when clicking elsewhere
    hideAllToolbars();
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
  };

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
