
import React, { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { deleteAnnotation, setSelectedAnnotationId, updateAnnotation } from '@/store/slices/annotationSlice';
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

  // Focus on the textarea when selected or newly created
  useEffect(() => {
    if (isSelected && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isSelected]);

  // Handle blur (losing focus) events
  const handleBlur = (e: React.FocusEvent) => {
    // Only clear selection if we're not clicking on another part of this annotation
    // Check if the related target is part of this annotation
    const currentElement = e.currentTarget;
    const relatedTarget = e.relatedTarget as Node;
    
    if (!currentElement.contains(relatedTarget)) {
      // If the focus is moving outside this annotation, clear selection
      setTimeout(() => {
        // Use setTimeout to let click events happen first
        // This prevents immediate deselection when clicking on the annotation's controls
        if (document.activeElement !== textareaRef.current) {
          // Only deselect if focus isn't still on the textarea
          dispatch(setSelectedAnnotationId(null));
        }
      }, 0);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // We want to handle mouse down regardless of the active tool
    e.stopPropagation();
    dispatch(setSelectedAnnotationId(annotation.id));

    // Allow dragging if we're in text or select tool mode
    if (activeTool === 'select' || activeTool === 'text') {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - (annotation.position.x * scale),
        y: e.clientY - (annotation.position.y * scale)
      });
    }
  };

  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    if (activeTool !== 'select' && activeTool !== 'text') return;
    
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    setDragOffset({
      x: e.clientX,
      y: e.clientY
    });
  };

  useEffect(() => {
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

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch(updateAnnotation({
      ...annotation,
      content: e.target.value
    }));
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(deleteAnnotation(annotation.id));
  };

  // Get the actual font family to use (with fallbacks)
  const getFontFamilyStyle = () => {
    switch (annotation.fontFamily) {
      case 'serif':
        return 'font-serif';
      case 'mono':
        return 'font-mono';
      case 'cursive':
        return 'font-["Segoe Script","Brush Script MT",cursive]';
      default:
        return 'font-sans';
    }
  };

  return (
    <div
      className={`absolute annotation-element ${isSelected ? 'ring-2 ring-primary' : 'border border-gray-200'}`}
      style={{
        left: annotation.position.x * scale,
        top: annotation.position.y * scale,
        width: annotation.size.width * scale,
        height: annotation.size.height * scale,
        backgroundColor: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        borderRadius: '4px',
        zIndex: isSelected ? 35 : 30
      }}
      onMouseDown={handleMouseDown}
      onBlur={handleBlur}
    >
      <textarea
        ref={textareaRef}
        value={annotation.content}
        onChange={handleContentChange}
        className={`w-full h-full p-2 resize-none bg-transparent border-none focus:outline-none focus:ring-0 ${getFontFamilyStyle()}`}
        style={{
          color: annotation.color,
          fontSize: `${annotation.fontSize * scale}px`,
          cursor: 'default' // Change cursor to default (arrow pointer) for text
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
      />
      
      {isSelected && (activeTool === 'select' || activeTool === 'text') && (
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

export default TextAnnotation;
