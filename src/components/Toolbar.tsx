import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  setActiveTool,
  setSelectedColor,
  setLineThickness,
  undo,
  redo,
  clearAnnotations,
  createSignatureAnnotation,
  updateAnnotation,
  createImageAnnotation
} from '@/store/slices/annotationSlice';
import {
  loadPDF
} from '@/store/slices/pdfSlice';
import ActionButton from './ActionButton';
import {
  TextCursor,
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
  Type,
  Image
} from 'lucide-react';
import { toast } from 'sonner';
import { Position, FontFamily, TextAnnotation } from '@/types';

const Toolbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { activeTool, selectedColor, lineThickness, history, selectedAnnotationId } = useAppSelector(state => state.annotation);
  const { currentPage } = useAppSelector(state => state.pdf);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showLineThickness, setShowLineThickness] = useState(false);
  const [isSignatureMode, setIsSignatureMode] = useState(false);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);
  const [signaturePath, setSignaturePath] = useState<Position[]>([]);
  const [showFontOptions, setShowFontOptions] = useState(false);

  const selectedAnnotation = selectedAnnotationId ?
    history.present.find(ann => ann.id === selectedAnnotationId) : null;
  const selectedTextAnnotation = selectedAnnotation?.type === 'text' ?
    selectedAnnotation as TextAnnotation : null;

  const colorOptions = [
    '#1e88e5', // blue
    '#43a047', // green
    '#e53935', // red
    '#fb8c00', // orange
    '#8e24aa', // purple
    '#000000', // black
  ];

  const fontFamilyOptions = [
    { value: 'sans', label: 'Sans' },
    { value: 'serif', label: 'Serif' },
    { value: 'mono', label: 'Mono' },
    { value: 'cursive', label: 'Cursive' },
  ];

  const fontSizeOptions = [
    { value: 8, label: '8px' },
    { value: 9, label: '9px' },
    { value: 10, label: '10px' },
    { value: 11, label: '11px' },
    { value: 12, label: '12px' },
    { value: 10, label: '9px' },
    { value: 10, label: '10px' },
    { value: 11, label: '11px' },
    { value: 12, label: '12px' },
    { value: 16, label: '16px' },
    { value: 20, label: '20px' },
    { value: 24, label: '24px' },
    { value: 32, label: '32px' },
    { value: 48, label: '48px' },
    { value: 64, label: '64px' },
  ];

  const thicknessOptions = [
    { value: 'thin', label: 'Thin' },
    { value: 'medium', label: 'Medium' },
    { value: 'thick', label: 'Thick' },
  ];

  const handleFontFamilyChange = (fontFamily: FontFamily) => {
    if (selectedTextAnnotation) {
      dispatch(updateAnnotation({
        ...selectedTextAnnotation,
        fontFamily
      }));
    }
  };

  const handleFontSizeChange = (fontSize: number) => {
    if (selectedTextAnnotation) {
      dispatch(updateAnnotation({
        ...selectedTextAnnotation,
        fontSize
      }));
    }
  };

  const handleTextColorChange = (color: string) => {
    if (selectedTextAnnotation) {
      dispatch(updateAnnotation({
        ...selectedTextAnnotation,
        color
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please select a PDF file');
      return;
    }

    const fileUrl = URL.createObjectURL(file);
    dispatch(loadPDF({ url: fileUrl, name: file.name }));
    toast.success(`Loaded: ${file.name}`);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    const imageUrl = URL.createObjectURL(file);

    const img = new window.Image();
    img.onload = () => {
      const aspectRatio = img.width / img.height;
      const width = Math.min(300, img.width);
      const height = width / aspectRatio;

      dispatch(createImageAnnotation({
        position: { x: 100, y: 100 },
        size: { width, height },
        url: imageUrl,
        pageNumber: currentPage
      }));

      toast.success('Image added to document');
    };
    img.src = imageUrl;

    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleExportPDF = async () => {
    try {
      const pdfContainer = document.querySelector('#pdf-container');
      if (!pdfContainer) {
        toast.error('PDF container not found');
        return;
      }

      if (!window.html2canvas) {
        toast.error('HTML2Canvas not found. This is required for PDF export.');
        return;
      }

      toast.loading('Generating PDF...');

      const canvas = await window.html2canvas(pdfContainer as HTMLElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: null
      });

      const pdf = new window.jspdf.jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);

      const pdfName = 'annotated-document.pdf';
      pdf.save(pdfName);

      toast.dismiss();
      toast.success('PDF exported successfully!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.dismiss();
      toast.error('Failed to export PDF. Please try again.');
    }
  };

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

    setSignaturePath(prev => [...prev, point]);

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

  const saveSignature = () => {
    if (signaturePath.length < 2) {
      toast.error('Please draw a signature');
      return;
    }

    dispatch(createSignatureAnnotation({
      position: { x: 100, y: 100 },
      size: { width: 300, height: 150 },
      path: signaturePath,
      pageNumber: currentPage
    }));

    setIsSignatureMode(false);
    setSignaturePath([]);
    toast.success('Signature added to document');
  };

  const clearSignature = useCallback(() => {
    if (!signatureCanvasRef.current) return;

    const canvas = signatureCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    setSignaturePath([]);
  }, []);

  const cancelSignature = () => {
    setIsSignatureMode(false);
    setSignaturePath([]);
  };

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

  const renderTextAnnotationOptions = () => {
    if (!selectedTextAnnotation || activeTool !== 'text') return null;

    return (
      <div tabIndex={0} onClick={(e) => {
        e.stopPropagation();
      }} className="bg-white text-gray-800 py-2 px-4 border-b border-editor-border flex items-center gap-4 shadow-sm animate-slide-up text-toolbar"
      >
        <div className="relative">
          <ActionButton
            onClick={() => setShowFontOptions(!showFontOptions)}
            icon={<Type size={18} />}
            tooltip="Font Family"
          />

          {showFontOptions && (
            <div className="absolute top-full left-0 mt-2 p-2 bg-white rounded-lg shadow-lg border border-editor-border w-32 z-20 animate-scale-in">
              {fontFamilyOptions.map(font => (
                <div
                  key={font.value}
                  className={`px-3 py-2 cursor-pointer hover:bg-gray-100 rounded ${selectedTextAnnotation.fontFamily === font.value ? 'bg-primary/10 text-primary' : ''
                    }`}
                  onClick={() => handleFontFamilyChange(font.value as FontFamily)}
                >
                  <span className={`font-${font.value}`}>{font.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Size:</span>
          <select
            value={selectedTextAnnotation.fontSize || 16}
            onChange={(e) => handleFontSizeChange(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
          >
            {fontSizeOptions.map(size => (
              <option key={size.value} value={size.value}>
                {size.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Color:</span>
          <div className="flex gap-1">
            {colorOptions.map(color => (
              <div
                key={color}
                className={`w-5 h-5 rounded-full cursor-pointer hover:scale-110 transition-transform ${selectedTextAnnotation.color === color ? 'ring-2 ring-offset-1 ring-primary' : ''
                  }`}
                style={{ backgroundColor: color }}
                onClick={() => handleTextColorChange(color)}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  const getToolDescription = (tool: string) => {
    switch (tool) {
      case 'select':
        return 'Edit Mode: Select and modify annotations';
      case 'text':
        return 'Text Mode: Add or edit text annotations';
      case 'draw':
        return 'Draw Mode: Create or edit drawings';
      default:
        return '';
    }
  };

  return (
    <>
      <div className="bg-editor-panel py-2 px-4 border-b border-editor-border flex items-center gap-2 shadow-sm">
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

        <div className="flex items-center gap-2 border-r border-editor-border pr-2">
          <ActionButton
            onClick={() => window.zoomOutDom && window.zoomOutDom()}
            icon={<ZoomOut size={18} />}
            tooltip="Zoom Out"
          />
          <ActionButton
            onClick={() => window.zoomInDom && window.zoomInDom()}
            icon={<ZoomIn size={18} />}
            tooltip="Zoom In"
          />
        </div>

        <div className="flex items-center gap-2 border-r border-editor-border pr-2">
          <div className="flex items-center">
            <ActionButton
              onClick={() => dispatch(setActiveTool('select'))}
              icon={<TextCursor size={18} />}
              active={activeTool === 'select'}
              tooltip={getToolDescription('select')}
            />
          </div>
          <ActionButton
            onClick={() => {
              dispatch(setActiveTool('text'));
              setShowColorPicker(false);
              setShowLineThickness(false);
              setShowFontOptions(false);
            }}
            icon={<FileText size={18} />}
            active={activeTool === 'text'}
            tooltip={getToolDescription('text')}
          />
          <div className="relative">
            <ActionButton
              onClick={() => {
                dispatch(setActiveTool('draw'));
                setShowColorPicker(!showColorPicker);
                setShowLineThickness(false);
                setShowFontOptions(false);
              }}
              icon={<Pen size={18} />}
              active={activeTool === 'draw'}
              tooltip={getToolDescription('draw')}
            />

            {showColorPicker && (
              <div className="absolute top-full left-0 mt-2 p-2 bg-white rounded-lg shadow-lg border border-editor-border  z-10 text-centerz-20 animate-scale-in" style={{ width: '120px' }}>
                <div className=' grid grid-cols-3 gap-2 '>
                  {colorOptions.map(color => (
                    <div
                      key={color}
                      className={`color-option ${selectedColor === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color, borderColor: color === '#ffffff' ? '#e2e8f0' : color }}
                      onClick={() => dispatch(setSelectedColor(color))}
                    />
                  ))}
                </div>
                <hr className='my-2' />
                <div className='flex gap-2 items-center'>
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
              </div>
            )}
          </div>
          <div>
            <input
              type="file"
              ref={imageInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <ActionButton
              className="cursor-pointer"
              active={activeTool === 'image'}
              onClick={() => {
                dispatch(setActiveTool('image'));
                setShowColorPicker(false);
                setShowLineThickness(false);
                setShowFontOptions(false);
                imageInputRef.current?.click()
              }}

              icon={<Image size={18} />}
              tooltip="Upload Image"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ActionButton
            onClick={() => dispatch(undo())}
            icon={<Undo2 size={18} />}
            tooltip="Undo"
            className={history.past.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}
          />
          <ActionButton
            onClick={() => dispatch(redo())}
            icon={<Redo2 size={18} />}
            tooltip="Redo"
            className={history.future.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}
          />
          <ActionButton
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all annotations?')) {
                dispatch(clearAnnotations());
              }
            }}
            icon={<Trash size={18} />}
            tooltip="Clear All Annotations"
          />
        </div>
      </div>

      {renderTextAnnotationOptions()}

      {renderSignatureModal()}
    </>
  );
};

export default Toolbar;
