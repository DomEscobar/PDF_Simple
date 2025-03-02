
import React, { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { deleteAnnotation, setSelectedAnnotation, updateTextAnnotation } from '@/store/slices/annotationSlice';
import { TextAnnotation as TextAnnotationType, Position, Size } from '@/types';
import { X } from 'lucide-react';

type TextAnnotationProps = {
  annotation: TextAnnotationType;
  isSelected: boolean;
};

const TextAnnotation: React.FC<TextAnnotationProps> = ({ annotation, isSelected }) => {
  const dispatch = useAppDispatch();
  const { activeTool } = useAppSelector(state => state.annotation);
  const { scale } = useAppSelector(state => state.pdf);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea when selected
  useEffect(() => {
    if (isSelected && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isSelected]);

  // Mouse down handler for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool !== 'select') return;
    
    e.stopPropagation();
    dispatch(setSelectedAnnotation(annotation.id));

    // Start dragging
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - (annotation.position.x * scale),
      y: e.clientY - (annotation.position.y * scale)
    });
  };

  // Mouse down handler for resize handles
  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    if (activeTool !== 'select') return;
    
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    setDragOffset({
      x: e.clientX,
      y: e.clientY
    });
  };

  // Mouse move handler for dragging and resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        // Update position while dragging
        const newPosition: Position = {
          x: (e.clientX - dragOffset.x) / scale,
          y: (e.clientY - dragOffset.y) / scale
        };
        
        dispatch(updateTextAnnotation({
          id: annotation.id,
          position: newPosition
        }));
      } else if (isResizing && resizeDirection) {
        e.preventDefault();
        
        // Calculate deltas
        const deltaX = e.clientX - dragOffset.x;
        const deltaY = e.clientY - dragOffset.y;
        
        // Update size based on resize direction
        let newSize: Size = { ...annotation.size };
        
        switch (resizeDirection) {
          case 'ne':
            newSize.width = Math.max(50, annotation.size.width + (deltaX / scale));
            newSize.height = Math.max(30, annotation.size.height - (deltaY / scale));
            dispatch(updateTextAnnotation({
              id: annotation.id,
              size: newSize,
              position: {
                x: annotation.position.x,
                y: annotation.position.y + (deltaY / scale)
              }
            }));
            break;
          case 'se':
            newSize.width = Math.max(50, annotation.size.width + (deltaX / scale));
            newSize.height = Math.max(30, annotation.size.height + (deltaY / scale));
            dispatch(updateTextAnnotation({
              id: annotation.id,
              size: newSize
            }));
            break;
          case 'sw':
            newSize.width = Math.max(50, annotation.size.width - (deltaX / scale));
            newSize.height = Math.max(30, annotation.size.height + (deltaY / scale));
            dispatch(updateTextAnnotation({
              id: annotation.id,
              size: newSize,
              position: {
                x: annotation.position.x + (deltaX / scale),
                y: annotation.position.y
              }
            }));
            break;
          case 'nw':
            newSize.width = Math.max(50, annotation.size.width - (deltaX / scale));
            newSize.height = Math.max(30, annotation.size.height - (deltaY / scale));
            dispatch(updateTextAnnotation({
              id: annotation.id,
              size: newSize,
              position: {
                x: annotation.position.x + (deltaX / scale),
                y: annotation.position.y + (deltaY / scale)
              }
            }));
            break;
        }
        
        // Update drag offset for next move event
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

  // Handle content change
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch(updateTextAnnotation({
      id: annotation.id,
      content: e.target.value
    }));
  };

  // Handle annotation delete
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(deleteAnnotation(annotation.id));
  };

  return (
    <div
      className={`annotation ${isSelected ? 'ring-2 ring-primary' : ''}`}
      style={{
        left: annotation.position.x * scale,
        top: annotation.position.y * scale,
        width: annotation.size.width * scale,
        height: annotation.size.height * scale,
        zIndex: isSelected ? 100 : 10,
        transition: 'none'
      }}
      onMouseDown={handleMouseDown}
    >
      <textarea
        ref={textareaRef}
        value={annotation.content}
        onChange={handleContentChange}
        className="w-full h-full p-2 resize-none bg-transparent border-none focus:outline-none focus:ring-0"
        style={{
          color: annotation.color,
          fontSize: `${annotation.fontSize * scale}px`,
          cursor: activeTool === 'select' ? 'move' : 'default',
          transition: 'none'
        }}
        onClick={(e) => e.stopPropagation()}
      />
      
      {/* Resize handles (only visible when selected) */}
      {isSelected && activeTool === 'select' && (
        <>
          <div className="annotation-handle top-0 left-0 cursor-nw-resize" 
               onMouseDown={(e) => handleResizeStart(e, 'nw')} />
          <div className="annotation-handle top-0 right-0 cursor-ne-resize" 
               onMouseDown={(e) => handleResizeStart(e, 'ne')} />
          <div className="annotation-handle bottom-0 left-0 cursor-sw-resize" 
               onMouseDown={(e) => handleResizeStart(e, 'sw')} />
          <div className="annotation-handle bottom-0 right-0 cursor-se-resize" 
               onMouseDown={(e) => handleResizeStart(e, 'se')} />
          
          {/* Delete button */}
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

export default TextAnnotation;
