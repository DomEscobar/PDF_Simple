
import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import PDFViewer from '@/components/PDFViewer';
import Toolbar from '@/components/Toolbar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import PDFSidebar from '@/components/PDFSidebar';

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

  return (
    <div className="editor-wrapper w-full">
      <Toolbar />
      <div className="flex-1 overflow-hidden">
        <PDFViewer />
      </div>
    </div>
  );
};

const Index: React.FC = () => {
  return (
    <Provider store={store}>
      <SidebarProvider defaultOpen={false}>
        <div className="w-full h-screen flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden flex w-full">
            <PDFSidebar />
            <SidebarInset className="flex flex-col">
              <div className="absolute top-2 left-2 z-10">
                <SidebarTrigger className="bg-white/80 backdrop-blur-sm shadow-md" />
              </div>
              <PDFEditorApp />
            </SidebarInset>
          </div>
        </div>
      </SidebarProvider>
    </Provider>
  );
};

export default Index;
