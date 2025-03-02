
import React from 'react';

interface PDFLoadingStatesProps {
  url: string | null;
  isLoading: boolean;
  loadError: Error | null;
}

const PDFLoadingStates: React.FC<PDFLoadingStatesProps> = ({ url, isLoading, loadError }) => {
  // Default message when no PDF is loaded
  if (!url && !isLoading && !loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-2xl font-light text-muted-foreground animate-fade-in">
          No PDF document loaded
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Use the file picker above to select a PDF file
        </p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="animate-pulse text-xl font-light text-muted-foreground">
          Loading PDF...
        </div>
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-destructive">
        <div className="text-xl font-medium">Error loading PDF</div>
        <p className="text-sm mt-2">{loadError.message}</p>
      </div>
    );
  }

  // Return null if there's a URL and no loading or error states
  return null;
};

export default PDFLoadingStates;
