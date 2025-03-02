import React from 'react';
import { useAppSelector } from '@/store';
import TextAnnotation from './TextAnnotation';
import DrawingCanvas from './DrawingCanvas';
import SignatureBox from './SignatureBox';
import ImageAnnotation from './ImageAnnotation';

const PDFAnnotationsLayer: React.FC = () => {
  const { annotations, selectedAnnotationId } = useAppSelector(state => state.annotation.history);
  const { currentPage, scale } = useAppSelector(state => state.pdf);
  const { activeTool } = useAppSelector(state => state.annotation);

  const handleClick = () => {
    if (activeTool === 'text') {
      document.body.style.cursor = 'text';
    } else {
      document.body.style.cursor = 'default';
    }
  };

  // Filter annotations to only show those for the current page
  const currentPageAnnotations = annotations.filter(
    annotation => annotation.pageNumber === currentPage
  );

  return (
    <div
      className="absolute inset-0"
      style={{ transform: `scale(${scale})`, transformOrigin: 'top left', pointerEvents: 'none' }}
    >
      <div className="relative w-full h-full" style={{ pointerEvents: 'all' }} onClick={handleClick}>
        {/* Render all annotations for current page */}
        {currentPageAnnotations.map((annotation) => {
          // Check if annotation is selected
          const isSelected = selectedAnnotationId === annotation.id;
          
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
                annotation={annotation}
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
