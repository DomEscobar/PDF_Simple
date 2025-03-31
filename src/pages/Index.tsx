
import React, { useCallback, useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import PDFViewer from '@/components/PDFViewer';
import Toolbar from '@/components/Toolbar';
import Sidebar from '@/components/Sidebar';
import { toast } from '@/components/ui/use-toast';

const PDFEditorApp: React.FC = () => {
  // Listen for keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl/Cmd + Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        store.dispatch({ type: 'annotation/undo' });
      }
      
      // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
      if ((e.ctrlKey || e.metaKey) && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault();
        store.dispatch({ type: 'annotation/redo' });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle file upload for images
  const handleFileChange = useCallback((file: File) => {
    if (!file) return;
    
    // Check if the file is an image
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file.',
        variant: 'destructive',
      });
      return;
    }
    
    // Create a URL for the image
    const imageUrl = URL.createObjectURL(file);
    
    // Get center position of the PDF viewer
    const pdfContainer = document.querySelector('.pdf-container');
    if (!pdfContainer) return;
    
    const rect = pdfContainer.getBoundingClientRect();
    const position = {
      x: rect.width / 2 - 100, // Center horizontally with a 100px offset
      y: rect.height / 2 - 100, // Center vertically with a 100px offset
    };
    
    // Create an image element to get the natural dimensions
    const img = new Image();
    img.onload = () => {
      // Calculate aspect ratio
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      
      // Set a max width of 200px
      const maxWidth = 200;
      const width = Math.min(img.naturalWidth, maxWidth);
      const height = width / aspectRatio;
      
      // Dispatch the action to create an image annotation
      // Get the current page number from the PDF viewer
      const currentPage = 1; // You may need to get this from the PDF viewer state
      
      store.dispatch({
        type: 'annotation/createImageAnnotation',
        payload: {
          position,
          size: { width, height },
          url: imageUrl,
          pageNumber: currentPage,
        },
      });
    };
    
    img.src = imageUrl;
  }, []);

  return (
    <div className="editor-wrapper">
      <Toolbar onFileChange={handleFileChange} />
      <PDFViewer />
    </div>
  );
};

const Index: React.FC = () => {
  return (
    <Provider store={store}>
      <div className="w-full h-screen flex flex-col overflow-hidden">
        <main className="flex-1 overflow-hidden flex">
          <div className="flex-1">
            <PDFEditorApp />
          </div>
          <Sidebar />
        </main>
      </div>
    </Provider>
  );
};

export default Index;
