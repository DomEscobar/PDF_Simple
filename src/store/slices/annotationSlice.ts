import { createSlice, PayloadAction, createAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { Position, Color, LineThickness, Annotation, EditorHistory, TextAnnotation, DrawingAnnotation, SignatureAnnotation, FontFamily, ImageAnnotation } from '@/types';

// Define the initial state
interface AnnotationState {
  activeTool: 'select' | 'text' | 'draw' | 'signature' | 'eraser';
  selectedAnnotationId: string | null;
  selectedColor: Color;
  lineThickness: LineThickness;
  isDrawing: boolean;
  currentPath: {
    points: Position[];
    color: Color;
    thickness: number;
  } | undefined;
  history: EditorHistory;
}

const initialState: AnnotationState = {
  activeTool: 'select',
  selectedAnnotationId: null,
  selectedColor: '#1e88e5', // Default blue color
  lineThickness: 'medium', // Default medium thickness
  isDrawing: false,
  currentPath: undefined,
  history: {
    past: [],
    present: [],
    future: [],
  },
};

// Action to set the active tool
export const setActiveTool = createAction<AnnotationState['activeTool']>('annotation/setActiveTool');

// Action to set the selected annotation
export const setSelectedAnnotationId = createAction<string | null>('annotation/setSelectedAnnotationId');

// Action to set the selected color
export const setSelectedColor = createAction<Color>('annotation/setSelectedColor');

// Action to set the line thickness
export const setLineThickness = createAction<LineThickness>('annotation/setLineThickness');

// Action to start drawing
export const setIsDrawing = createAction<boolean>('annotation/setIsDrawing');

// Action to add a point to the current drawing path
export const addPointToPath = createAction<Position>('annotation/addPointToPath');

// Action to finish drawing - now include pageNumber in payload
export const finishDrawing = createAction<number>('annotation/finishDrawing');

// Action to undo
export const undo = createAction('annotation/undo');

// Action to redo
export const redo = createAction('annotation/redo');

// Action to clear annotations
export const clearAnnotations = createAction('annotation/clearAnnotations');

// Action to update annotation
export const updateAnnotation = createAction<Annotation>('annotation/updateAnnotation');

// Action to delete annotation
export const deleteAnnotation = createAction<string>('annotation/deleteAnnotation');

// Action to create signature annotation - now include pageNumber in payload
export const createSignatureAnnotation = createAction<{
  position: Position;
  size: { width: number; height: number };
  path: Position[];
  pageNumber: number;
}>('annotation/createSignatureAnnotation');

// Action to create image annotation
export const createImageAnnotation = createAction<{
  position: Position;
  size: { width: number; height: number };
  url: string;
  pageNumber: number;
}>('annotation/createImageAnnotation');

// Fix the createTextAnnotation action to include pageNumber
export const createTextAnnotation = createAction<{
  position: Position;
  content?: string;
  pageNumber: number;
  fontFamily?: FontFamily;
}>('annotation/createTextAnnotation');

const annotationSlice = createSlice({
  name: 'annotation',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Handle active tool
      .addCase(setActiveTool, (state, action: PayloadAction<AnnotationState['activeTool']>) => {
        state.activeTool = action.payload;
      })
      // Handle selected annotation
      .addCase(setSelectedAnnotationId, (state, action: PayloadAction<string | null>) => {
        state.selectedAnnotationId = action.payload;
        
        // If selecting an annotation, automatically switch to select tool
        if (action.payload !== null) {
          state.activeTool = 'select';
        }
      })
      // Handle selected color
      .addCase(setSelectedColor, (state, action: PayloadAction<Color>) => {
        state.selectedColor = action.payload;
      })
      // Handle line thickness
      .addCase(setLineThickness, (state, action: PayloadAction<LineThickness>) => {
        state.lineThickness = action.payload;
      })
      // Handle drawing state
      .addCase(setIsDrawing, (state, action: PayloadAction<boolean>) => {
        state.isDrawing = action.payload;
        
        // Initialize current path if starting to draw
        if (action.payload && !state.currentPath) {
          state.currentPath = {
            points: [],
            color: state.selectedColor,
            thickness: state.lineThickness === 'thin' ? 2 : state.lineThickness === 'medium' ? 5 : 8,
          };
        }
      })
      // Handle adding a point to the current path
      .addCase(addPointToPath, (state, action: PayloadAction<Position>) => {
        if (!state.isDrawing) return;
        
        const { x, y } = action.payload;
        
        if (!state.currentPath) {
          // Start a new path
          state.currentPath = {
            points: [{ x, y }],
            color: state.selectedColor,
            thickness: state.lineThickness === 'thin' ? 2 : state.lineThickness === 'medium' ? 5 : 8,
          };
        } else {
          // Add to existing path
          state.currentPath.points.push({ x, y });
        }
      })
      // Handle finishing the drawing
      .addCase(finishDrawing, (state, action: PayloadAction<number>) => {
        if (!state.currentPath || state.currentPath.points.length < 2) {
          state.isDrawing = false;
          state.currentPath = undefined;
          return state;
        }
        
        // Use pageNumber from payload instead of store.getState()
        const pageNumber = action.payload;
        
        // Create new drawing annotation
        const newAnnotation: DrawingAnnotation = {
          id: uuidv4(),
          type: 'drawing',
          paths: [{ ...state.currentPath }],
          createdAt: Date.now(),
          pageNumber: pageNumber,
        };
        
        // Add to history
        const newHistory = [...state.history.present, newAnnotation];
        
        return {
          ...state,
          history: {
            past: [...state.history.past, state.history.present],
            present: newHistory,
            future: [],
          },
          currentPath: undefined,
          isDrawing: false,
        };
      })
      // Handle undo
      .addCase(undo, (state) => {
        if (state.history.past.length === 0) return;
        
        const previous = state.history.past[state.history.past.length - 1];
        const newPast = state.history.past.slice(0, state.history.past.length - 1);
        
        state.history = {
          past: newPast,
          present: previous,
          future: [state.history.present, ...state.history.future],
        };
      })
      // Handle redo
      .addCase(redo, (state) => {
        if (state.history.future.length === 0) return;
        
        const next = state.history.future[0];
        const newFuture = state.history.future.slice(1);
        
        state.history = {
          past: [...state.history.past, state.history.present],
          present: next,
          future: newFuture,
        };
      })
      // Handle clear annotations
      .addCase(clearAnnotations, (state) => {
        state.history = {
          past: [...state.history.past, state.history.present],
          present: [],
          future: [],
        };
      })
      // Handle update annotation
      .addCase(updateAnnotation, (state, action: PayloadAction<Annotation>) => {
        const updatedAnnotation = action.payload;
        
        // Find the index of the annotation to update
        const annotationIndex = state.history.present.findIndex(annotation => annotation.id === updatedAnnotation.id);
        
        if (annotationIndex === -1) return;
        
        // Create a new array with the updated annotation
        const newPresent = [...state.history.present];
        newPresent[annotationIndex] = updatedAnnotation;
        
        // Update the state
        state.history = {
          past: [...state.history.past, state.history.present],
          present: newPresent,
          future: [],
        };
      })
      // Handle delete annotation
      .addCase(deleteAnnotation, (state, action: PayloadAction<string>) => {
        const annotationId = action.payload;
        
        // Filter out the annotation to delete
        const newPresent = state.history.present.filter(annotation => annotation.id !== annotationId);
        
        // Update the state
        state.history = {
          past: [...state.history.past, state.history.present],
          present: newPresent,
          future: [],
        };
      })
      // Handle text annotation creation
      .addCase(createTextAnnotation, (state, action) => {
        // Get pageNumber from payload instead of store.getState()
        const { position, content = 'Text annotation', pageNumber, fontFamily = 'sans' } = action.payload;
        
        const newAnnotation: TextAnnotation = {
          id: uuidv4(),
          type: 'text',
          content,
          position,
          size: { width: 200, height: 100 },
          color: state.selectedColor,
          fontSize: 16,
          fontFamily,
          createdAt: Date.now(),
          pageNumber: pageNumber,
        };
        
        // Add to history
        const newPresent = [...state.history.present, newAnnotation];
        
        return {
          ...state,
          history: {
            past: [...state.history.past, state.history.present],
            present: newPresent,
            future: [],
          },
          selectedAnnotationId: newAnnotation.id,
          // Automatically switch to select tool after creating text annotation
          activeTool: 'select'
        };
      })
      
      // Handle signature annotation creation
      .addCase(createSignatureAnnotation, (state, action) => {
        // Get pageNumber from payload instead of store.getState()
        const { position, size, path, pageNumber } = action.payload;
        
        const newAnnotation: SignatureAnnotation = {
          id: uuidv4(),
          type: 'signature',
          position,
          size,
          path,
          createdAt: Date.now(),
          pageNumber: pageNumber,
        };
        
        // Add to history
        const newHistory = [...state.history.present, newAnnotation];
        return {
          ...state,
          history: {
            past: [...state.history.past, state.history.present],
            present: newHistory,
            future: [],
          },
          selectedAnnotationId: newAnnotation.id,
        };
      })
      
      // Handle image annotation creation
      .addCase(createImageAnnotation, (state, action) => {
        const { position, size, url, pageNumber } = action.payload;
        
        const newAnnotation: ImageAnnotation = {
          id: uuidv4(),
          type: 'image',
          url,
          position,
          size,
          createdAt: Date.now(),
          pageNumber: pageNumber,
        };
        
        // Add to history
        const newHistory = [...state.history.present, newAnnotation];
        return {
          ...state,
          history: {
            past: [...state.history.past, state.history.present],
            present: newHistory,
            future: [],
          },
          selectedAnnotationId: newAnnotation.id,
        };
      });
  },
});

export default annotationSlice.reducer;
