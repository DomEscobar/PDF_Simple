
import React from 'react';
import { Annotation } from '@/types';
import TextAnnotation from './TextAnnotation';
import SignatureBox from './SignatureBox';

interface PDFAnnotationsLayerProps {
  history: Annotation[];
  selectedAnnotationId: string | null;
}

const PDFAnnotationsLayer: React.FC<PDFAnnotationsLayerProps> = ({ 
  history, 
  selectedAnnotationId 
}) => {
  return (
    <div className="absolute inset-0 z-30 pointer-events-none">
      {history.map((annotation: Annotation) => {
        if (annotation.type === 'drawing') return null; // Drawing annotations are handled by DrawingCanvas
        
        // Each annotation gets pointer-events-auto to be interactive
        return (
          <div key={annotation.id} className="pointer-events-auto">
            {annotation.type === 'text' && (
              <TextAnnotation
                annotation={annotation}
                isSelected={selectedAnnotationId === annotation.id}
              />
            )}
            {annotation.type === 'signature' && (
              <SignatureBox
                annotation={annotation}
                isSelected={selectedAnnotationId === annotation.id}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PDFAnnotationsLayer;
