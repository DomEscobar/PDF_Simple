
import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import PDFViewer from '@/components/PDFViewer';
import Toolbar from '@/components/Toolbar';
import Sidebar from '@/components/Sidebar';

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
    <div className="editor-wrapper">
      <Toolbar />
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
