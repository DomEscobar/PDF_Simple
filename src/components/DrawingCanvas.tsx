
import React, { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { finishDrawing, addPointToPath, setIsDrawing } from '@/store/slices/annotationSlice';
import { Position, DrawingAnnotation } from '@/types';

// Updated props to include the drawingAnnotation prop
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
  
  // If we're rendering an existing drawing annotation, we don't need pageNumber from props
  const effectivePageNumber = pageNumber || (drawingAnnotation?.pageNumber || 1);
  
  // Setup canvas size and context when dimensions change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // If we're rendering an existing annotation, we don't need to set up the canvas
    // for drawing new annotations
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
  
  // Get thickness value based on lineThickness setting
  const getThicknessValue = (thickness: string): number => {
    return thickness === 'thin' ? 2 : thickness === 'medium' ? 5 : 8;
  };
  
  // Handle drawing interactions - only if not rendering an existing annotation
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
  
  // Render current drawing path or existing drawing annotation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set up canvas dimensions for existing annotation
    if (drawingAnnotation) {
      // Determine canvas size based on drawing content
      let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
      
      drawingAnnotation.paths.forEach(path => {
        path.points.forEach(point => {
          minX = Math.min(minX, point.x);
          minY = Math.min(minY, point.y);
          maxX = Math.max(maxX, point.x);
          maxY = Math.max(maxY, point.y);
        });
      });
      
      // Set canvas dimensions with some padding
      const padding = 10;
      canvas.width = (maxX - minX + padding * 2) * scale;
      canvas.height = (maxY - minY + padding * 2) * scale;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Render the drawing annotation
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
    
    // From here on, we're handling the drawing canvas for creating new annotations
    
    // Clear canvas
    if (pageWidth && pageHeight) {
      ctx.clearRect(0, 0, pageWidth, pageHeight);
    }
    
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
    
    // Render all drawing annotations for this page (if not rendering an existing annotation)
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
  
  // Different styling based on whether it's an existing annotation or the drawing canvas
  const canvasStyle = drawingAnnotation ? 
    { border: isSelected ? '1px dashed #1e88e5' : 'none', cursor: 'move' } : 
    { zIndex: 20 };
  
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
