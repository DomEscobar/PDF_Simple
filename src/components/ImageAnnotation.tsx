
import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { deleteAnnotation, setSelectedAnnotationId, updateAnnotation } from '@/store/slices/annotationSlice';
import { ImageAnnotation as ImageAnnotationType, Position, Size } from '@/types';
import { X } from 'lucide-react';

type ImageAnnotationProps = {
  annotation: ImageAnnotationType;
  isSelected: boolean;
};

const ImageAnnotation: React.FC<ImageAnnotationProps> = ({ annotation, isSelected }) => {
  const dispatch = useAppDispatch();
  const { activeTool } = useAppSelector(state => state.annotation);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const scale = 1; // Pseudo LET IT

  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool !== 'image') return;

    e.stopPropagation();
    dispatch(setSelectedAnnotationId(annotation.id));

    setIsDragging(true);
    setDragOffset({
      x: e.clientX - (annotation.position.x * scale),
      y: e.clientY - (annotation.position.y * scale)
    });
  };

  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    if (activeTool !== 'image') return;

    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    setDragOffset({
      x: e.clientX,
      y: e.clientY
    });
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newPosition: Position = {
          x: (e.clientX - dragOffset.x) / scale,
          y: (e.clientY - dragOffset.y) / scale
        };

        dispatch(updateAnnotation({
          ...annotation,
          position: newPosition
        }));
      } else if (isResizing && resizeDirection) {
        e.preventDefault();

        const deltaX = e.clientX - dragOffset.x;
        const deltaY = e.clientY - dragOffset.y;

        let newSize: Size = { ...annotation.size };
        let newPosition: Position = { ...annotation.position };

        switch (resizeDirection) {
          case 'ne':
            newSize.width = Math.max(50, annotation.size.width + (deltaX / scale));
            newSize.height = Math.max(30, annotation.size.height - (deltaY / scale));
            newPosition.y = annotation.position.y + (deltaY / scale);
            break;
          case 'se':
            newSize.width = Math.max(50, annotation.size.width + (deltaX / scale));
            newSize.height = Math.max(30, annotation.size.height + (deltaY / scale));
            break;
          case 'sw':
            newSize.width = Math.max(50, annotation.size.width - (deltaX / scale));
            newSize.height = Math.max(30, annotation.size.height + (deltaY / scale));
            newPosition.x = annotation.position.x + (deltaX / scale);
            break;
          case 'nw':
            newSize.width = Math.max(50, annotation.size.width - (deltaX / scale));
            newSize.height = Math.max(30, annotation.size.height - (deltaY / scale));
            newPosition.x = annotation.position.x + (deltaX / scale);
            newPosition.y = annotation.position.y + (deltaY / scale);
            break;
        }

        dispatch(updateAnnotation({
          ...annotation,
          size: newSize,
          position: newPosition
        }));

        setDragOffset({
          x: e.clientX,
          y: e.clientY
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeDirection(null);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, resizeDirection, dragOffset, annotation, dispatch, scale]);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(deleteAnnotation(annotation.id));
  };

  return (
    <div

      className={`z-40 absolute annotation-element ${isSelected ? 'ring-2 ring-primary' : 'border border-gray-200'} ${activeTool === 'image' ? 'active' : ''}`}
      style={{
        left: annotation.position.x * scale,
        top: annotation.position.y * scale,
        width: annotation.size.width * scale,
        height: annotation.size.height * scale,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        borderRadius: '4px',
        zIndex: isSelected ? 35 : 30,
        cursor: activeTool === 'image' ? 'move' : 'default'
      }}
      onMouseDown={handleMouseDown}
    >
      <img
        src={annotation.url}
        alt="Uploaded annotation"
        draggable={false}
        className="w-full h-full object-contain"
      />

      {isSelected && activeTool === 'image' && (
        <>
          <div className="absolute w-3 h-3 bg-primary rounded-full border border-white top-0 left-0 -translate-x-1/2 -translate-y-1/2 cursor-nw-resize"
            onMouseDown={(e) => handleResizeStart(e, 'nw')} />
          <div className="absolute w-3 h-3 bg-primary rounded-full border border-white top-0 right-0 translate-x-1/2 -translate-y-1/2 cursor-ne-resize"
            onMouseDown={(e) => handleResizeStart(e, 'ne')} />
          <div className="absolute w-3 h-3 bg-primary rounded-full border border-white bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-sw-resize"
            onMouseDown={(e) => handleResizeStart(e, 'sw')} />
          <div className="absolute w-3 h-3 bg-primary rounded-full border border-white bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-se-resize"
            onMouseDown={(e) => handleResizeStart(e, 'se')} />

          <button
            className="absolute -top-3 -right-3 bg-destructive text-white rounded-full p-1 opacity-80 hover:opacity-100 transition-opacity"
            onClick={handleDelete}
          >
            <X size={14} />
          </button>
        </>
      )}
    </div>
  );
};

export default ImageAnnotation;
