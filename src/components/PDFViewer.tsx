import React, { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { useAppDispatch, useAppSelector } from '@/store';
import { setTotalPages, loadPDF } from '@/store/slices/pdfSlice';
import { setIsDrawing, createTextAnnotation, setSelectedAnnotationId } from '@/store/slices/annotationSlice';
import DrawingCanvas from './DrawingCanvas';
import { Position } from '@/types';
import { toast } from 'sonner';
import { makeTextElementsEditable } from '@/utils/pdfTextEdit';
import PDFLoadingStates from './PDFLoadingStates';
import PDFAnnotationsLayer from './PDFAnnotationsLayer';
import { FileUp, Upload } from 'lucide-react';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PDFViewer: React.FC = () => {
  const dispatch = useAppDispatch();
  const { url, currentPage, totalPages, scale } = useAppSelector(state => state.pdf);
  const { activeTool, selectedAnnotationId, history } = useAppSelector(state => state.annotation);
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pageSizes, setPageSizes] = useState<{ width: number; height: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Pure DOM-based zoom functions without state updates
  const zoomInDom = () => {
    if (!pdfContainerRef.current || !containerRef.current) return;
    
    // Get current scale from transform property or default to 1
    const currentTransform = pdfContainerRef.current.style.transform;
    let currentScale = 1.0;
    
    if (currentTransform) {
      const match = currentTransform.match(/scale\(([^)]+)\)/);
      if (match && match[1]) {
        currentScale = parseFloat(match[1]);
      }
    }
    
    // Calculate new scale (max 3.0)
    const newScale = Math.min(currentScale + 0.1, 3.0);
    
    // Apply scale transform directly to the PDF container
    pdfContainerRef.current.style.transform = `scale(${newScale})`;
    pdfContainerRef.current.style.transformOrigin = 'top center';
    
    // Adjust container height to compensate for scaling
    const newHeight = pdfContainerRef.current.scrollHeight * newScale;
    containerRef.current.style.height = `${newHeight}px`;
  };

  const zoomOutDom = () => {
    if (!pdfContainerRef.current || !containerRef.current) return;
    
    // Get current scale from transform property or default to 1
    const currentTransform = pdfContainerRef.current.style.transform;
    let currentScale = 1.0;
    
    if (currentTransform) {
      const match = currentTransform.match(/scale\(([^)]+)\)/);
      if (match && match[1]) {
        currentScale = parseFloat(match[1]);
      }
    }
    
    // Calculate new scale (min 0.5)
    const newScale = Math.max(currentScale - 0.1, 0.5);
    
    // Apply scale transform directly to the PDF container
    pdfContainerRef.current.style.transform = `scale(${newScale})`;
    pdfContainerRef.current.style.transformOrigin = 'top center';
    
    // Adjust container height to compensate for scaling
    const newHeight = pdfContainerRef.current.scrollHeight * newScale;
    containerRef.current.style.height = `${newHeight}px`;
  };

  // Make zoom functions available globally
  useEffect(() => {
    window.zoomInDom = zoomInDom;
    window.zoomOutDom = zoomOutDom;
    
    return () => {
      // Clean up when component unmounts
      delete window.zoomInDom;
      delete window.zoomOutDom;
    };
  }, []);

  // Apply initial transform when PDF is loaded
  useEffect(() => {
    if (!pdfContainerRef.current || !containerRef.current || isLoading) return;
    
    // Initialize with scale 1
    pdfContainerRef.current.style.transform = 'scale(1)';
    pdfContainerRef.current.style.transformOrigin = 'top center';
    
    // Set initial container height
    containerRef.current.style.height = `${pdfContainerRef.current.scrollHeight}px`;
  }, [url, isLoading]);

  // Make text elements editable after PDF rendering
  useEffect(() => {
    if (!url || isLoading) return;

    // Wait for the PDF to render
    const timeout = setTimeout(() => {
      makeTextElementsEditable(containerRef);
    }, 500);

    return () => clearTimeout(timeout);
  }, [url, isLoading, scale]);

  // Handle PDF click
  const handlePDFClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    // Check if we clicked on the background - if target is the containerRef or its direct child
    const isBackgroundClick = e.target === containerRef.current || 
                             (e.target instanceof Element && 
                              e.target.parentElement === containerRef.current);
    
    // Deselect annotation when clicking on empty space
    if (isBackgroundClick && activeTool === 'select') {
      dispatch(setSelectedAnnotationId(null));
      return;
    }
    
    // Handle different tool clicks
    if (activeTool === 'draw') {
      // Drawing is handled by DrawingCanvas component
    } else if (activeTool === 'text') {
      // Get click position relative to the PDF container
      const rect = containerRef.current.getBoundingClientRect();
      const position: Position = {
        x: (e.clientX - rect.left) / scale,
        y: (e.clientY - rect.top) / scale,
      };
      
      // Create text annotation at click position - pass currentPage in payload
      dispatch(createTextAnnotation({ position, pageNumber: currentPage }));
    }
  };

  // Handle document load success
  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    dispatch(setTotalPages(numPages));
    setIsLoading(false);
    // Initialize page sizes array
    setPageSizes(Array(numPages).fill({ width: 0, height: 0 }));
    toast.success(`Document loaded with ${numPages} pages`);
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

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is a PDF
    if (file.type !== 'application/pdf') {
      toast.error('Please select a PDF file');
      return;
    }

    // Load the PDF file
    const fileUrl = URL.createObjectURL(file);
    dispatch(loadPDF({ url: fileUrl, name: file.name }));
    toast.success(`Loaded: ${file.name}`);

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle drag and drop events
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length === 0) return;
    
    const file = files[0];
    
    // Check if file is a PDF
    if (file.type !== 'application/pdf') {
      toast.error('Please select a PDF file');
      return;
    }
    
    // Load the PDF file
    const fileUrl = URL.createObjectURL(file);
    dispatch(loadPDF({ url: fileUrl, name: file.name }));
    toast.success(`Loaded: ${file.name}`);
  };

  // Render upload zone
  const renderUploadZone = () => {
    return (
      <div 
        className={`flex flex-col items-center justify-center w-full h-full p-8 border-2 border-dashed rounded-lg transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-editor-border'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf"
          className="hidden"
        />
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <div className="p-4 rounded-full bg-editor-panel">
            <FileUp size={48} className="text-primary" />
          </div>
          <h2 className="text-2xl font-semibold">Upload your PDF</h2>
          <p className="text-muted-foreground">Drag and drop your PDF file here, or click the button below to select a file</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Upload size={20} />
            <span>Select PDF File</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={containerRef}
      className="pdf-container overflow-auto"
      onClick={handlePDFClick}
    >
      {/* Show upload zone if no PDF is loaded */}
      {!url && renderUploadZone()}
      
      {/* Show loading states or errors if present */}
      {url && <PDFLoadingStates 
        url={url} 
        isLoading={isLoading} 
        loadError={loadError} 
      />}

      {/* Render PDF document */}
      {url && (
        <div 
          ref={pdfContainerRef}
          className="relative flex flex-col items-center space-y-6 py-6 transition-transform"
        >
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
                  pageNumber={index + 1}
                />
                
                {/* Render all annotations for each page */}
                <PDFAnnotationsLayer 
                  currentPageAnnotations={history.present.filter(item => item.pageNumber === index + 1)} 
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

// Add the window interface for TypeScript
declare global {
  interface Window {
    zoomInDom: () => void;
    zoomOutDom: () => void;
  }
}

export default PDFViewer;
