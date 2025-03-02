
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
    <>
      {history.map((annotation: Annotation) => {
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
      })}
    </>
  );
};

export default PDFAnnotationsLayer;
