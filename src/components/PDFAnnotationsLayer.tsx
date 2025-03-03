
import React from 'react';
import { useAppSelector } from '@/store';
import TextAnnotation from './TextAnnotation';
import DrawingCanvas from './DrawingCanvas';
import SignatureBox from './SignatureBox';
import ImageAnnotation from './ImageAnnotation';
import { Annotation, DrawingAnnotation } from '@/types';

interface PDFAnnotationsLayerProps {
  // Make these props optional since we'll also use the Redux store
  currentPageAnnotations?: Annotation[];
  selectedAnnotationId?: string | null;
}

const PDFAnnotationsLayer: React.FC<PDFAnnotationsLayerProps> = ({
  currentPageAnnotations,
  selectedAnnotationId: selectedId
}) => {
  const { history, selectedAnnotationId } = useAppSelector(state => state.annotation);
  const { currentPage, scale } = useAppSelector(state => state.pdf);
  const { activeTool } = useAppSelector(state => state.annotation);
  
  // Use props if provided, otherwise use data from the Redux store
  const annotations = currentPageAnnotations || history.present.filter(
    annotation => annotation.pageNumber === currentPage
  );
  const selectedAnnotationIdToUse = selectedId !== undefined ? selectedId : selectedAnnotationId;

  const handleClick = (e: React.MouseEvent) => {
    // Prevent click event from bubbling up to the container
    // but only if we've actually clicked on an annotation (not the background)
    const isAnnotationClick = (e.target as HTMLElement).tagName !== 'DIV' || 
                              (e.target as HTMLElement).classList.contains('annotation-element');
                              
    if (isAnnotationClick) {
      e.stopPropagation();
    }
    
    if (activeTool === 'text') {
      document.body.style.cursor = 'default'; // Switch to default pointer for text tool
    } else {
      document.body.style.cursor = 'default';
    }
  };

  return (
    <div
      className="absolute inset-0"
      style={{ transform: `scale(${scale})`, transformOrigin: 'top left', pointerEvents: 'none' }}
    >
      <div className="relative w-full h-full" style={{ pointerEvents: 'all' }} onClick={handleClick}>
        {/* Render all annotations for current page */}
        {annotations.map((annotation) => {
          // Check if annotation is selected
          const isSelected = selectedAnnotationIdToUse === annotation.id;
          
          if (annotation.type === 'text') {
            return (
              <TextAnnotation
                key={annotation.id}
                annotation={annotation}
                isSelected={isSelected}
              />
            );
          } else if (annotation.type === 'drawing') {
            return (
              <DrawingCanvas
                key={annotation.id}
                drawingAnnotation={annotation as DrawingAnnotation}
                isSelected={isSelected}
              />
            );
          } else if (annotation.type === 'signature') {
            return (
              <SignatureBox
                key={annotation.id}
                annotation={annotation}
                isSelected={isSelected}
              />
            );
          } else if (annotation.type === 'image') {
            return (
              <ImageAnnotation
                key={annotation.id}
                annotation={annotation}
                isSelected={isSelected}
              />
            );
          }
          
          return null;
        })}
      </div>
    </div>
  );
};

export default PDFAnnotationsLayer;
