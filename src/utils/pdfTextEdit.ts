
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
  
  // Create a clone of the element with white background and white text
  const clone = element.cloneNode(true) as HTMLElement;
  clone.classList.add('pdf-text-clone');
  clone.style.backgroundColor = 'white';
  clone.style.color = 'black'; // Use black text for better visibility
  clone.style.position = 'absolute';
  clone.style.zIndex = '1000';
  
  // Copy the computed styles and position of the original element
  const styles = window.getComputedStyle(element);
  clone.style.width = styles.width;
  clone.style.height = styles.height;
  clone.style.left = styles.left;
  clone.style.top = styles.top;
  clone.style.fontSize = styles.fontSize;
  clone.style.fontFamily = styles.fontFamily;
  clone.style.transform = styles.transform;
  
  // Make the clone editable
  clone.setAttribute('contenteditable', 'true');
  
  // Add a reference to the original element
  clone.setAttribute('data-original-element-id', element.id || Date.now().toString());
  if (!element.id) {
    element.id = clone.getAttribute('data-original-element-id') || '';
  }
  
  // Add the clone before the original element
  element.parentNode?.insertBefore(clone, element);
  
  // Focus on the clone
  clone.focus();
  
  // Store original element reference on clone
  (clone as any).originalElement = element;
  
  // Add event listener to sync content from clone to original
  clone.addEventListener('input', () => {
    element.textContent = clone.textContent;
  });
  
  // Add blur event to the clone
  clone.addEventListener('blur', (event) => {
    // Remove the clone when it loses focus
    clone.parentNode?.removeChild(clone);
    // Update the original element with the clone's content
    element.textContent = clone.textContent;
    // Trigger the blur event on the original element
    handleTextBlur(new FocusEvent('blur', { relatedTarget: event.relatedTarget }));
  });
};

// Handle blur on text element
export const handleTextBlur = (e: Event) => {
  const element = e.target as HTMLElement;
  
  // If this is the clone, we don't need to do anything as the clone has its own blur handler
  if (element.classList.contains('pdf-text-clone')) {
    return;
  }
  
  element.classList.remove('pdf-text-editing');
  
  // If empty, restore original text
  if (!element.textContent?.trim()) {
    const originalText = element.getAttribute('data-original-text') || '';
    element.textContent = originalText;
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
    .pdf-text-clone {
      outline: 2px solid rgba(0, 120, 255, 0.7) !important;
      box-shadow: 0 0 8px rgba(0, 120, 255, 0.3);
    }
  `;
  
  // Add styles to document
  document.head.appendChild(styleElement);
};
