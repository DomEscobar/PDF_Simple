
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

// Create text editing toolbar
const createTextToolbar = (element: HTMLElement) => {
  // Remove any existing toolbar
  removeTextToolbar();
  
  // Create toolbar container
  const toolbar = document.createElement('div');
  toolbar.className = 'text-edit-toolbar';
  toolbar.setAttribute('data-toolbar-for', element.getAttribute('data-toolbar-id') || '');
  
  // Get element position for toolbar placement
  const rect = element.getBoundingClientRect();
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  
  // Position toolbar above the element
  toolbar.style.position = 'absolute';
  toolbar.style.left = `${rect.left}px`;
  toolbar.style.top = `${rect.top + scrollTop - 40}px`; // 40px above the element
  toolbar.style.zIndex = '1000';

  // Font Size controls
  const fontSizeControl = document.createElement('div');
  fontSizeControl.className = 'toolbar-control';
  
  const decreaseFontBtn = document.createElement('button');
  decreaseFontBtn.className = 'toolbar-btn';
  decreaseFontBtn.textContent = 'A-';
  decreaseFontBtn.onclick = () => changeFontSize(element, -1);
  
  const increaseFontBtn = document.createElement('button');
  increaseFontBtn.className = 'toolbar-btn';
  increaseFontBtn.textContent = 'A+';
  increaseFontBtn.onclick = () => changeFontSize(element, 1);
  
  fontSizeControl.appendChild(decreaseFontBtn);
  fontSizeControl.appendChild(increaseFontBtn);
  
  // Color picker
  const colorControl = document.createElement('div');
  colorControl.className = 'toolbar-control';
  
  const colorPicker = document.createElement('input');
  colorPicker.type = 'color';
  colorPicker.value = window.getComputedStyle(element).color || '#000000';
  colorPicker.className = 'color-picker';
  colorPicker.onchange = (e) => changeTextColor(element, (e.target as HTMLInputElement).value);
  
  colorControl.appendChild(colorPicker);
  
  // Font family selector
  const fontFamilyControl = document.createElement('div');
  fontFamilyControl.className = 'toolbar-control';
  
  const fontSelect = document.createElement('select');
  fontSelect.className = 'font-select';
  
  const fonts = [
    { value: 'sans-serif', label: 'Sans' },
    { value: 'serif', label: 'Serif' },
    { value: 'monospace', label: 'Mono' },
    { value: 'cursive', label: 'Cursive' }
  ];
  
  fonts.forEach(font => {
    const option = document.createElement('option');
    option.value = font.value;
    option.textContent = font.label;
    fontSelect.appendChild(option);
  });
  
  fontSelect.onchange = (e) => changeFontFamily(element, (e.target as HTMLSelectElement).value);
  fontFamilyControl.appendChild(fontSelect);
  
  // Add all controls to toolbar
  toolbar.appendChild(fontSizeControl);
  toolbar.appendChild(colorControl);
  toolbar.appendChild(fontFamilyControl);
  
  // Add toolbar to document
  document.body.appendChild(toolbar);
  
  return toolbar;
};

// Remove toolbar
const removeTextToolbar = () => {
  const existingToolbar = document.querySelector('.text-edit-toolbar');
  if (existingToolbar) {
    existingToolbar.remove();
  }
};

// Font size change handler
const changeFontSize = (element: HTMLElement, delta: number) => {
  const currentSize = parseInt(window.getComputedStyle(element).fontSize) || 12;
  const newSize = Math.max(8, Math.min(72, currentSize + delta)); // Min 8px, Max 72px
  element.style.fontSize = `${newSize}px`;
};

// Text color change handler
const changeTextColor = (element: HTMLElement, color: string) => {
  element.style.color = color;
};

// Font family change handler
const changeFontFamily = (element: HTMLElement, fontFamily: string) => {
  element.style.fontFamily = fontFamily;
};

// Generate unique ID for elements
const generateUniqueId = () => {
  return `text-${Math.random().toString(36).substr(2, 9)}`;
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

  // Assign ID for toolbar reference if not exists
  if (!element.getAttribute('data-toolbar-id')) {
    element.setAttribute('data-toolbar-id', generateUniqueId());
  }
  
  // Create and show toolbar
  createTextToolbar(element);

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
  
  // Remove the toolbar after a short delay to allow clicking on toolbar buttons
  setTimeout(() => {
    // Check if focus is still within the editing environment before removing
    const activeToolbarId = document.querySelector('.text-edit-toolbar')?.getAttribute('data-toolbar-for');
    const activeElementId = element.getAttribute('data-toolbar-id');
    
    if (activeToolbarId !== activeElementId) {
      removeTextToolbar();
    }
  }, 200);
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
    .text-edit-toolbar {
      background-color: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      padding: 5px;
      display: flex;
      gap: 8px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }
    .toolbar-control {
      display: flex;
      align-items: center;
      gap: 2px;
    }
    .toolbar-btn {
      background-color: #fff;
      border: 1px solid #ced4da;
      border-radius: 3px;
      padding: 2px 5px;
      font-size: 12px;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    .toolbar-btn:hover {
      background-color: #e9ecef;
    }
    .color-picker {
      width: 20px;
      height: 20px;
      padding: 0;
      border: 1px solid #ced4da;
      border-radius: 3px;
      cursor: pointer;
    }
    .font-select {
      font-size: 12px;
      padding: 2px;
      border: 1px solid #ced4da;
      border-radius: 3px;
      background-color: #fff;
    }
  `;

  // Add styles to document
  document.head.appendChild(styleElement);
};

