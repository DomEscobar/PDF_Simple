import React, { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { finishDrawing, addPointToPath, setIsDrawing } from '@/store/slices/annotationSlice';
import { Position, DrawingAnnotation } from '@/types';

type DrawingCanvasProps = {
  pageWidth?: number;
  pageHeight?: number;
  pageNumber?: number;
  drawingAnnotation?: DrawingAnnotation;
  isSelected?: boolean;
};

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ 
  pageWidth, 
  pageHeight, 
  pageNumber,
  drawingAnnotation,
  isSelected = false
}) => {
  const dispatch = useAppDispatch();
  const { activeTool, isDrawing, currentPath, history } = useAppSelector(state => state.annotation);
  const { scale } = useAppSelector(state => state.pdf);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const effectivePageNumber = pageNumber || (drawingAnnotation?.pageNumber || 1);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    if (drawingAnnotation) return;
    
    if (pageWidth && pageHeight) {
      canvas.width = pageWidth;
      canvas.height = pageHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, pageWidth, pageHeight);
      }
    }
  }, [pageWidth, pageHeight, drawingAnnotation]);
  
  const getThicknessValue = (thickness: string): number => {
    return thickness === 'thin' ? 2 : thickness === 'medium' ? 5 : 8;
  };
  
  const handleDrawStart = (e: React.MouseEvent) => {
    if (activeTool !== 'draw' || drawingAnnotation) return;
    
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
    if (activeTool !== 'draw' || !isDrawing || drawingAnnotation) return;
    
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
    if (activeTool !== 'draw' || !isDrawing || drawingAnnotation) return;
    dispatch(finishDrawing(effectivePageNumber));
  };
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    if (drawingAnnotation) {
      let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
      
      drawingAnnotation.paths.forEach(path => {
        path.points.forEach(point => {
          minX = Math.min(minX, point.x);
          minY = Math.min(minY, point.y);
          maxX = Math.max(maxX, point.x);
          maxY = Math.max(maxY, point.y);
        });
      });
      
      const padding = 10;
      canvas.width = (maxX - minX + padding * 2) * scale;
      canvas.height = (maxY - minY + padding * 2) * scale;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      drawingAnnotation.paths.forEach(path => {
        if (path.points.length < 2) return;
        
        ctx.beginPath();
        ctx.moveTo((path.points[0].x - minX + padding) * scale, (path.points[0].y - minY + padding) * scale);
        
        for (let i = 1; i < path.points.length; i++) {
          ctx.lineTo((path.points[i].x - minX + padding) * scale, (path.points[i].y - minY + padding) * scale);
        }
        
        ctx.strokeStyle = path.color;
        ctx.lineWidth = path.thickness * scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      });
      
      return;
    }
    
    if (pageWidth && pageHeight) {
      ctx.clearRect(0, 0, pageWidth, pageHeight);
    }
    
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
    
    history.present
      .filter(ann => ann.type === 'drawing' && ann.pageNumber === effectivePageNumber)
      .forEach(annotation => {
        const drawing = annotation as DrawingAnnotation;
        drawing.paths.forEach(path => {
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
  }, [history.present, activeTool, currentPath, isDrawing, scale, effectivePageNumber, drawingAnnotation, pageWidth, pageHeight]);
  
  const canvasStyle = drawingAnnotation ? 
    { border: isSelected ? '1px dashed #1e88e5' : 'none', cursor: 'move' } : 
    { 
      zIndex: 20,
      pointerEvents: activeTool === 'draw' ? 'all' : 'none'
    };
  
  return (
    <canvas
      ref={canvasRef}
      className={`canvas-container ${activeTool === 'draw' && !drawingAnnotation ? 'active' : ''}`}
      style={canvasStyle}
      onMouseDown={handleDrawStart}
      onMouseMove={handleDrawMove}
      onMouseUp={handleDrawEnd}
      onMouseLeave={handleDrawEnd}
    />
  );
};

export default DrawingCanvas;
