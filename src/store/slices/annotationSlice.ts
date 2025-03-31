
import { createSlice, PayloadAction, createAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { Position, Color, LineThickness, Annotation, EditorHistory, TextAnnotation, DrawingAnnotation, SignatureAnnotation, FontFamily, ImageAnnotation } from '@/types';

// Define the initial state
interface AnnotationState {
  activeTool: 'select' | 'text' | 'draw' | 'signature' | 'eraser' | 'image';
  selectedAnnotationId: string | null;
  color: Color; // Changed from selectedColor to color for consistency
  lineThickness: LineThickness;
  fontFamily: FontFamily; // Added fontFamily to state
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
  color: '#000000', // Default color
  lineThickness: 'thin', // Default medium thickness
  fontFamily: 'sans', // Default font family
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

// Action to set the color
export const setColor = createAction<Color>('annotation/setColor');

// Action to set the line thickness
export const setLineThickness = createAction<LineThickness>('annotation/setLineThickness');

// Action to set the font family
export const setFontFamily = createAction<FontFamily>('annotation/setFontFamily');

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
  fontSize?: number;
  color?: string;
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
      // Handle selected annotation - MODIFIED to not switch the tool
      .addCase(setSelectedAnnotationId, (state, action: PayloadAction<string | null>) => {
        state.selectedAnnotationId = action.payload;
        
        // We're no longer switching to select tool when an annotation is selected
        // This allows us to stay in text mode when working with text annotations
      })
      // Handle color
      .addCase(setColor, (state, action: PayloadAction<Color>) => {
        state.color = action.payload;
      })
      // Handle line thickness
      .addCase(setLineThickness, (state, action: PayloadAction<LineThickness>) => {
        state.lineThickness = action.payload;
      })
      // Handle font family
      .addCase(setFontFamily, (state, action: PayloadAction<FontFamily>) => {
        state.fontFamily = action.payload;
      })
      // Handle drawing state
      .addCase(setIsDrawing, (state, action: PayloadAction<boolean>) => {
        state.isDrawing = action.payload;
        
        // Initialize current path if starting to draw
        if (action.payload && !state.currentPath) {
          state.currentPath = {
            points: [],
            color: state.color,
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
            color: state.color,
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
      // Handle text annotation creation - MODIFIED to not switch the tool
      .addCase(createTextAnnotation, (state, action) => {
        const { 
          position, 
          content = '', 
          pageNumber, 
          fontFamily = state.fontFamily,
          fontSize = 11,
          color = state.color
        } = action.payload;
        
        const newAnnotation: TextAnnotation = {
          id: uuidv4(),
          type: 'text',
          content,
          position,
          size: { width: 150, height: 40 },
          color,
          fontSize,
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
          // We're not changing the activeTool here to stay in text mode
        };
      })
      
      // Handle signature annotation creation
      .addCase(createSignatureAnnotation, (state, action) => {
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
