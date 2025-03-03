
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PDFDocument } from '../../types';

const initialState: PDFDocument = {
  url: '',
  name: '',
  totalPages: 0,
  currentPage: 1,
  scale: 1.0,
  domScale: 1.0, // Add a new property for DOM-based scaling
};

const pdfSlice = createSlice({
  name: 'pdf',
  initialState,
  reducers: {
    loadPDF: (state, action: PayloadAction<{ url: string; name: string }>) => {
      state.url = action.payload.url;
      state.name = action.payload.name;
    },
    setTotalPages: (state, action: PayloadAction<number>) => {
      state.totalPages = action.payload;
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      if (action.payload >= 1 && action.payload <= state.totalPages) {
        state.currentPage = action.payload;
      }
    },
    nextPage: (state) => {
      if (state.currentPage < state.totalPages) {
        state.currentPage += 1;
      }
    },
    previousPage: (state) => {
      if (state.currentPage > 1) {
        state.currentPage -= 1;
      }
    },
    setScale: (state, action: PayloadAction<number>) => {
      state.scale = action.payload;
    },
    setDomScale: (state, action: PayloadAction<number>) => {
      state.domScale = action.payload;
    },
    zoomIn: (state) => {
      state.scale = Math.min(state.scale + 0.1, 3.0);
    },
    zoomOut: (state) => {
      state.scale = Math.max(state.scale - 0.1, 0.5);
    },
    zoomInDom: (state) => {
      state.domScale = Math.min(state.domScale + 0.1, 3.0);
    },
    zoomOutDom: (state) => {
      state.domScale = Math.max(state.domScale - 0.1, 0.5);
    },
  },
});

export const {
  loadPDF,
  setTotalPages,
  setCurrentPage,
  nextPage,
  previousPage,
  setScale,
  setDomScale,
  zoomIn,
  zoomOut,
  zoomInDom,
  zoomOutDom,
} = pdfSlice.actions;

export const pdfReducer = pdfSlice.reducer;
