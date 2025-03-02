
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
  const [activeEditElement, setActiveEditElement] = useState<HTMLElement | null>(null);
  const [clonedElement, setClonedElement] = useState<HTMLElement | null>(null);

  // Make text elements editable after PDF rendering
  useEffect(() => {
    if (!url || isLoading) return;

    // Wait for the PDF to render
    const timeout = setTimeout(() => {
      makeTextElementsEditable();
    }, 500);

    return () => clearTimeout(timeout);
  }, [url, currentPage, isLoading, scale]);

  // Clean up clone element when unmounting
  useEffect(() => {
    return () => {
      if (clonedElement && clonedElement.parentNode) {
        clonedElement.parentNode.removeChild(clonedElement);
      }
    };
  }, []);

  // Function to make text elements editable
  const makeTextElementsEditable = () => {
    if (!containerRef.current) return;

    // Find all text span elements in the PDF
    const textElements = containerRef.current.querySelectorAll('.textLayer span');

    textElements.forEach((element) => {
      // Make each text element editable
      element.setAttribute('contenteditable', 'true');
      
      // Add styling for better UX
      element.classList.add('pdf-editable-text');
      
      // Add focus and blur event handlers
      element.addEventListener('focus', handleTextFocus);
      element.addEventListener('blur', handleTextBlur);
    });
  };

  // Create a clone of the element being edited
  const createClone = (originalElement: HTMLElement) => {
    // Create a clone of the original element
    const clone = originalElement.cloneNode(true) as HTMLElement;
    
    // Get computed style to match exactly
    const computedStyle = window.getComputedStyle(originalElement);
    
    // Apply the same style properties
    clone.style.position = 'absolute';
    clone.style.left = `${originalElement.offsetLeft}px`;
    clone.style.top = `${originalElement.offsetTop}px`;
    clone.style.width = `${originalElement.offsetWidth}px`;
    clone.style.height = `${originalElement.offsetHeight}px`;
    clone.style.fontSize = computedStyle.fontSize;
    clone.style.fontFamily = computedStyle.fontFamily;
    clone.style.fontWeight = computedStyle.fontWeight;
    clone.style.lineHeight = computedStyle.lineHeight;
    clone.style.transform = computedStyle.transform;
    clone.style.transformOrigin = computedStyle.transformOrigin;
    
    // Make it visible with white background and black text
    clone.style.backgroundColor = 'white';
    clone.style.color = 'black';
    clone.style.border = '1px solid rgba(0, 120, 255, 0.7)';
    clone.style.boxShadow = '0 0 8px rgba(0, 120, 255, 0.3)';
    clone.style.zIndex = '1000';
    clone.style.borderRadius = '2px';
    clone.style.padding = '0 2px';
    clone.style.outline = 'none';
    clone.style.whiteSpace = 'pre';
    
    // Make clone editable
    clone.setAttribute('contenteditable', 'true');
    
    // Add class for identification
    clone.classList.add('pdf-clone-editing');
    
    // Add event listeners to the clone
    clone.addEventListener('input', (e) => {
      if (originalElement) {
        originalElement.textContent = clone.textContent;
      }
    });
    
    clone.addEventListener('blur', () => {
      handleCloneBlur(clone, originalElement);
    });
    
    // Add clone to the document
    if (originalElement.parentNode) {
      originalElement.parentNode.appendChild(clone);
    }
    
    // Focus the clone
    setTimeout(() => {
      clone.focus();
    }, 10);
    
    return clone;
  };

  // Handle focus on text element
  const handleTextFocus = (e: Event) => {
    const element = e.target as HTMLElement;
    
    // Save original text for potential restoration
    element.setAttribute('data-original-text', element.textContent || '');
    
    // Create the clone for editing
    const clone = createClone(element);
    
    // Hide the original element during editing
    element.style.opacity = '0';
    
    // Store references to active elements
    setActiveEditElement(element);
    setClonedElement(clone);
  };

  // Handle blur on clone element
  const handleCloneBlur = (clone: HTMLElement, originalElement: HTMLElement) => {
    // Transfer content from clone to original
    if (originalElement) {
      if (!clone.textContent?.trim()) {
        // If empty, restore original text
        const originalText = originalElement.getAttribute('data-original-text') || '';
        originalElement.textContent = originalText;
      } else {
        originalElement.textContent = clone.textContent;
      }
      
      // Show the original element again
      originalElement.style.opacity = '1';
    }
    
    // Remove the clone from DOM
    if (clone.parentNode) {
      clone.parentNode.removeChild(clone);
    }
    
    // Clear references
    setActiveEditElement(null);
    setClonedElement(null);
    
    // Notify about edit
    toast.success('Text updated');
  };

  // Handle blur on text element
  const handleTextBlur = (e: Event) => {
    // This will be handled by handleCloneBlur for actual text updates
    // Only needed if somehow the original gets focus and then blur without clone creation
    const element = e.target as HTMLElement;
    
    // If no clone is active and this element is being edited, restore visibility
    if (!clonedElement && activeEditElement === element) {
      element.style.opacity = '1';
      setActiveEditElement(null);
    }
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
