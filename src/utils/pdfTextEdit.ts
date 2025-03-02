/**
 * Utility functions for making PDF text elements editable
 */
import { toast } from 'sonner';

// Function to make text elements editable
export const makeTextElementsEditable = (containerRef: React.RefObject<HTMLDivElement>) => {
  if (!containerRef.current) return;

  // Find all text span elements in the PDF
  const textElements = containerRef.current.querySelectorAll('.textLayer span');

  textElements.forEach((element) => {
    // Make each text element editable
    element.setAttribute('contenteditable', 'true');
    
    // Add styling for better UX
    element.classList.add('pdf-editable-text');
    
    // Add focus and blur event handlers
    element.addEventListener('focus', handleTextFocus);
    element.addEventListener('blur', handleTextBlur);
  });

  // Add more CSS for the editable text
  addEditableTextStyles();
};

// Handle focus on text element
export const handleTextFocus = (e: Event) => {
  const element = e.target as HTMLElement;
  element.classList.add('pdf-text-editing');
  
  // Save original text for potential restoration
  element.setAttribute('data-original-text', element.textContent || '');
  
  // Fix visibility issue by setting text color to black
  element.style.color = 'black';
  element.style.backgroundColor = 'white';
  
  // Store original styles for restoration on blur
  const originalColor = window.getComputedStyle(element).color;
  const originalBg = window.getComputedStyle(element).backgroundColor;
  element.setAttribute('data-original-color', originalColor);
  element.setAttribute('data-original-bg', originalBg);


   // Create a new div with the same dimensions and styling
  const editorDiv = document.createElement('div');
  editorDiv.style.backgroundColor = 'white';
  editorDiv.style.color = 'transparent'; // Use black text for better visibility
  editorDiv.style.position = 'absolute';
  editorDiv.style.outline = 'none';

  // Copy the computed styles and position of the original element
  const styles = window.getComputedStyle(element);
  editorDiv.style.width = styles.width;
  editorDiv.style.height = styles.height;
  editorDiv.style.left = styles.left;
  editorDiv.style.top = styles.top;
  // Add the editor div before the original element
  element.parentNode?.insertBefore(editorDiv, element);

};

// Handle blur on text element
export const handleTextBlur = (e: Event) => {
  const element = e.target as HTMLElement;
  element.classList.remove('pdf-text-editing');
  
  // If empty, restore original text
  if (!element.textContent?.trim()) {
    const originalText = element.getAttribute('data-original-text') || '';
    element.textContent = originalText;
  }
  
  // Restore original styles if we're not explicitly keeping the changes
  // (in this case, we're keeping the changes to maintain visibility)
  const keepChanges = true; // Set this to false if you want to restore original styles
  
  if (!keepChanges) {
    const originalColor = element.getAttribute('data-original-color') || '';
    const originalBg = element.getAttribute('data-original-bg') || '';
    element.style.color = originalColor;
    element.style.backgroundColor = originalBg;
  }
  
  toast.success('Text updated');
};

// Add styles for editable text
export const addEditableTextStyles = () => {
  // Check if styles already exist
  if (document.getElementById('pdf-editable-styles')) return;
  
  // Create style element
  const styleElement = document.createElement('style');
  styleElement.id = 'pdf-editable-styles';
  
  // Define styles
  styleElement.textContent = `
    .pdf-editable-text {
      cursor: text;
      transition: background-color 0.2s linear;
      border-radius: 2px;
      padding: 1px;
    }
    .pdf-editable-text:hover {
      background-color: rgba(255, 255, 0, 0.2);
      outline: 1px dashed rgba(0, 0, 0, 0.3);
    }
    .pdf-text-editing {
      background-color: rgba(255, 255, 255, 0.9) !important;
      outline: 2px solid rgba(0, 120, 255, 0.7) !important;
      box-shadow: 0 0 8px rgba(0, 120, 255, 0.3);
    }
  `;
  
  // Add styles to document
  document.head.appendChild(styleElement);
};
