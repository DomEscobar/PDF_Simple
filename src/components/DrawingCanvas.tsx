
import React, { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { finishDrawing, addPointToPath, setIsDrawing } from '@/store/slices/annotationSlice';
import { Position } from '@/types';

type DrawingCanvasProps = {
  pageWidth: number;
  pageHeight: number;
  pageNumber: number;
};

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ pageWidth, pageHeight, pageNumber }) => {
  const dispatch = useAppDispatch();
  const { activeTool, isDrawing, currentPath, history } = useAppSelector(state => state.annotation);
  const { scale } = useAppSelector(state => state.pdf);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Setup canvas size and context when dimensions change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = pageWidth;
    canvas.height = pageHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, pageWidth, pageHeight);
    }
  }, [pageWidth, pageHeight]);
  
  // Get thickness value based on lineThickness setting
  const getThicknessValue = (thickness: string): number => {
    return thickness === 'thin' ? 2 : thickness === 'medium' ? 5 : 8;
  };
  
  // Handle drawing interactions
  const handleDrawStart = (e: React.MouseEvent) => {
    if (activeTool !== 'draw') return;
    
    dispatch(setIsDrawing(true));
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const startPoint: Position = {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };
    
    dispatch(addPointToPath(startPoint));
  };
  
  const handleDrawMove = (e: React.MouseEvent) => {
    if (activeTool !== 'draw' || !isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const newPoint: Position = {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };
    
    dispatch(addPointToPath(newPoint));
  };
  
  const handleDrawEnd = () => {
    if (activeTool !== 'draw' || !isDrawing) return;
    dispatch(finishDrawing(pageNumber));
  };
  
  // Render current drawing path
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw active path if any
    if (currentPath && currentPath.points.length > 0 && isDrawing) {
      ctx.beginPath();
      ctx.moveTo(currentPath.points[0].x * scale, currentPath.points[0].y * scale);
      
      for (let i = 1; i < currentPath.points.length; i++) {
        ctx.lineTo(currentPath.points[i].x * scale, currentPath.points[i].y * scale);
      }
      
      ctx.strokeStyle = currentPath.color;
      ctx.lineWidth = currentPath.thickness * scale;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
    
    // Render all drawing annotations for this page
    history.present
      .filter(ann => ann.type === 'drawing' && ann.pageNumber === pageNumber)
      .forEach(annotation => {
        const drawing = annotation as any;  // Using type assertion here
        drawing.paths.forEach((path: any) => {
          if (path.points.length < 2) return;
          
          ctx.beginPath();
          ctx.moveTo(path.points[0].x * scale, path.points[0].y * scale);
          
          for (let i = 1; i < path.points.length; i++) {
            ctx.lineTo(path.points[i].x * scale, path.points[i].y * scale);
          }
          
          ctx.strokeStyle = path.color;
          ctx.lineWidth = path.thickness * scale;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
        });
      });
  }, [history.present, activeTool, currentPath, isDrawing, scale, pageNumber]);
  
  return (
    <canvas
      ref={canvasRef}
      className={`canvas-container ${activeTool === 'draw' ? 'active' : ''}`}
      style={{ zIndex: 20 }}
      onMouseDown={handleDrawStart}
      onMouseMove={handleDrawMove}
      onMouseUp={handleDrawEnd}
      onMouseLeave={handleDrawEnd}
    />
  );
};

export default DrawingCanvas;
