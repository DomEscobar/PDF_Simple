
// Type definitions for jspdf
declare namespace window {
  const jspdf: {
    jsPDF: new (options?: any) => {
      addImage: (imageData: string, format: string, x: number, y: number, width: number, height: number) => void;
      save: (filename: string) => void;
    };
  };
}
