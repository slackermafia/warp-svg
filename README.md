# Warp SVG Online

![Repo Cover](https://raw.githubusercontent.com/PavelLaptev/warp-svg/master/src/images/web-preview.jpg)

## Overview

A powerful online tool that allows you to warp 🌀, bend, and distort SVG files and fonts using mesh transformations. This application is forked specifically for converting fonts into mesh-based warped effects, making it perfect for creative typography and graphic design projects.

## Font Mesh Transformation

This application excels at transforming font characters and text elements into dynamic warped shapes through mesh-based deformations. Perfect for:
- Creating artistic typography effects
- Designing warped text logos
- Generating unique font variations
- Producing creative text distortions for design projects

## How to Use

### [🎥 WARP SVG In action](https://pavellaptev.github.io/warp-svg/)

You can use Figma online tool to prepare your SVG file.

### [📖 Tutorial](https://www.figma.com/file/RqhYd0CaFD2f9dvz0m360Z/Warp-SVG-Online?node-id=1%3A2)

## Setup & Installation

### Prerequisites
- Node.js 22
- npm or yarn

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd warp-svg
   ```

2. **Install dependencies**
   ```bash
   npm install --cache=/tmp/npm-cache
   ```
   *Note: Using temporary cache to avoid permission issues*

3. **Start development server**
   ```bash
   npm run watch
   ```

4. **Access the application**
   - Local: http://localhost:3000
   - External: http://192.168.0.100:3000
   - UI Control Panel: http://localhost:3002

### Available Scripts

- `npm run build` - Build for development
- `npm run watch` - Development server with auto-reload and BrowserSync
- `npm run production` - Production build with optimizations
- `npm run lint-sass` - Lint SASS/SCSS files
- `npm run lint-js` - Lint JavaScript files

## Technical Details

### Dependencies Removed for Node.js 22 Compatibility
- ~~`fibers`~~ - Removed due to Node.js 22 incompatibility
- ~~`node-sass`~~ - Replaced with Dart Sass (already included)

### Built With
- **Webpack 4** - Module bundler
- **Dart Sass** - CSS preprocessor
- **GSAP** - Animation library
- **Warp.js** - Core warping functionality
- **BrowserSync** - Live reloading development server

## Browser Support
Modern browsers with SVG and Canvas support

## REFS
- Original project: [PavelLaptev/warp-svg](https://github.com/PavelLaptev/warp-svg)
- Warp code based on [Warp.js](https://github.com/benjamminf/warpjs)
