
import React, { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { finishDrawing, addPointToPath, setIsDrawing } from '@/store/slices/annotationSlice';
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
    if (activeTool !== 'draw' && isDrawing) {
      dispatch(finishDrawing());
      setCurrentPath([]);
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [activeTool, dispatch, isDrawing]);
  
  // Get thickness value based on lineThickness setting
  const getThicknessValue = (thickness: string): number => {
    return thickness === 'thin' ? 2 : thickness === 'medium' ? 5 : 8;
  };
  
  // Setup drawing handlers
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
    if (activeTool !== 'draw' || currentPath.length === 0 || !isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const newPoint: Position = {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };
    
    // Add point to current path
    setCurrentPath(prevPath => [...prevPath, newPoint]);
    dispatch(addPointToPath(newPoint));
    
    // Draw on canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(newPoint.x * scale, newPoint.y * scale);
      ctx.stroke();
    }
  };
  
  const handleDrawEnd = () => {
    if (activeTool !== 'draw' || currentPath.length === 0 || !isDrawing) return;
    
    // Finish drawing
    dispatch(finishDrawing());
    
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
  }, [history.present, activeTool, currentPath, scale]);
  
  return (
    <canvas
      ref={canvasRef}
      className="canvas-container absolute top-0 left-0 w-full h-full"
      style={{
        zIndex: activeTool === 'draw' ? 20 : 5, 
        pointerEvents: activeTool === 'draw' ? 'auto' : 'none',
        cursor: activeTool === 'draw' ? 'crosshair' : 'default'
      }}
      onMouseDown={handleDrawStart}
      onMouseMove={handleDrawMove}
      onMouseUp={handleDrawEnd}
      onMouseLeave={handleDrawEnd}
    />
  );
};

export default DrawingCanvas;
