
import React, { useRef, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { SignatureAnnotation } from '@/types';

interface SignatureBoxProps {
  onSave: (signatureImage: string) => void;
  onCancel: () => void;
  width?: number;
  height?: number;
  isSelected?: boolean;
  annotation?: SignatureAnnotation;
}

const SignatureBox: React.FC<SignatureBoxProps> = ({
  onSave,
  onCancel,
  width = 300,
  height = 150,
  isSelected,
  annotation
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const draw = (e: MouseEvent) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    setLastX(e.offsetX);
    setLastY(e.offsetY);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDrawing(true);
    setLastX(e.nativeEvent.offsetX);
    setLastY(e.nativeEvent.offsetY);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleMouseOut = () => {
    setIsDrawing(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    draw(e.nativeEvent);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const signatureImage = canvas.toDataURL('image/png');
    onSave(signatureImage);
    toast.success('Signature saved!');
  };

  return (
    <div className="panel-glass p-4 flex flex-col gap-4">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ border: '1px solid #000', cursor: 'crosshair' }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseOut={handleMouseOut}
        onMouseMove={handleMouseMove}
      />
      <div className="flex justify-between">
        <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded" onClick={clearCanvas}>
          Clear
        </button>
        <div className="flex gap-2">
          <button className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded" onClick={onCancel}>
            Cancel
          </button>
          <button className="bg-primary hover:bg-primary/90 text-white font-bold py-2 px-4 rounded" onClick={saveSignature}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignatureBox;
