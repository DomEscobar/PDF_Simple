
import React, { useCallback, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  setActiveTool,
  setSelectedColor,
  setLineThickness,
  undo,
  redo,
  clearAnnotations,
  createSignatureAnnotation,
} from '@/store/slices/annotationSlice';
import {
  loadPDF,
  zoomIn,
  zoomOut,
} from '@/store/slices/pdfSlice';
import ActionButton from './ActionButton';
import {
  MousePointer,
  FileDown,
  FileUp,
  Highlighter,
  Pen,
  Signature,
  Redo2,
  Undo2,
  ZoomIn,
  ZoomOut,
  FileText,
  Trash,
} from 'lucide-react';
import { toast } from 'sonner';
import { Position } from '@/types';

const Toolbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { activeTool, selectedColor, lineThickness, history } = useAppSelector(state => state.annotation);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showLineThickness, setShowLineThickness] = useState(false);
  const [isSignatureMode, setIsSignatureMode] = useState(false);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);
  const [signaturePath, setSignaturePath] = useState<Position[]>([]);

  // Color options
  const colorOptions = [
    '#1e88e5', // blue
    '#43a047', // green
    '#e53935', // red
    '#fb8c00', // orange
    '#8e24aa', // purple
    '#000000', // black
  ];

  // Line thickness options
  const thicknessOptions = [
    { value: 'thin', label: 'Thin' },
    { value: 'medium', label: 'Medium' },
    { value: 'thick', label: 'Thick' },
  ];

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is a PDF
    if (file.type !== 'application/pdf') {
      toast.error('Please select a PDF file');
      return;
    }

    // Load the PDF file
    const fileUrl = URL.createObjectURL(file);
    dispatch(loadPDF({ url: fileUrl, name: file.name }));
    toast.success(`Loaded: ${file.name}`);

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle export PDF
  const handleExportPDF = () => {
    // This is a placeholder for PDF export functionality
    // In a real implementation, we would use a library like jsPDF or PDF.js to generate the PDF with annotations
    toast.success('PDF exported successfully!');
  };

  // Handle signature canvas events
  const handleSignatureStart = (e: React.MouseEvent) => {
    if (!signatureCanvasRef.current) return;
    
    const canvas = signatureCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const point: Position = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    
    setIsDrawingSignature(true);
    setSignaturePath([point]);
    
    // Start drawing on canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  };

  const handleSignatureMove = (e: React.MouseEvent) => {
    if (!isDrawingSignature || !signatureCanvasRef.current) return;
    
    const canvas = signatureCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const point: Position = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    
    // Add point to path
    setSignaturePath(prev => [...prev, point]);
    
    // Draw on canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }
  };

  const handleSignatureEnd = () => {
    if (!isDrawingSignature) return;
    setIsDrawingSignature(false);
  };

  // Save signature and exit signature mode
  const saveSignature = () => {
    if (signaturePath.length < 2) {
      toast.error('Please draw a signature');
      return;
    }
    
    // Create signature annotation
    dispatch(createSignatureAnnotation({
      position: { x: 100, y: 100 },
      size: { width: 300, height: 150 },
      path: signaturePath,
    }));
    
    // Exit signature mode
    setIsSignatureMode(false);
    setSignaturePath([]);
    toast.success('Signature added to document');
  };

  // Clear signature canvas
  const clearSignature = useCallback(() => {
    if (!signatureCanvasRef.current) return;
    
    const canvas = signatureCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    setSignaturePath([]);
  }, []);

  // Cancel signature mode
  const cancelSignature = () => {
    setIsSignatureMode(false);
    setSignaturePath([]);
  };

  // Render signature modal
  const renderSignatureModal = () => {
    if (!isSignatureMode) return null;
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
        <div className="panel-glass p-6 w-full max-w-lg">
          <h3 className="text-lg font-medium mb-4 text-center">Draw Your Signature</h3>
          
          <div className="bg-white rounded-lg border border-editor-border mb-4 overflow-hidden">
            <canvas
              ref={signatureCanvasRef}
              width={500}
              height={200}
              className="w-full h-[200px]"
              onMouseDown={handleSignatureStart}
              onMouseMove={handleSignatureMove}
              onMouseUp={handleSignatureEnd}
              onMouseLeave={handleSignatureEnd}
            />
          </div>
          
          <div className="flex gap-3 justify-center">
            <button
              onClick={clearSignature}
              className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
            >
              Clear
            </button>
            <button
              onClick={cancelSignature}
              className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={saveSignature}
              className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors"
              disabled={signaturePath.length < 2}
            >
              Save Signature
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Main toolbar */}
      <div className="bg-editor-panel py-2 px-4 border-b border-editor-border flex items-center gap-2 shadow-sm">
        {/* File operations */}
        <div className="flex items-center gap-2 border-r border-editor-border pr-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf"
            className="hidden"
          />
          <ActionButton
            onClick={() => fileInputRef.current?.click()}
            icon={<FileUp size={18} />}
            tooltip="Open PDF"
          />
          <ActionButton
            onClick={handleExportPDF}
            icon={<FileDown size={18} />}
            tooltip="Export PDF"
          />
        </div>
        
        {/* Zoom controls */}
        <div className="flex items-center gap-2 border-r border-editor-border pr-2">
          <ActionButton
            onClick={() => dispatch(zoomOut())}
            icon={<ZoomOut size={18} />}
            tooltip="Zoom Out"
          />
          <ActionButton
            onClick={() => dispatch(zoomIn())}
            icon={<ZoomIn size={18} />}
            tooltip="Zoom In"
          />
        </div>
        
        {/* Editing tools */}
        <div className="flex items-center gap-2 border-r border-editor-border pr-2">
          <ActionButton
            onClick={() => dispatch(setActiveTool('select'))}
            icon={<MousePointer size={18} />}
            active={activeTool === 'select'}
            tooltip="Select Tool"
          />
          <ActionButton
            onClick={() => {
              dispatch(setActiveTool('text'));
              setShowColorPicker(false);
              setShowLineThickness(false);
            }}
            icon={<FileText size={18} />}
            active={activeTool === 'text'}
            tooltip="Text Annotation"
          />
          <div className="relative">
            <ActionButton
              onClick={() => {
                dispatch(setActiveTool('draw'));
                setShowColorPicker(!showColorPicker);
                setShowLineThickness(false);
              }}
              icon={<Pen size={18} />}
              active={activeTool === 'draw'}
              tooltip="Draw Tool"
            />
            
            {/* Color picker dropdown */}
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-2 p-2 bg-white rounded-lg shadow-lg border border-editor-border grid grid-cols-3 gap-2 z-20 animate-scale-in">
                {colorOptions.map(color => (
                  <div
                    key={color}
                    className={`color-option ${selectedColor === color ? 'selected' : ''}`}
                    style={{ backgroundColor: color, borderColor: color === '#ffffff' ? '#e2e8f0' : color }}
                    onClick={() => dispatch(setSelectedColor(color))}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <ActionButton
              onClick={() => {
                setShowLineThickness(!showLineThickness);
                setShowColorPicker(false);
              }}
              icon={<Highlighter size={18} />}
              active={showLineThickness}
              tooltip="Line Thickness"
            />
            
            {/* Line thickness dropdown */}
            {showLineThickness && (
              <div className="absolute top-full left-0 mt-2 p-2 bg-white rounded-lg shadow-lg border border-editor-border flex flex-col gap-2 z-20 animate-scale-in">
                {thicknessOptions.map(option => (
                  <div
                    key={option.value}
                    className={`thickness-option ${lineThickness === option.value ? 'selected' : ''}`}
                    onClick={() => dispatch(setLineThickness(option.value as any))}
                  >
                    <div
                      className="rounded-full bg-current"
                      style={{
                        width: option.value === 'thin' ? '4px' : option.value === 'medium' ? '8px' : '12px',
                        height: option.value === 'thin' ? '4px' : option.value === 'medium' ? '8px' : '12px',
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          <ActionButton
            onClick={() => {
              setIsSignatureMode(true);
              setShowColorPicker(false);
              setShowLineThickness(false);
            }}
            icon={<Signature size={18} />}
            tooltip="Add Signature"
          />
        </div>
        
        {/* History controls */}
        <div className="flex items-center gap-2">
          <ActionButton
            onClick={() => dispatch(undo(null))} // Pass null as payload
            icon={<Undo2 size={18} />}
            tooltip="Undo"
            className={history.past.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}
          />
          <ActionButton
            onClick={() => dispatch(redo(null))} // Pass null as payload
            icon={<Redo2 size={18} />}
            tooltip="Redo"
            className={history.future.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}
          />
          <ActionButton
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all annotations?')) {
                dispatch(clearAnnotations(null)); // Pass null as payload
              }
            }}
            icon={<Trash size={18} />}
            tooltip="Clear All Annotations"
          />
        </div>
      </div>
      
      {/* Signature modal */}
      {renderSignatureModal()}
    </>
  );
};

export default Toolbar;
