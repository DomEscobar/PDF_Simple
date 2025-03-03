
import React, { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { deleteAnnotation, setSelectedAnnotationId, updateAnnotation } from '@/store/slices/annotationSlice';
import { TextAnnotation as TextAnnotationType, Position, Size } from '@/types';
import { X } from 'lucide-react';
import { scaleFactor } from './PDFViewer';

type TextAnnotationProps = {
  annotation: TextAnnotationType;
  isSelected: boolean;
};

const TextAnnotation: React.FC<TextAnnotationProps> = ({ annotation, isSelected }) => {
  const dispatch = useAppDispatch();
  const { activeTool } = useAppSelector(state => state.annotation);
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
    if (isResizing || isDragging) return;
    setTimeout(() => {


      const currentElement = e.currentTarget;
      const relatedTarget = e.relatedTarget as Node | null;

      // Get the toolbar element
      const toolbar = document.querySelector(".text-toolbar");
      const activeElement = document.activeElement;

      if (
        (currentElement?.contains(relatedTarget) ||
          relatedTarget?.contains(currentElement) ||
          toolbar?.contains(activeElement))
      ) {
        // If focus moves within the annotation or toolbar, do nothing
        return;
      }

      // Otherwise, clear selection after a short delay
      if (document.activeElement !== textareaRef.current) {
        dispatch(setSelectedAnnotationId(null));
      }
    }, 100);
  };


  const handleMouseDown = (e: React.MouseEvent) => {
    // We want to handle mouse down regardless of the active tool
    e.stopPropagation();
    dispatch(setSelectedAnnotationId(annotation.id));

    // Allow dragging if we're in text or select tool mode
    if (activeTool === 'text') {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - (annotation.position.x * scaleFactor),
        y: e.clientY - (annotation.position.y * scaleFactor)
      });
    }
  };

  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    if (activeTool !== 'text') return;

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
      const scale = scaleFactor;
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

        const scale = 1;
        const minWidth = 30;
        const minHeight = 10;
        switch (resizeDirection) {
          case 'ne':
            newSize.width = Math.max(minWidth, annotation.size.width + (deltaX / scale));
            newSize.height = Math.max(minHeight, annotation.size.height - (deltaY / scale));
            newPosition.y = annotation.position.y + (deltaY / scale);
            break;
          case 'se':
            newSize.width = Math.max(minWidth, annotation.size.width + (deltaX / scale));
            newSize.height = Math.max(minHeight, annotation.size.height + (deltaY / scale));
            break;
          case 'sw':
            newSize.width = Math.max(minWidth, annotation.size.width - (deltaX / scale));
            newSize.height = Math.max(minHeight, annotation.size.height + (deltaY / scale));
            newPosition.x = annotation.position.x + (deltaX / scale);
            break;
          case 'nw':
            newSize.width = Math.max(minWidth, annotation.size.width - (deltaX / scale));
            newSize.height = Math.max(minHeight, annotation.size.height - (deltaY / scale));
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
      setTimeout(() => {
        setIsDragging(false);
        setIsResizing(false);
        setResizeDirection(null);
      }, 200);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, resizeDirection, dragOffset, annotation, dispatch]);

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
      className={`absolute annotation-element ${isSelected ? 'ring-2 ring-primary' : ''}`}
      style={{
        left: annotation.position.x,
        top: annotation.position.y,
        width: annotation.size.width,
        height: annotation.size.height,
        backgroundColor: 'white',
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
        className={`w-full h-full p-1 resize-none bg-transparent border-none focus:outline-none focus:ring-0 ${getFontFamilyStyle()}`}
        style={{
          color: annotation.color,
          fontSize: `${annotation.fontSize}px`,
          cursor: 'default' // Change cursor to default (arrow pointer) for text
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
      />

      {isSelected && (activeTool === 'text') && (
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
