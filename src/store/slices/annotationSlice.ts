import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { 
  Annotation, 
  ToolType, 
  EditorHistory, 
  Color, 
  TextAnnotation, 
  DrawingAnnotation, 
  SignatureAnnotation, 
  LineThickness,
  Position, 
  Size 
} from '../../types';

type AnnotationState = {
  history: EditorHistory;
  activeTool: ToolType;
  selectedAnnotationId: string | null;
  selectedColor: Color;
  lineThickness: LineThickness;
  isDrawing: boolean;
};

const initialState: AnnotationState = {
  history: {
    past: [],
    present: [],
    future: [],
  },
  activeTool: 'select',
  selectedAnnotationId: null,
  selectedColor: '#1e88e5', // Default blue color
  lineThickness: 'medium',
  isDrawing: false,
};

// Helper function to get line thickness in pixels
export const getThicknessValue = (thickness: LineThickness): number => {
  switch (thickness) {
    case 'thin':
      return 2;
    case 'medium':
      return 4;
    case 'thick':
      return 6;
    default:
      return 4;
  }
};

const annotationSlice = createSlice({
  name: 'annotation',
  initialState,
  reducers: {
    setActiveTool: (state, action: PayloadAction<ToolType>) => {
      state.activeTool = action.payload;
      state.selectedAnnotationId = null;
    },
    setSelectedColor: (state, action: PayloadAction<Color>) => {
      state.selectedColor = action.payload;
    },
    setLineThickness: (state, action: PayloadAction<LineThickness>) => {
      state.lineThickness = action.payload;
    },
    setSelectedAnnotation: (state, action: PayloadAction<string | null>) => {
      state.selectedAnnotationId = action.payload;
    },
    setIsDrawing: (state, action: PayloadAction<boolean>) => {
      state.isDrawing = action.payload;
    },
    addAnnotation: (state, action: PayloadAction<Annotation>) => {
      // Save current state to past
      state.history.past.push([...state.history.present]);
      
      // Add new annotation to present
      state.history.present = [...state.history.present, action.payload];
      
      // Clear future since we've added a new annotation
      state.history.future = [];
    },
    updateAnnotation: (state, action: PayloadAction<Annotation>) => {
      // Save current state to past
      state.history.past.push([...state.history.present]);
      
      // Update the annotation
      state.history.present = state.history.present.map(ann => 
        ann.id === action.payload.id ? action.payload : ann
      );
      
      // Clear future
      state.history.future = [];
    },
    deleteAnnotation: (state, action: PayloadAction<string>) => {
      // Save current state to past
      state.history.past.push([...state.history.present]);
      
      // Remove the annotation
      state.history.present = state.history.present.filter(ann => ann.id !== action.payload);
      
      // Clear selection if deleting selected annotation
      if (state.selectedAnnotationId === action.payload) {
        state.selectedAnnotationId = null;
      }
      
      // Clear future
      state.history.future = [];
    },
    createTextAnnotation: (state, action: PayloadAction<{ 
      position: Position;
      size?: Size;
      content?: string;
    }>) => {
      // Save current state to past
      state.history.past.push([...state.history.present]);
      
      // Create new text annotation
      const newTextAnnotation: TextAnnotation = {
        id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'text',
        content: action.payload.content || 'Add text here',
        position: action.payload.position,
        size: action.payload.size || { width: 200, height: 100 },
        color: state.selectedColor,
        fontSize: 16,
        createdAt: Date.now(),
      };
      
      // Add to present
      state.history.present = [...state.history.present, newTextAnnotation];
      
      // Set as selected
      state.selectedAnnotationId = newTextAnnotation.id;
      
      // Clear future
      state.history.future = [];
    },
    updateTextAnnotation: (state, action: PayloadAction<{
      id: string;
      content?: string;
      position?: Position;
      size?: Size;
      color?: Color;
      fontSize?: number;
    }>) => {
      // Save current state to past if not already in editing mode
      if (state.selectedAnnotationId !== action.payload.id) {
        state.history.past.push([...state.history.present]);
      }
      
      // Update text annotation
      state.history.present = state.history.present.map(ann => {
        if (ann.id === action.payload.id && ann.type === 'text') {
          return {
            ...ann,
            ...(action.payload.content !== undefined && { content: action.payload.content }),
            ...(action.payload.position && { position: action.payload.position }),
            ...(action.payload.size && { size: action.payload.size }),
            ...(action.payload.color && { color: action.payload.color }),
            ...(action.payload.fontSize && { fontSize: action.payload.fontSize }),
          } as TextAnnotation;
        }
        return ann;
      });
      
      // Clear future
      state.history.future = [];
    },
    createSignatureAnnotation: (state, action: PayloadAction<{
      position: Position;
      size: Size;
      path: Position[];
    }>) => {
      // Save current state to past
      state.history.past.push([...state.history.present]);
      
      // Create signature annotation
      const newSignature: SignatureAnnotation = {
        id: `signature-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'signature',
        position: action.payload.position,
        size: action.payload.size,
        path: action.payload.path,
        createdAt: Date.now(),
      };
      
      // Add to present
      state.history.present = [...state.history.present, newSignature];
      
      // Set as selected
      state.selectedAnnotationId = newSignature.id;
      
      // Clear future
      state.history.future = [];
    },
    updateSignaturePosition: (state, action: PayloadAction<{
      id: string;
      position: Position;
    }>) => {
      // Save current state to past
      state.history.past.push([...state.history.present]);
      
      // Update signature position
      state.history.present = state.history.present.map(ann => {
        if (ann.id === action.payload.id && ann.type === 'signature') {
          return {
            ...ann,
            position: action.payload.position,
          } as SignatureAnnotation;
        }
        return ann;
      });
      
      // Clear future
      state.history.future = [];
    },
    createDrawingAnnotation: {
      reducer: (state, action: PayloadAction<string>) => {
        // Create drawing annotation
        const newDrawing: DrawingAnnotation = {
          id: action.payload,
          type: 'drawing',
          paths: [],
          createdAt: Date.now(),
        };
        
        // Add to present
        state.history.present = [...state.history.present, newDrawing];
        
        // Set as selected
        state.selectedAnnotationId = newDrawing.id;
      },
      prepare: (_?: any) => {
        const id = `drawing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        return { payload: id };
      }
    },
    addDrawingPath: (state, action: PayloadAction<{
      id: string;
      points: Position[];
      color: Color;
      thickness: number;
    }>) => {
      // Update drawing with new path
      state.history.present = state.history.present.map(ann => {
        if (ann.id === action.payload.id && ann.type === 'drawing') {
          return {
            ...ann,
            paths: [
              ...ann.paths,
              {
                points: action.payload.points,
                color: action.payload.color,
                thickness: action.payload.thickness,
              },
            ],
          } as DrawingAnnotation;
        }
        return ann;
      });
    },
    finalizeDrawing: (state, _: PayloadAction<any>) => {
      // If we're finalizing a drawing and it has paths, save to history
      const currentDrawing = state.history.present.find(
        ann => ann.id === state.selectedAnnotationId && ann.type === 'drawing'
      ) as DrawingAnnotation | undefined;
      
      if (currentDrawing && currentDrawing.paths.length > 0) {
        // Save this completed drawing as a history point
        state.history.past.push(state.history.present.filter(
          ann => ann.id !== currentDrawing.id
        ));
        
        // Clear future
        state.history.future = [];
      } else if (currentDrawing) {
        // If drawing has no paths, remove it
        state.history.present = state.history.present.filter(
          ann => ann.id !== currentDrawing.id
        );
      }
      
      // Clear selection
      state.selectedAnnotationId = null;
    },
    clearAnnotations: (state, _: PayloadAction<any>) => {
      // Save current state to past
      if (state.history.present.length > 0) {
        state.history.past.push([...state.history.present]);
      }
      
      // Clear present and selection
      state.history.present = [];
      state.selectedAnnotationId = null;
      
      // Clear future
      state.history.future = [];
    },
    undo: (state, _: PayloadAction<any>) => {
      if (state.history.past.length > 0) {
        // Move current state to future
        state.history.future.unshift([...state.history.present]);
        
        // Set present to the last item in past
        state.history.present = state.history.past.pop() || [];
        
        // Clear selection
        state.selectedAnnotationId = null;
      }
    },
    redo: (state, _: PayloadAction<any>) => {
      if (state.history.future.length > 0) {
        // Move current state to past
        state.history.past.push([...state.history.present]);
        
        // Set present to the first item in future
        state.history.present = state.history.future.shift() || [];
        
        // Clear selection
        state.selectedAnnotationId = null;
      }
    },
  },
});

export const {
  setActiveTool,
  setSelectedColor,
  setLineThickness,
  setSelectedAnnotation,
  setIsDrawing,
  addAnnotation,
  updateAnnotation,
  deleteAnnotation,
  undo,
  redo,
  createTextAnnotation,
  updateTextAnnotation,
  createSignatureAnnotation,
  updateSignaturePosition,
  createDrawingAnnotation,
  addDrawingPath,
  finalizeDrawing,
  clearAnnotations,
} = annotationSlice.actions;

export const annotationReducer = annotationSlice.reducer;
