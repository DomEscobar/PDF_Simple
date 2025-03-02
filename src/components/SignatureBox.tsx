
import React, { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { deleteAnnotation, setSelectedAnnotation, updateSignaturePosition } from '@/store/slices/annotationSlice';
import { SignatureAnnotation as SignatureAnnotationType, Position } from '@/types';
import { X } from 'lucide-react';

type SignatureBoxProps = {
  annotation: SignatureAnnotationType;
  isSelected: boolean;
};

const SignatureBox: React.FC<SignatureBoxProps> = ({ annotation, isSelected }) => {
  const dispatch = useAppDispatch();
  const { activeTool } = useAppSelector(state => state.annotation);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw signature on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = annotation.size.width;
    canvas.height = annotation.size.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw the signature path
    if (annotation.path.length < 2) return;
    
    ctx.beginPath();
    ctx.moveTo(annotation.path[0].x, annotation.path[0].y);
    
    for (let i = 1; i < annotation.path.length; i++) {
      ctx.lineTo(annotation.path[i].x, annotation.path[i].y);
    }
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }, [annotation]);

  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool !== 'select') return;
    
    e.stopPropagation();
    dispatch(setSelectedAnnotation(annotation.id));
    
    // Start dragging
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - annotation.position.x,
      y: e.clientY - annotation.position.y
    });
  };

  // Handle mouse move for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      // Update position while dragging
      const newPosition: Position = {
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      };
      
      dispatch(updateSignaturePosition({
        id: annotation.id,
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
  }, [isDragging, dragOffset, annotation, dispatch]);

  // Handle delete
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(deleteAnnotation(annotation.id));
  };

  return (
    <div
      className={`annotation ${isSelected ? 'ring-2 ring-primary' : ''}`}
      style={{
        left: annotation.position.x,
        top: annotation.position.y,
        width: annotation.size.width,
        height: annotation.size.height,
        zIndex: isSelected ? 100 : 10,
        cursor: activeTool === 'select' ? 'move' : 'default',
        backgroundColor: 'transparent',
      }}
      onMouseDown={handleMouseDown}
    >
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
      />
      
      {/* Delete button (visible when selected) */}
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
