
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

// Current active text element being edited
let activeTextElement: HTMLElement | null = null;

// Handle focus on text element
export const handleTextFocus = (e: Event) => {
  const element = e.target as HTMLElement;
  element.classList.add('pdf-text-editing');
  
  // Set as active element
  activeTextElement = element;

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

  // Create and show the text editor toolbar
  createTextEditorToolbar(element);
};

// Handle blur on text element
export const handleTextBlur = (e: Event) => {
  const element = e.target as HTMLElement;
  element.classList.remove('pdf-text-editing');
  
  // If we're not clicking inside the toolbar, remove it
  setTimeout(() => {
    const relatedTarget = (e as FocusEvent).relatedTarget as HTMLElement | null;
    const toolbar = document.querySelector('.pdf-text-toolbar');
    
    if (relatedTarget && toolbar && toolbar.contains(relatedTarget)) {
      // Clicked inside toolbar, don't remove it
      return;
    }
    
    // Remove the toolbar if it exists
    removeTextEditorToolbar();
    activeTextElement = null;
  }, 100);
};

// Create text editor toolbar
const createTextEditorToolbar = (element: HTMLElement) => {
  // Remove any existing toolbar
  removeTextEditorToolbar();
  
  // Create toolbar container
  const toolbar = document.createElement('div');
  toolbar.className = 'pdf-text-toolbar';
  
  // Get element position for toolbar placement
  const rect = element.getBoundingClientRect();
  
  // Position toolbar above the element
  toolbar.style.position = 'absolute';
  toolbar.style.left = `${rect.left}px`;
  toolbar.style.top = `${rect.top - 40}px`;
  toolbar.style.zIndex = '1000';
  toolbar.style.backgroundColor = 'white';
  toolbar.style.borderRadius = '4px';
  toolbar.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
  toolbar.style.padding = '4px';
  toolbar.style.display = 'flex';
  toolbar.style.gap = '8px';
  
  // Font family selector
  const fontFamilySelect = document.createElement('select');
  fontFamilySelect.className = 'pdf-toolbar-select';
  fontFamilySelect.innerHTML = `
    <option value="sans-serif">Sans</option>
    <option value="serif">Serif</option>
    <option value="monospace">Mono</option>
    <option value="cursive">Cursive</option>
  `;
  fontFamilySelect.addEventListener('change', (e) => {
    if (activeTextElement) {
      activeTextElement.style.fontFamily = (e.target as HTMLSelectElement).value;
    }
  });
  
  // Font size selector
  const fontSizeSelect = document.createElement('select');
  fontSizeSelect.className = 'pdf-toolbar-select';
  fontSizeSelect.innerHTML = `
    <option value="9px">9px</option>
    <option value="10px">10px</option>
    <option value="11px">11px</option>
    <option value="12px">12px</option>
    <option value="14px">14px</option>
    <option value="16px">16px</option>
    <option value="18px">18px</option>
    <option value="20px">20px</option>
    <option value="24px">24px</option>
  `;
  fontSizeSelect.addEventListener('change', (e) => {
    if (activeTextElement) {
      activeTextElement.style.fontSize = (e.target as HTMLSelectElement).value;
    }
  });
  
  // Color picker
  const colors = ['#000000', '#1e88e5', '#43a047', '#e53935', '#fb8c00', '#8e24aa'];
  const colorContainer = document.createElement('div');
  colorContainer.style.display = 'flex';
  colorContainer.style.gap = '4px';
  
  colors.forEach(color => {
    const colorBtn = document.createElement('div');
    colorBtn.className = 'pdf-toolbar-color';
    colorBtn.style.width = '16px';
    colorBtn.style.height = '16px';
    colorBtn.style.borderRadius = '50%';
    colorBtn.style.backgroundColor = color;
    colorBtn.style.cursor = 'pointer';
    colorBtn.style.border = '1px solid #ddd';
    
    colorBtn.addEventListener('click', () => {
      if (activeTextElement) {
        activeTextElement.style.color = color;
      }
    });
    
    colorContainer.appendChild(colorBtn);
  });
  
  // Add all controls to toolbar
  toolbar.appendChild(document.createTextNode('Font:'));
  toolbar.appendChild(fontFamilySelect);
  toolbar.appendChild(document.createTextNode('Size:'));
  toolbar.appendChild(fontSizeSelect);
  toolbar.appendChild(document.createTextNode('Color:'));
  toolbar.appendChild(colorContainer);
  
  // Add the toolbar to the document
  document.body.appendChild(toolbar);
};

// Remove text editor toolbar
const removeTextEditorToolbar = () => {
  const existingToolbar = document.querySelector('.pdf-text-toolbar');
  if (existingToolbar) {
    existingToolbar.remove();
  }
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
    .pdf-toolbar-select {
      padding: 2px 4px;
      border: 1px solid #ddd;
      border-radius: 3px;
      font-size: 11px;
    }
    .pdf-text-toolbar {
      font-size: 12px;
      align-items: center;
    }
  `;

  // Add styles to document
  document.head.appendChild(styleElement);
};

