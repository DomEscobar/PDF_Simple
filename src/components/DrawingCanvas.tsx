
import React, { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { addDrawingPath, createDrawingAnnotation, finalizeDrawing, getThicknessValue } from '@/store/slices/annotationSlice';
import { Position } from '@/types';

type DrawingCanvasProps = {
  pageWidth: number;
  pageHeight: number;
};

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ pageWidth, pageHeight }) => {
  const dispatch = useAppDispatch();
  const { activeTool, selectedAnnotationId, selectedColor, lineThickness, isDrawing } = useAppSelector(state => state.annotation);
  const { scale } = useAppSelector(state => state.pdf);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentPath, setCurrentPath] = useState<Position[]>([]);
  const [drawingId, setDrawingId] = useState<string | null>(null);
  
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
  
  // Clear canvas and reset drawing state when tool changes
  useEffect(() => {
    if (activeTool !== 'draw' && drawingId) {
      dispatch(finalizeDrawing(null)); // Pass null as payload
      setDrawingId(null);
      setCurrentPath([]);
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [activeTool, dispatch]);
  
  // Setup drawing handlers
  const handleDrawStart = (e: React.MouseEvent) => {
    if (activeTool !== 'draw') return;
    
    // Create a new drawing annotation if needed
    if (!drawingId) {
      const id = dispatch(createDrawingAnnotation(null)).payload; // Pass null as payload
      setDrawingId(id);
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const startPoint: Position = {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };
    
    setCurrentPath([startPoint]);
    
    // Setup canvas for drawing
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(startPoint.x * scale, startPoint.y * scale);
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = getThicknessValue(lineThickness) * scale;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  };
  
  const handleDrawMove = (e: React.MouseEvent) => {
    if (activeTool !== 'draw' || currentPath.length === 0 || !drawingId) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const newPoint: Position = {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };
    
    // Add point to current path
    setCurrentPath(prevPath => [...prevPath, newPoint]);
    
    // Draw on canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(newPoint.x * scale, newPoint.y * scale);
      ctx.stroke();
    }
  };
  
  const handleDrawEnd = () => {
    if (activeTool !== 'draw' || currentPath.length === 0 || !drawingId) return;
    
    // Add drawing path to the annotation
    dispatch(addDrawingPath({
      id: drawingId,
      points: [...currentPath],
      color: selectedColor,
      thickness: getThicknessValue(lineThickness),
    }));
    
    // Reset current path
    setCurrentPath([]);
    
    // Clear temporary canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };
  
  // Render drawing annotations from the store
  const { history } = useAppSelector(state => state.annotation);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Don't render drawings when actively drawing
    if (activeTool === 'draw' && currentPath.length > 0) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Render all drawing annotations
    history.present
      .filter(ann => ann.type === 'drawing')
      .forEach(annotation => {
        const drawing = annotation;
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
  }, [history.present, activeTool, currentPath, scale]);
  
  return (
    <canvas
      ref={canvasRef}
      className={`canvas-container ${activeTool === 'draw' ? 'active' : ''}`}
      onMouseDown={handleDrawStart}
      onMouseMove={handleDrawMove}
      onMouseUp={handleDrawEnd}
      onMouseLeave={handleDrawEnd}
    />
  );
};

export default DrawingCanvas;
