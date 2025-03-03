declare interface Window {
  html2canvas: (element: HTMLElement, options?: any) => Promise<HTMLCanvasElement>;
  jspdf: {
    jsPDF: new (options?: any) => any;
  };
} 