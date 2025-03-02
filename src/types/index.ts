
export type Position = {
  x: number;
  y: number;
};

export type Size = {
  width: number;
  height: number;
};

export type Color = string;

export type ToolType = 'select' | 'text' | 'draw' | 'signature' | 'eraser';

export type LineThickness = 'thin' | 'medium' | 'thick';

export type FontFamily = 'sans' | 'serif' | 'mono' | 'cursive';

export type TextAnnotation = {
  id: string;
  type: 'text';
  content: string;
  position: Position;
  size: Size;
  color: Color;
  fontSize: number;
  fontFamily?: FontFamily;
  createdAt: number;
  pageNumber: number;
};

export type DrawingAnnotation = {
  id: string;
  type: 'drawing';
  paths: {
    points: Position[];
    color: Color;
    thickness: number;
  }[];
  createdAt: number;
  pageNumber: number;
};

export type SignatureAnnotation = {
  id: string;
  type: 'signature';
  path: Position[];
  position: Position;
  size: Size;
  createdAt: number;
  pageNumber: number;
};

export type Annotation = TextAnnotation | DrawingAnnotation | SignatureAnnotation;

export type EditorHistory = {
  past: Annotation[][];
  present: Annotation[];
  future: Annotation[][];
};

export type PDFDocument = {
  url: string;
  name: string;
  totalPages: number;
  currentPage: number;
  scale: number;
};
