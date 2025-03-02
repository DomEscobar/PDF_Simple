import React, { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { deleteAnnotation, setSelectedAnnotationId, updateAnnotation } from '@/store/slices/annotationSlice';
import { SignatureAnnotation as SignatureAnnotationType, Position } from '@/types';
import { X } from 'lucide-react';

type SignatureBoxProps = {
  annotation: SignatureAnnotationType;
  isSelected: boolean;
};

const SignatureBox: React.FC<SignatureBoxProps> = ({ annotation, isSelected }) => {
  const dispatch = useAppDispatch();
  const { activeTool } = useAppSelector(state => state.annotation);
  const { scale } = useAppSelector(state => state.pdf);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = annotation.size.width * scale;
    canvas.height = annotation.size.height * scale;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (annotation.path.length < 2) return;
    
    ctx.beginPath();
    ctx.moveTo(annotation.path[0].x * scale, annotation.path[0].y * scale);
    
    for (let i = 1; i < annotation.path.length; i++) {
      ctx.lineTo(annotation.path[i].x * scale, annotation.path[i].y * scale);
    }
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2 * scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }, [annotation, scale]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool !== 'select') return;
    
    e.stopPropagation();
    dispatch(setSelectedAnnotationId(annotation.id));
    
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - (annotation.position.x * scale),
      y: e.clientY - (annotation.position.y * scale)
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newPosition: Position = {
        x: (e.clientX - dragOffset.x) / scale,
        y: (e.clientY - dragOffset.y) / scale
      };
      
      dispatch(updateAnnotation({
        ...annotation,
        position: newPosition
      }));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, annotation, dispatch, scale]);

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
        cursor: activeTool === 'select' ? 'move' : 'default',
        backgroundColor: 'transparent',
        transition: 'none'
      }}
      onMouseDown={handleMouseDown}
    >
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
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

export default SignatureBox;
