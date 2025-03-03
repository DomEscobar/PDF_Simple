
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
  
  // Add click handler to close toolbar when clicking outside
  setTimeout(() => {
    document.addEventListener('click', handleDocumentClick);
  }, 100);
  
  return toolbar;
};

// Handle document clicks to hide toolbar when clicking outside
const handleDocumentClick = (e: MouseEvent) => {
  const toolbar = document.querySelector('.text-edit-toolbar');
  if (!toolbar) return;
  
  const target = e.target as HTMLElement;
  
  // Check if click is outside toolbar and not on an active editing element
  const isClickOnToolbar = toolbar.contains(target);
  const isClickOnEditingElement = target.classList.contains('pdf-text-editing') || 
                                  target.closest('.pdf-text-editing');
  
  if (!isClickOnToolbar && !isClickOnEditingElement) {
    removeTextToolbar();
    
    // Remove the document click handler
    document.removeEventListener('click', handleDocumentClick);
    
    // Remove editing class from all text elements
    const editingElements = document.querySelectorAll('.pdf-text-editing');
    editingElements.forEach(el => {
      el.classList.remove('pdf-text-editing');
      (el as HTMLElement).blur();
    });
  }
};

// Remove toolbar
const removeTextToolbar = () => {
  const existingToolbar = document.querySelector('.text-edit-toolbar');
  if (existingToolbar) {
    existingToolbar.remove();
  }
  
  // Also remove the document click handler
  document.removeEventListener('click', handleDocumentClick);
};

// Font size change handler
const changeFontSize = (element: HTMLElement, delta: number) => {
  const currentSize = parseInt(window.getComputedStyle(element).fontSize) || 12;
  const newSize = Math.max(8, Math.min(72, currentSize + delta)); // Min 8px, Max 72px
  element.style.fontSize = `${newSize}px !important`;
  element.setAttribute('style', element.getAttribute('style') + ' font-size: ' + newSize + 'px !important;');
};

// Text color change handler
const changeTextColor = (element: HTMLElement, color: string) => {
  element.style.color = `${color} !important`;
  element.setAttribute('style', element.getAttribute('style') + ' color: ' + color + ' !important;');
};

// Font family change handler
const changeFontFamily = (element: HTMLElement, fontFamily: string) => {
  element.style.fontFamily = `${fontFamily} !important`;
  element.setAttribute('style', element.getAttribute('style') + ' font-family: ' + fontFamily + ' !important;');
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
  element.style.color = 'black !important';
  element.style.backgroundColor = 'white !important';
  element.setAttribute('style', element.getAttribute('style') + ' color: black !important; background-color: white !important;');

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
  
  // Don't immediately remove the toolbar to allow clicking on toolbar buttons
  // The toolbar will be removed by document click handler if clicking outside
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
      cursor: text !important;
      transition: background-color 0.2s linear !important;
      border-radius: 2px !important;
      padding: 1px !important;
    }
    .pdf-editable-text:hover {
      background-color: rgba(255, 255, 0, 0.2) !important;
      outline: 1px dashed rgba(0, 0, 0, 0.3) !important;
    }
    .pdf-text-editing {
      background-color: rgba(255, 255, 255, 0.9) !important;
      outline: 2px solid rgba(0, 120, 255, 0.7) !important;
      box-shadow: 0 0 8px rgba(0, 120, 255, 0.3) !important;
    }
    .text-edit-toolbar {
      background-color: #f8f9fa !important;
      border: 1px solid #dee2e6 !important;
      border-radius: 4px !important;
      padding: 5px !important;
      display: flex !important;
      gap: 8px !important;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2) !important;
    }
    .toolbar-control {
      display: flex !important;
      align-items: center !important;
      gap: 2px !important;
    }
    .toolbar-btn {
      background-color: #fff !important;
      border: 1px solid #ced4da !important;
      border-radius: 3px !important;
      padding: 2px 5px !important;
      font-size: 12px !important;
      cursor: pointer !important;
      transition: background-color 0.2s !important;
    }
    .toolbar-btn:hover {
      background-color: #e9ecef !important;
    }
    .color-picker {
      width: 20px !important;
      height: 20px !important;
      padding: 0 !important;
      border: 1px solid #ced4da !important;
      border-radius: 3px !important;
      cursor: pointer !important;
    }
    .font-select {
      font-size: 12px !important;
      padding: 2px !important;
      border: 1px solid #ced4da !important;
      border-radius: 3px !important;
      background-color: #fff !important;
    }
  `;

  // Add styles to document
  document.head.appendChild(styleElement);
};
