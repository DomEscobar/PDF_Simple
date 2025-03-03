
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PDFDocument } from '../../types';

const initialState: PDFDocument = {
  url: '',
  name: '',
  totalPages: 0,
  currentPage: 1,
  scale: 1.0,
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
    zoomIn: (state) => {
      state.scale = Math.min(state.scale + 0.1, 3.0);
    },
    zoomOut: (state) => {
      state.scale = Math.max(state.scale - 0.1, 0.5);
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
  zoomIn,
  zoomOut,
} = pdfSlice.actions;

export const pdfReducer = pdfSlice.reducer;
