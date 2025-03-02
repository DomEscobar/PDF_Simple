export type EditingOptions = {
  color: string;
  fontSize: number;
  fontStyle: string;
};

// Predefined color options for text editing
export const colorOptions = [
  { name: 'Black', value: '#000000' },
  { name: 'Blue', value: '#1e88e5' },
  { name: 'Green', value: '#43a047' },
  { name: 'Red', value: '#e53935' },
  { name: 'Orange', value: '#fb8c00' },
  { name: 'Purple', value: '#8e24aa' }
];

// Font size options
export const fontSizeOptions = [
  { name: 'Small', value: 0.8 },
  { name: 'Normal', value: 1 },
  { name: 'Large', value: 1.2 },
  { name: 'X-Large', value: 1.4 }
];

// Font style options
export const fontStyleOptions = [
  { name: 'Normal', value: 'normal' },
  { name: 'Bold', value: 'bold' },
  { name: 'Italic', value: 'italic' }
];

// Apply text styling to an element
export const applyTextStyle = (
  element: HTMLElement, 
  options: Partial<EditingOptions>
) => {
  if (options.color) {
    element.style.color = options.color;
  }
  
  if (options.fontSize) {
    // Get the original font size from data attribute or current style
    const originalSize = parseFloat(element.getAttribute('data-original-font-size') || '1');
    const newSize = originalSize * options.fontSize;
    element.style.fontSize = `${newSize}em`;
  }
  
  if (options.fontStyle) {
    if (options.fontStyle === 'bold') {
      element.style.fontWeight = 'bold';
      element.style.fontStyle = 'normal';
    } else if (options.fontStyle === 'italic') {
      element.style.fontStyle = 'italic';
      element.style.fontWeight = 'normal';
    } else {
      element.style.fontWeight = 'normal';
      element.style.fontStyle = 'normal';
    }
  }
};

// "Delete" text by making it white on white background
export const deleteText = (element: HTMLElement) => {
  element.style.color = '#FFFFFF';
  element.style.backgroundColor = '#FFFFFF';
  element.setAttribute('data-deleted', 'true');
  
  // Add a subtle border to show it's a deleted item when hovered
  element.style.border = '1px dashed rgba(0,0,0,0.1)';
  
  // Keep track of the original style for potential restoration
  if (!element.hasAttribute('data-original-color')) {
    element.setAttribute('data-original-color', element.style.color || '#000000');
  }
};

// Create and show the editing toolbar near an element
export const showEditingToolbar = (targetElement: HTMLElement) => {
  // Remove any existing toolbar first
  hideAllToolbars();
  
  // Create the toolbar container
  const toolbar = document.createElement('div');
  toolbar.className = 'pdf-text-editing-toolbar';
  document.body.appendChild(toolbar);
  
  // Get element position to place toolbar appropriately
  const rect = targetElement.getBoundingClientRect();
  
  // Position the toolbar above the element
  toolbar.style.left = `${rect.left}px`;
  toolbar.style.top = `${rect.top - toolbar.offsetHeight - 10}px`;
  
  // If toolbar would be off-screen at top, place it below the element
  if (rect.top < 50) {
    toolbar.style.top = `${rect.bottom + 10}px`;
  }
  
  // Create color picker
  addColorPicker(toolbar, targetElement);
  
  // Create font size picker
  addFontSizePicker(toolbar, targetElement);
  
  // Create font style picker
  addFontStylePicker(toolbar, targetElement);
  
  // Create delete button
  addDeleteButton(toolbar, targetElement);
  
  // Adjust position after adding all controls
  positionToolbar(toolbar, rect);
  
  // Make toolbar close when clicking outside
  document.addEventListener('click', closeToolbarOnClickOutside);
};

// Hide all toolbars in the document
export const hideAllToolbars = () => {
  const toolbars = document.querySelectorAll('.pdf-text-editing-toolbar');
  toolbars.forEach(toolbar => {
    document.body.removeChild(toolbar);
  });
  
  // Remove the global click listener
  document.removeEventListener('click', closeToolbarOnClickOutside);
};

// Event handler to close toolbar when clicking outside
const closeToolbarOnClickOutside = (e: MouseEvent) => {
  const toolbar = document.querySelector('.pdf-text-editing-toolbar');
  if (!toolbar) return;
  
  // Check if click is outside the toolbar
  if (e.target instanceof Node && !toolbar.contains(e.target)) {
    hideAllToolbars();
  }
};

// Add color picker to toolbar
const addColorPicker = (toolbar: HTMLElement, targetElement: HTMLElement) => {
  const colorSection = document.createElement('div');
  colorSection.className = 'toolbar-section';
  toolbar.appendChild(colorSection);
  
  colorOptions.forEach(color => {
    const colorBtn = document.createElement('button');
    colorBtn.className = 'color-btn';
    colorBtn.style.backgroundColor = color.value;
    colorBtn.title = color.name;
    
    colorBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      applyTextStyle(targetElement, { color: color.value });
    });
    
    colorSection.appendChild(colorBtn);
  });
};

// Add font size picker to toolbar
const addFontSizePicker = (toolbar: HTMLElement, targetElement: HTMLElement) => {
  const sizeSection = document.createElement('div');
  sizeSection.className = 'toolbar-section';
  toolbar.appendChild(sizeSection);
  
  fontSizeOptions.forEach(size => {
    const sizeBtn = document.createElement('button');
    sizeBtn.className = 'size-btn';
    sizeBtn.textContent = size.name;
    sizeBtn.title = `Font size: ${size.name}`;
    
    sizeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      applyTextStyle(targetElement, { fontSize: size.value });
    });
    
    sizeSection.appendChild(sizeBtn);
  });
};

// Add font style picker to toolbar
const addFontStylePicker = (toolbar: HTMLElement, targetElement: HTMLElement) => {
  const styleSection = document.createElement('div');
  styleSection.className = 'toolbar-section';
  toolbar.appendChild(styleSection);
  
  fontStyleOptions.forEach(style => {
    const styleBtn = document.createElement('button');
    styleBtn.className = 'style-btn';
    styleBtn.textContent = style.name[0]; // Just the first letter for compactness
    styleBtn.title = `Font style: ${style.name}`;
    
    if (style.value === 'bold') {
      styleBtn.style.fontWeight = 'bold';
    } else if (style.value === 'italic') {
      styleBtn.style.fontStyle = 'italic';
    }
    
    styleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      applyTextStyle(targetElement, { fontStyle: style.value });
    });
    
    styleSection.appendChild(styleBtn);
  });
};

// Add delete button to toolbar
const addDeleteButton = (toolbar: HTMLElement, targetElement: HTMLElement) => {
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-btn';
  deleteBtn.textContent = '🗑️';
  deleteBtn.title = 'Delete text';
  
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteText(targetElement);
    hideAllToolbars();
  });
  
  toolbar.appendChild(deleteBtn);
};

// Position the toolbar properly
const positionToolbar = (toolbar: HTMLElement, elementRect: DOMRect) => {
  // Ensure toolbar doesn't go offscreen
  const toolbarRect = toolbar.getBoundingClientRect();
  
  // Handle horizontal positioning
  if (toolbarRect.right > window.innerWidth) {
    toolbar.style.left = `${window.innerWidth - toolbarRect.width - 10}px`;
  } else if (toolbarRect.left < 0) {
    toolbar.style.left = '10px';
  }
  
  // If toolbar height is now known, adjust vertical position
  if (toolbarRect.top < 0) {
    toolbar.style.top = `${elementRect.bottom + 10}px`;
  }
};
