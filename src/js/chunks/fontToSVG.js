import fontHandler from './fontHandler';

const fontToSVG = (onSVGGenerated) => {
  const handler = fontHandler();
  
  // UI Elements
  const fontBlock = document.getElementById('font-block');
  const loadFontBtn = document.getElementById('load-font-btn');
  const loadFontInput = document.getElementById('load-font-input');
  const useSampleFontBtn = document.getElementById('use-sample-font-btn');
  const convertFontBtn = document.getElementById('convert-font-btn');
  const fontTextInput = document.getElementById('font-text-input');
  const fontSizeSlider = document.getElementById('font-size-slider');
  const fontSizeValue = document.getElementById('font-size-value');
  const fontColorPicker = document.getElementById('font-color-picker');
  const fontDetails = document.getElementById('font-details');

  // Font panel is now always visible - no toggle needed

  // Update font size display
  const updateFontSizeDisplay = () => {
    fontSizeValue.textContent = `${fontSizeSlider.value}px`;
  };

  // Update font info display
  const updateFontInfo = (fontInfo) => {
    if (fontInfo) {
      fontDetails.innerHTML = `
        <strong>${fontInfo.familyName}</strong> - ${fontInfo.styleName}<br>
        Version: ${fontInfo.version}
      `;
      document.getElementById('font-info').style.display = 'block';
    } else {
      document.getElementById('font-info').style.display = 'none';
    }
  };

  // Enable/disable convert button
  const updateConvertButton = () => {
    const hasFont = handler.isLoaded();
    const hasText = fontTextInput.value.trim().length > 0;
    convertFontBtn.disabled = !hasFont || !hasText;
  };

  // Load font from file
  const loadFontFromFile = async (file) => {
    try {
      convertFontBtn.textContent = 'Loading...';
      convertFontBtn.disabled = true;
      
      await handler.loadFontFromFile(file);
      const info = handler.getFontInfo();
      
      updateFontInfo(info);
      updateConvertButton();
      convertFontBtn.textContent = 'Convert to SVG';
      
      console.log('Font loaded successfully:', info);
    } catch (error) {
      console.error('Failed to load font:', error);
      alert('Failed to load font file. Please try a different font.');
      convertFontBtn.textContent = 'Convert to SVG';
      updateConvertButton();
    }
  };

  // Load sample font
  const loadSampleFont = async () => {
    try {
      convertFontBtn.textContent = 'Loading...';
      convertFontBtn.disabled = true;
      
      await handler.loadFontFromPath('./dist/Limelight-Regular.ttf');
      const info = handler.getFontInfo();
      
      updateFontInfo(info);
      updateConvertButton();
      convertFontBtn.textContent = 'Convert to SVG';
      
      console.log('Sample font loaded successfully:', info);
    } catch (error) {
      console.error('Failed to load sample font:', error);
      alert('Failed to load sample font. Please upload your own font file.');
      convertFontBtn.textContent = 'Convert to SVG';
      updateConvertButton();
    }
  };

  // Convert text to SVG
  const convertTextToSVG = () => {
    try {
      const text = fontTextInput.value.trim();
      const fontSize = parseInt(fontSizeSlider.value);
      const color = fontColorPicker.value;
      
      if (!text) {
        alert('Please enter some text to convert.');
        return;
      }
      
      if (!handler.isLoaded()) {
        alert('Please load a font first.');
        return;
      }
      
      const svgString = handler.textToSVG(text, { fontSize, color });
      
      // Call the callback with the generated SVG
      if (typeof onSVGGenerated === 'function') {
        onSVGGenerated(svgString);
      }
      
      // Font panel stays visible after conversion
      
    } catch (error) {
      console.error('Failed to convert text to SVG:', error);
      alert('Failed to convert text to SVG. Please try different text or font.');
    }
  };

  // Event Listeners
  loadFontBtn.addEventListener('click', () => {
    loadFontInput.click();
  });

  loadFontInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      loadFontFromFile(file);
    }
  });

  useSampleFontBtn.addEventListener('click', loadSampleFont);
  convertFontBtn.addEventListener('click', convertTextToSVG);
  
  fontTextInput.addEventListener('input', updateConvertButton);
  fontSizeSlider.addEventListener('input', updateFontSizeDisplay);
  
  // Add color change listener for real-time updates
  fontColorPicker.addEventListener('input', () => {
    // If we have a font loaded and text, auto-update the SVG with new color
    if (handler.isLoaded() && fontTextInput.value.trim()) {
      convertTextToSVG();
    }
  });
  
  // Initialize
  updateFontSizeDisplay();
  updateConvertButton();
  
  return {
    handler,
    loadSampleFont
  };
};

export default fontToSVG;