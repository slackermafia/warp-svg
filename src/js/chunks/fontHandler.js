import opentype from 'opentype.js';

const fontHandler = () => {
  let currentFont = null;

  const loadFontFromPath = async (fontPath) => {
    try {
      const font = await opentype.load(fontPath);
      currentFont = font;
      return font;
    } catch (error) {
      console.error('Error loading font:', error);
      throw error;
    }
  };

  const loadFontFromFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const font = opentype.parse(e.target.result);
          currentFont = font;
          resolve(font);
        } catch (error) {
          console.error('Error parsing font file:', error);
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read font file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const textToSVG = (text, options = {}) => {
    if (!currentFont) {
      throw new Error('No font loaded. Please load a font first.');
    }

    const fontSize = options.fontSize || 100;
    const kerning = options.kerning !== false;
    const features = options.features || {};
    const color = options.color || '#000000';

    try {
      // First, create the path with baseline at 0 to get actual dimensions
      const path = currentFont.getPath(text, 0, 0, fontSize, {
        kerning,
        features
      });

      const bbox = path.getBoundingBox();
      
      // If bbox is empty or invalid, return a fallback
      if (!bbox || bbox.x1 === bbox.x2 || bbox.y1 === bbox.y2) {
        return `<svg width="200" height="100" viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
  <text x="10" y="50" font-size="${fontSize}" font-family="serif">${text}</text>
</svg>`;
      }
      
      // Calculate dimensions with minimal padding
      const padding = Math.max(fontSize * 0.02, 2);
      const contentWidth = bbox.x2 - bbox.x1;
      const contentHeight = bbox.y2 - bbox.y1;
      const width = Math.ceil(contentWidth + padding * 2);
      const height = Math.ceil(contentHeight + padding * 2);
      
      // Calculate the offset needed to center the content
      const offsetX = -bbox.x1 + padding;
      const offsetY = -bbox.y1 + padding;
      
      // Create a new path with the centered positioning
      const centeredPath = currentFont.getPath(text, offsetX, offsetY, fontSize, {
        kerning,
        features
      });
      
      const pathData = centeredPath.toPathData();
      
      const svgString = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <path d="${pathData}" fill="${color}" />
</svg>`;

      return svgString;
    } catch (error) {
      console.error('Error converting text to SVG:', error);
      throw error;
    }
  };

  const getFontInfo = () => {
    if (!currentFont) return null;
    
    return {
      familyName: currentFont.names.fontFamily.en,
      styleName: currentFont.names.fontSubfamily?.en || 'Regular',
      fullName: currentFont.names.fullName?.en || 'Unknown',
      version: currentFont.names.version?.en || 'Unknown',
      unitsPerEm: currentFont.unitsPerEm,
      ascender: currentFont.ascender,
      descender: currentFont.descender
    };
  };

  const isLoaded = () => currentFont !== null;

  return {
    loadFontFromPath,
    loadFontFromFile,
    textToSVG,
    getFontInfo,
    isLoaded
  };
};

export default fontHandler;