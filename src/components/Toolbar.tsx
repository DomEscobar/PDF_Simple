import React, { useState, useCallback } from 'react';
import {
  Undo,
  Redo,
  TextCursor,
  Pencil,
  Eraser,
  Save,
  Download,
  Signature,
  ImageIcon,
  ArrowLeftRight,
  X,
} from 'lucide-react';
import { SketchPicker } from 'react-color';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  setActiveTool,
  setColor,
  setLineThickness,
  undo,
  redo,
  setFontFamily,
} from '@/store/slices/annotationSlice';
import { Color, LineThickness, ToolType, FontFamily } from '@/types';
import { toast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface ToolbarProps {
  onFileChange: (file: File) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ onFileChange }) => {
  const dispatch = useAppDispatch();
  const { color, lineThickness, activeTool, fontFamily } = useAppSelector(state => state.annotation);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showThicknessPicker, setShowThicknessPicker] = useState(false);
  const [fontSize, setFontSize] = useState(16); // Default font size

  const handleToolClick = (tool: ToolType) => {
    dispatch(setActiveTool(tool));
  };

  const handleColorChange = (newColor: Color) => {
    dispatch(setColor(newColor));
  };

  const handleThicknessChange = (thickness: LineThickness) => {
    dispatch(setLineThickness(thickness));
  };

  const handleUndo = () => {
    dispatch(undo());
  };

  const handleRedo = () => {
    dispatch(redo());
  };

  const handleFontFamilyChange = (fontFamily: FontFamily) => {
    dispatch(setFontFamily(fontFamily));
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFontSize(Number(e.target.value));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileChange(file);
    }
  };

  const handleExportPDF = async () => {
    try {
      // Get the PDF container
      const pdfContainer = document.querySelector('.pdf-container');
      
      if (!pdfContainer || typeof window.html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
        console.error('PDF export failed: Missing required elements or libraries');
        toast({
          title: 'Export failed',
          description: 'There was an error exporting the PDF. Please try again.',
          variant: 'destructive',
        });
        return;
      }
      
      // Show loading toast
      toast({
        title: 'Exporting PDF',
        description: 'Please wait while we generate your PDF...',
      });
      
      // Convert the PDF container to a canvas
      const canvas = await window.html2canvas(pdfContainer as HTMLElement, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
      });
      
      // Create a new PDF
      const pdf = new window.jspdf.jsPDF({
        orientation: 'portrait',
        unit: 'mm',
      });
      
      // Get the canvas dimensions
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add the image to the PDF
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // Save the PDF
      pdf.save('annotated-document.pdf');
      
      // Show success toast
      toast({
        title: 'PDF exported successfully',
        description: 'Your PDF has been downloaded.',
      });
    } catch (error) {
      console.error('PDF export failed:', error);
      toast({
        title: 'Export failed',
        description: 'There was an error exporting the PDF. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="bg-editor-panel border-b border-editor-border flex items-center justify-between p-2">
      <div className="flex items-center space-x-2">
        <Button size="icon" variant="ghost" onClick={handleUndo} disabled={false}>
          <Undo className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={handleRedo} disabled={false}>
          <Redo className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Font Size <ArrowLeftRight className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="p-2">
            <div className="grid gap-4 py-2">
              <div className="space-y-1">
                <Label htmlFor="font-size">Font size (px)</Label>
                <Input
                  id="font-size"
                  type="number"
                  defaultValue={fontSize}
                  className="w-[100px] text-right"
                  onChange={handleFontSizeChange}
                />
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Font Family <ArrowLeftRight className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="p-2">
            <DropdownMenuLabel>Select a font family</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleFontFamilyChange('sans')}>
              Sans-Serif
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFontFamilyChange('serif')}>
              Serif
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFontFamilyChange('mono')}>
              Monospace
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFontFamilyChange('cursive')}>
              Cursive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          className={`tool-button ${activeTool === 'text' ? 'active' : ''}`}
          onClick={() => handleToolClick('text')}
          aria-label="Add Text"
        >
          <TextCursor className="h-4 w-4" />
        </button>

        <button
          className={`tool-button ${activeTool === 'draw' ? 'active' : ''}`}
          onClick={() => handleToolClick('draw')}
          aria-label="Draw"
        >
          <Pencil className="h-4 w-4" />
        </button>

        <button
          className={`tool-button ${activeTool === 'eraser' ? 'active' : ''}`}
          onClick={() => handleToolClick('eraser')}
          aria-label="Erase"
        >
          <Eraser className="h-4 w-4" />
        </button>

        <button
          className={`tool-button ${activeTool === 'signature' ? 'active' : ''}`}
          onClick={() => handleToolClick('signature')}
          aria-label="Add Signature"
        >
          <Signature className="h-4 w-4" />
        </button>

        <input
          type="file"
          id="image-upload"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />
        <label htmlFor="image-upload">
          <button className="tool-button" aria-label="Add Image">
            <ImageIcon className="h-4 w-4" />
          </button>
        </label>

        <div className="relative">
          <button
            className="tool-button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            aria-label="Pick Color"
          >
            <div
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: color, border: '1px solid #ccc' }}
            />
          </button>
          {showColorPicker && (
            <div className="absolute z-10 mt-1">
              <SketchPicker color={color} onChangeComplete={(c) => handleColorChange(c.hex)} />
            </div>
          )}
        </div>

        <div className="relative">
          <button
            className="tool-button"
            onClick={() => setShowThicknessPicker(!showThicknessPicker)}
            aria-label="Pick Thickness"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </button>
          {showThicknessPicker && (
            <div className="absolute z-10 mt-1 panel-glass p-4">
              <div className="flex flex-col items-center">
                <button
                  className={`thickness-option ${lineThickness === 'thin' ? 'selected' : ''}`}
                  onClick={() => handleThicknessChange('thin')}
                  aria-label="Thin Thickness"
                >
                  <div style={{ width: '4px', height: '4px', borderRadius: '2px', backgroundColor: color }} />
                </button>
                <button
                  className={`thickness-option ${lineThickness === 'medium' ? 'selected' : ''}`}
                  onClick={() => handleThicknessChange('medium')}
                  aria-label="Medium Thickness"
                >
                  <div style={{ width: '6px', height: '6px', borderRadius: '3px', backgroundColor: color }} />
                </button>
                <button
                  className={`thickness-option ${lineThickness === 'thick' ? 'selected' : ''}`}
                  onClick={() => handleThicknessChange('thick')}
                  aria-label="Thick Thickness"
                >
                  <div style={{ width: '8px', height: '8px', borderRadius: '4px', backgroundColor: color }} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button variant="outline" onClick={handleExportPDF}>
          <Download className="mr-2 h-4 w-4" />
          Export PDF
        </Button>
        <Button variant="outline">
          <Save className="mr-2 h-4 w-4" />
          Save
        </Button>
      </div>
    </div>
  );
};

export default Toolbar;
