
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

// Enable text layer interactivity for editing
export const enableTextLayerEditing = (containerRef: React.RefObject<HTMLDivElement>) => {
  if (!containerRef.current) return;

  // Enable the text container layers
  const textContainers = containerRef.current.querySelectorAll('.react-pdf__Page__textContent, .textLayer');
  textContainers.forEach((container) => {
    (container as HTMLElement).style.pointerEvents = 'auto';

    // Also enable all child elements inside these containers
    const childElements = container.querySelectorAll('*');
    childElements.forEach((child) => {
      (child as HTMLElement).style.pointerEvents = 'auto';
    });
  });

  // Additionally ensure all editable text elements are enabled
  const editableTexts = containerRef.current.querySelectorAll('.pdf-editable-text');
  editableTexts.forEach((text) => {
    (text as HTMLElement).style.pointerEvents = 'auto';
  });
};

// Disable text layer interactivity
export const disableTextLayerEditing = (containerRef: React.RefObject<HTMLDivElement>) => {
  if (!containerRef.current) return;

  // Disable the text container layers
  const textContainers = containerRef.current.querySelectorAll('.react-pdf__Page__textContent, .textLayer');
  textContainers.forEach((container) => {
    (container as HTMLElement).style.pointerEvents = 'none';

    // Also disable all child elements inside these containers
    const childElements = container.querySelectorAll('*');
    childElements.forEach((child) => {
      (child as HTMLElement).style.pointerEvents = 'none';
    });
  });

  // Additionally ensure all editable text elements are disabled
  const editableTexts = containerRef.current.querySelectorAll('.pdf-editable-text');
  editableTexts.forEach((text) => {
    (text as HTMLElement).style.pointerEvents = 'none';
  });
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

  if (element.getAttribute('data-editor-exists')) {
    return; // If it exists, do nothing
  }

  // Create a new div with the same dimensions and styling
  const editorDiv = document.createElement('div');
  editorDiv.style.backgroundColor = 'white';
  editorDiv.style.color = 'transparent'; // Use black text for better visibility
  editorDiv.style.position = 'absolute';
  editorDiv.style.outline = 'none';

  // Copy the computed styles and position of the original element
  const styles = window.getComputedStyle(element);
  editorDiv.style.width = element.clientWidth + 'px';
  editorDiv.style.minWidth = styles.minWidth;
  editorDiv.style.height = styles.height;
  editorDiv.style.left = styles.left;
  editorDiv.style.top = styles.top;
  // Add the editor div before the original element
  element.parentNode?.insertBefore(editorDiv, element);

  element.setAttribute('data-editor-exists', 'true');

};

// Handle blur on text element
export const handleTextBlur = (e: Event) => {
  const element = e.target as HTMLElement;
  element.classList.remove('pdf-text-editing');
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
