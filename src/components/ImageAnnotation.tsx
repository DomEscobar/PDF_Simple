
import React from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { deleteAnnotation, setSelectedAnnotationId } from '@/store/slices/annotationSlice';
import { ImageAnnotation as ImageAnnotationType } from '@/types';
import { X } from 'lucide-react';

type ImageAnnotationProps = {
  annotation: ImageAnnotationType;
  isSelected: boolean;
};

const ImageAnnotation: React.FC<ImageAnnotationProps> = ({ annotation, isSelected }) => {
  const dispatch = useAppDispatch();
  const { activeTool } = useAppSelector(state => state.annotation);
  const { scale } = useAppSelector(state => state.pdf);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool !== 'select') return;
    
    e.stopPropagation();
    dispatch(setSelectedAnnotationId(annotation.id));
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(deleteAnnotation(annotation.id));
  };

  return (
    <div
      className={`absolute ${isSelected ? 'ring-2 ring-primary' : 'border border-gray-200'}`}
      style={{
        left: annotation.position.x * scale,
        top: annotation.position.y * scale,
        width: annotation.size.width * scale,
        height: annotation.size.height * scale,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        borderRadius: '4px',
        zIndex: isSelected ? 35 : 30,
        cursor: activeTool === 'select' ? 'move' : 'default'
      }}
      onMouseDown={handleMouseDown}
    >
      <img 
        src={annotation.url} 
        alt="Uploaded annotation" 
        className="w-full h-full object-contain"
      />
      
      {isSelected && activeTool === 'select' && (
        <button
          className="absolute -top-3 -right-3 bg-destructive text-white rounded-full p-1 opacity-80 hover:opacity-100 transition-opacity"
          onClick={handleDelete}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default ImageAnnotation;
