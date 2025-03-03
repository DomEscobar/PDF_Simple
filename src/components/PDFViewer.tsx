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
import { makeTextElementsEditable, enableTextLayerEditing, disableTextLayerEditing } from '@/utils/pdfTextEdit';
import PDFLoadingStates from './PDFLoadingStates';
import PDFAnnotationsLayer from './PDFAnnotationsLayer';
import { FileUp, Upload } from 'lucide-react';
import { isAnnotationActive } from './TextAnnotation';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export let scaleFactor = 1.0;
const PDFViewer: React.FC = () => {
  const dispatch = useAppDispatch();
  const { url, currentPage, totalPages } = useAppSelector(state => state.pdf);
  const { activeTool, selectedAnnotationId, history } = useAppSelector(state => state.annotation);
  const containerRef = useRef<HTMLDivElement>(null);
  const documentRef = useRef<Document>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pageSizes, setPageSizes] = useState<{ width: number; height: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const zoomInDom = () => {
    if (!pdfContainerRef.current || !containerRef.current) return;

    const currentTransform = pdfContainerRef.current.style.transform;
    let currentScale = 1.0;

    if (currentTransform) {
      const match = currentTransform.match(/scale\(([^)]+)\)/);
      if (match && match[1]) {
        currentScale = parseFloat(match[1]);
      }
    }

    const newScale = Math.min(currentScale + 0.1, 3.0);
    pdfContainerRef.current.style.transform = `scale(${newScale})`;
    pdfContainerRef.current.style.transformOrigin = 'top center';

    const newHeight = pdfContainerRef.current.scrollHeight * newScale;
    containerRef.current.style.height = `${newHeight}px`;
    scaleFactor = newScale;
  };

  const zoomOutDom = () => {
    if (!pdfContainerRef.current || !containerRef.current) return;

    const currentTransform = pdfContainerRef.current.style.transform;
    let currentScale = 1.0;

    if (currentTransform) {
      const match = currentTransform.match(/scale\(([^)]+)\)/);
      if (match && match[1]) {
        currentScale = parseFloat(match[1]);
      }
    }

    const newScale = Math.max(currentScale - 0.1, 0.5);
    pdfContainerRef.current.style.transform = `scale(${newScale})`;
    pdfContainerRef.current.style.transformOrigin = 'top center';

    const newHeight = pdfContainerRef.current.scrollHeight * newScale;
    containerRef.current.style.height = `${newHeight}px`;
    scaleFactor = newScale;
  };

  useEffect(() => {
    window.zoomInDom = zoomInDom;
    window.zoomOutDom = zoomOutDom;

    return () => {
      delete window.zoomInDom;
      delete window.zoomOutDom;
    };
  }, []);

  useEffect(() => {
    if (!pdfContainerRef.current || !containerRef.current || isLoading) return;

    pdfContainerRef.current.style.transform = 'scale(1)';
    pdfContainerRef.current.style.transformOrigin = 'top center';
    containerRef.current.style.height = `${pdfContainerRef.current.scrollHeight}px`;
  }, [url, isLoading]);

  useEffect(() => {
    if (!url || isLoading) return;

    const timeout = setTimeout(() => {
      makeTextElementsEditable(containerRef);
    }, 500);

    return () => clearTimeout(timeout);
  }, [url, isLoading]);

  useEffect(() => {
    if (!url || isLoading) return;

    const timeout = setTimeout(() => {
      if (activeTool === 'select') {
        makeTextElementsEditable(containerRef);
        // In text editing mode, enable text layer interaction
        enableTextLayerEditing(containerRef);
      } else {
        // In other modes (draw, select), disable text layer interaction
        disableTextLayerEditing(containerRef);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [url, isLoading, activeTool]);

  const handlePDFClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return;

    const target = e.target as HTMLElement;
    const isAnnotationClick = target.closest('.annotation-element') !== null;

    if (isAnnotationActive) {
      return;
    }

    // Don't deselect when clicking on annotations
    if (!isAnnotationClick) {
      dispatch(setSelectedAnnotationId(null));
    }

    if (activeTool === 'select') {
      document.body.style.cursor = 'text';
    }

    if (activeTool === 'draw') {
      document.body.style.cursor = 'crosshair';
    } else if (activeTool === 'text' && !isAnnotationClick) {

      const documentElement = document.querySelector('.document-container') as HTMLElement;
      // Only create a new text annotation if we didn't click on an existing annotation
      const rect = documentElement.getBoundingClientRect();
      const position: Position = {
        x: (e.clientX - rect.left) / scaleFactor,
        y: (e.clientY - rect.top) / scaleFactor,
      };

      dispatch(createTextAnnotation({
        position,
        pageNumber: currentPage,
        content: '',
        fontSize: 11,
        color: '#000000'
      }));

      document.body.style.cursor = 'text';
    }
  };

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    dispatch(setTotalPages(numPages));
    setIsLoading(false);
    setPageSizes(Array(numPages).fill({ width: 0, height: 0 }));
    toast.success(`Document loaded with ${numPages} pages`);
  };

  const handleDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    setLoadError(error);
    setIsLoading(false);
    toast.error('Failed to load PDF document');
  };

  const handlePageRenderSuccess = (page: any, index: number) => {
    const viewport = page.getViewport({ scale: 1 });
    setPageSizes(prev => {
      const newSizes = [...prev];
      newSizes[index] = {
        width: viewport.width * scaleFactor,
        height: viewport.height * scaleFactor,
      };
      return newSizes;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please select a PDF file');
      return;
    }

    const fileUrl = URL.createObjectURL(file);
    dispatch(loadPDF({ url: fileUrl, name: file.name }));
    toast.success(`Loaded: ${file.name}`);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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

    if (file.type !== 'application/pdf') {
      toast.error('Please select a PDF file');
      return;
    }

    const fileUrl = URL.createObjectURL(file);
    dispatch(loadPDF({ url: fileUrl, name: file.name }));
    toast.success(`Loaded: ${file.name}`);
  };

  useEffect(() => {
    if (activeTool === 'select') {
      if (containerRef.current) {
        enableTextLayerEditing(containerRef);
      }
    } else if (activeTool === 'text') {
      document.body.style.cursor = 'text';
      // Enable text layer when switching to text tool
      if (containerRef.current) {
        disableTextLayerEditing(containerRef);
      }
    } else if (activeTool === 'draw') {
      document.body.style.cursor = 'crosshair';
      // Disable text layer when switching to draw tool
      if (containerRef.current) {
        disableTextLayerEditing(containerRef);
      }
    } else {
      document.body.style.cursor = 'default';
      // Disable text layer editability but keep interactivity for selection
      if (containerRef.current) {
        disableTextLayerEditing(containerRef);
      }
    }
  }, [activeTool]);

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
      {!url && renderUploadZone()}

      {url && <PDFLoadingStates
        url={url}
        isLoading={isLoading}
        loadError={loadError}
      />}

      {url && (
        <div
          ref={pdfContainerRef}
          className="relative flex flex-col items-center space-y-6 py-6 transition-transform"
        >
          <Document
            file={url}
            ref={documentRef}

            onLoadSuccess={handleDocumentLoadSuccess}
            onLoadError={handleDocumentLoadError}
            loading={<div>Loading PDF...</div>}
            className="document-container animate-fade-in"
          >
            {Array.from(new Array(totalPages), (_, index) => (
              <div key={`page_${index + 1}`} className="relative mb-8">
                <Page
                  pageNumber={index + 1}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  onRenderSuccess={(page) => handlePageRenderSuccess(page, index)}
                  className="shadow-lg"
                />

                <DrawingCanvas
                  pageWidth={pageSizes[index]?.width || 0}
                  pageHeight={pageSizes[index]?.height || 0}
                  pageNumber={index + 1}
                />

                <PDFAnnotationsLayer
                  currentPageAnnotations={history.present.filter(item => item.pageNumber === index + 1)}
                  selectedAnnotationId={selectedAnnotationId}
                  onAnnotationLayerClick={(e) => { }}
                />
              </div>
            ))}
          </Document>
        </div>
      )}
    </div>
  );
};

declare global {
  interface Window {
    zoomInDom: () => void;
    zoomOutDom: () => void;
  }
}

export default PDFViewer;
