/* eslint-disable quotes */
import "../scss/styles.scss";
import Warp from "warpjs";
import gsap from "gsap";
import Draggable from "gsap/Draggable";

import dropZone from "./chunks/dropzone";
import generateMeshPoints from "./chunks/generateMeshPoints";
import saveResult from "./chunks/saveResults";
import moveCanvas from "./chunks/moveCanvas";
import toggleControls from "./chunks/toggleControls";
import changeTheme from "./chunks/changeTheme";
import iterpritateSmoothness from "./chunks/iterpritateSmoothness";
import loader from "./chunks/loader";
import fontToSVG from "./chunks/fontToSVG";

import { testSVG } from "./chunks/svg-test-string";

/// /////////////////////////////////////////////////////////////////
/// /////////// Register GSAP Draggable and Loader //////////////////
/// /////////////////////////////////////////////////////////////////
loader();
gsap.registerPlugin(Draggable);

/// /////////////////////////////////////////////////////////////////
/// ///////////////////// Initial Variables /////////////////////////
/// /////////////////////////////////////////////////////////////////
let svgString = testSVG;
let zoom = 1;
const draggableControlPonts = [];
let currentControlPoints = null; // Store current control points to preserve during settings changes

const app = document.getElementById("app");
const svgContainer = document.getElementById("svg-container");
const svgElement = document.getElementById("svg-element");
const svgControl = document.getElementById("svg-control");
const zoomElement = document.getElementById("scale-wrap");

const actions = {
  meshComplexity: document.getElementById("mesh-complexity"),
  meshInterpolation: document.getElementById("interpolation-complexity"),
  showOriginalBox: document.getElementById("show-original-box-btn"),
};

let width = svgContainer.clientWidth;
let height = svgContainer.clientHeight;
let complexityLevel = actions.meshComplexity.value;
let interpolationLevel = iterpritateSmoothness(actions.meshInterpolation.value);

/// /////////////////////////////////////////////////////////////////
/// ///////////////////// Parse SVG String //////////////////////////
/// /////////////////////////////////////////////////////////////////
function parseSVGString(svgString) {
  const svgDOM = new DOMParser()
    .parseFromString(svgString, "image/svg+xml")
    .getElementsByTagName("svg")[0];

  const parsedSVGWidth = svgDOM.attributes.width
    ? Number(svgDOM.attributes.width.value.replace(/^.*?(\d+).*/, "$1"))
    : 500;
  const parsedSVGheight = svgDOM.attributes.height
    ? Number(svgDOM.attributes.height.value.replace(/^.*?(\d+).*/, "$1"))
    : 500;

  height = Math.round(parsedSVGheight);
  width = Math.round(parsedSVGWidth);
  svgContainer.style.height = `${Math.round(height)}px`;
  svgContainer.style.width = `${Math.round(width)}px`;

  svgDOM.attributes.viewBox
    ? svgElement.setAttribute("viewBox", svgDOM.attributes.viewBox.value)
    : false;
  svgDOM.attributes.fill
    ? svgElement.setAttribute("fill", svgDOM.attributes.fill.value)
    : svgElement.setAttribute("fill", "inherit");

  svgElement.setAttribute("preserveAspectRatio", "xMidYMin meet");
  svgElement.innerHTML = svgDOM.innerHTML.toString();
}

/// /////////////////////////////////////////////////////////////////
/// ///////////////////// Initial function //////////////////////////
/// /////////////////////////////////////////////////////////////////
function init(firstInit = false, preserveControlPoints = false) {
  const controlPath = document.getElementById("control-path");
  parseSVGString(svgString);
  zoomElement.style.transform = "scale(1)";
  zoom = 1;

  // Need to interpolate first, so angles remain sharp
  const warp = new Warp(svgElement);
  warp.interpolate(interpolationLevel);

  // Start with a rectangle, then distort it later
  let controlPoints;
  
  if (preserveControlPoints && currentControlPoints && currentControlPoints.length > 0) {
    // Use existing control points if preserving
    controlPoints = [...currentControlPoints];
  } else {
    // Generate new control points
    controlPoints = generateMeshPoints(
      width,
      height,
      Number(complexityLevel)
    );
  }

  // Compute weights from control points
  warp.transform(function (v0, V = controlPoints) {
    const A = [];
    const W = [];
    const L = [];

    // Find angles
    for (let i = 0; i < V.length; i++) {
      const j = (i + 1) % V.length;

      const vi = V[i];
      const vj = V[j];

      const r0i = Math.sqrt((v0[0] - vi[0]) ** 2 + (v0[1] - vi[1]) ** 2);
      const r0j = Math.sqrt((v0[0] - vj[0]) ** 2 + (v0[1] - vj[1]) ** 2);
      const rij = Math.sqrt((vi[0] - vj[0]) ** 2 + (vi[1] - vj[1]) ** 2);

      const dn = 2 * r0i * r0j;
      const r = (r0i ** 2 + r0j ** 2 - rij ** 2) / dn;

      A[i] = isNaN(r) ? 0 : Math.acos(Math.max(-1, Math.min(r, 1)));
    }

    // Find weights
    for (let j = 0; j < V.length; j++) {
      const i = (j > 0 ? j : V.length) - 1;

      // const vi = V[i];
      const vj = V[j];

      const r = Math.sqrt((vj[0] - v0[0]) ** 2 + (vj[1] - v0[1]) ** 2);

      W[j] = (Math.tan(A[i] / 2) + Math.tan(A[j] / 2)) / r;
    }

    // Normalise weights
    const Ws = W.reduce((a, b) => a + b, 0);
    for (let i = 0; i < V.length; i++) {
      L[i] = W[i] / Ws;
    }

    // Save weights to the point for use when transforming
    return [...v0, ...L];
  });

  // Warp function
  function reposition([x, y, ...W], V = controlPoints) {
    let nx = 0;
    let ny = 0;

    // Recreate the points using mean value coordinates
    for (let i = 0; i < V.length; i++) {
      nx += W[i] * V[i][0];
      ny += W[i] * V[i][1];
    }

    return [nx, ny, ...W];
  }

  // Draw control shape
  function drawControlShape(element = controlPath, V = controlPoints) {
    const path = [`M${V[0][0]} ${V[0][1]}`];

    for (let i = 1; i < V.length; i++) {
      path.push(`L${V[i][0]} ${V[i][1]}`);
    }

    path.push("Z");
    element.setAttribute("d", path.join(""));
  }

  // Draw control point
  function drawPoint(element, pos = { x: 0, y: 0 }, index) {
    const point = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    point.setAttributeNS(null, "class", "control-point");
    point.setAttributeNS(null, "cx", pos.x);
    point.setAttributeNS(null, "cy", pos.y);
    point.setAttributeNS(null, "r", 6);
    element.appendChild(point);

    draggableControlPonts.push(point);

    Draggable.create(point, {
      type: "x,y",
      onDrag: function () {
        let relativeX =
          (this.pointerX - svgControl.getBoundingClientRect().left) / zoom;
        let relativeY =
          (this.pointerY - svgControl.getBoundingClientRect().top) / zoom;

        // Snapping logic - snap to other points if within threshold
        const snapThreshold = 10 / zoom; // Adjust snap sensitivity
        
        for (let i = 0; i < controlPoints.length; i++) {
          if (i !== index) { // Don't snap to self
            const otherPoint = controlPoints[i];
            
            // Horizontal snapping
            if (Math.abs(relativeX - otherPoint[0]) < snapThreshold) {
              relativeX = otherPoint[0];
            }
            
            // Vertical snapping
            if (Math.abs(relativeY - otherPoint[1]) < snapThreshold) {
              relativeY = otherPoint[1];
            }
          }
        }

        controlPoints[index] = [relativeX, relativeY];
        currentControlPoints = [...controlPoints]; // Store current state
        drawControlShape();
        warp.transform(reposition);
      },
    });
  }

  // Place control points
  function drawControlPoints(element = svgControl, V = controlPoints) {
    V.map((i, index) => {
      drawPoint(element, { x: i[0], y: i[1] }, index);
      return null;
    });
  }

  // if this is the first launch
  if (firstInit) {
    controlPoints = [
      [0, 0],
      [0, 100],
      [0, 200],
      [0, 300],
      [100, 300],
      [200, 300],
      [300, 300],
      [300, 200],
      [300, 100],
      [300, 0],
      [200, 0],
      [100, 0],
    ];
  }
  drawControlShape();
  drawControlPoints();
  warp.transform(reposition);
  
  // Store current control points for preservation
  currentControlPoints = [...controlPoints];
}

/// //////
const createNewControlPath = () => {
  svgControl.innerHTML = "";
  const newControlPath = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  newControlPath.setAttributeNS(null, "id", "control-path");
  svgControl.appendChild(newControlPath);
};

/// Update smoothness without recreating mesh
const updateSmoothness = () => {
  if (!currentControlPoints || currentControlPoints.length === 0) {
    // If no control points exist, do full init
    init();
    return;
  }

  // Only re-interpolate the SVG without changing control points
  const warp = new Warp(svgElement);
  warp.interpolate(interpolationLevel);
  
  // Use existing control points
  const controlPoints = [...currentControlPoints];
  
  // Compute weights from existing control points
  warp.transform(function (v0, V = controlPoints) {
    const A = [];
    const W = [];
    const L = [];

    // Find angles
    for (let i = 0; i < V.length; i++) {
      const j = (i + 1) % V.length;

      const vi = V[i];
      const vj = V[j];

      const r0i = Math.sqrt((v0[0] - vi[0]) ** 2 + (v0[1] - vi[1]) ** 2);
      const r0j = Math.sqrt((v0[0] - vj[0]) ** 2 + (v0[1] - vj[1]) ** 2);
      const rij = Math.sqrt((vi[0] - vj[0]) ** 2 + (vi[1] - vj[1]) ** 2);

      const dn = 2 * r0i * r0j;
      const r = (r0i ** 2 + r0j ** 2 - rij ** 2) / dn;

      A[i] = isNaN(r) ? 0 : Math.acos(Math.max(-1, Math.min(r, 1)));
    }

    // Find weights
    for (let j = 0; j < V.length; j++) {
      const i = (j > 0 ? j : V.length) - 1;

      const vj = V[j];

      const r = Math.sqrt((vj[0] - v0[0]) ** 2 + (vj[1] - v0[1]) ** 2);

      W[j] = (Math.tan(A[i] / 2) + Math.tan(A[j] / 2)) / r;
    }

    // Normalise weights
    const Ws = W.reduce((a, b) => a + b, 0);
    for (let i = 0; i < V.length; i++) {
      L[i] = W[i] / Ws;
    }

    // Save weights to the point for use when transforming
    return [...v0, ...L];
  });

  // Warp function
  function reposition([x, y, ...W], V = controlPoints) {
    let nx = 0;
    let ny = 0;

    // Recreate the points using mean value coordinates
    for (let i = 0; i < V.length; i++) {
      nx += W[i] * V[i][0];
      ny += W[i] * V[i][1];
    }

    return [nx, ny, ...W];
  }

  // Apply the warp with existing control points
  warp.transform(reposition);
};

/// //////
dropZone((result) => {
  svgString = result;
  createNewControlPath();
  init();
});

/// ////
document.addEventListener("wheel", function (e) {
  const controlPath = document.getElementById("control-path");
  if (e.deltaY > 0) {
    zoomElement.style.transform = `scale(${(zoom += 0.02)})`;
    controlPath.style.strokeWidth = `${1 / zoom}px`;
    // console.log(svgControl.querySelectorAll('circle'));
  } else if (zoomElement.getBoundingClientRect().width >= 30) {
    zoomElement.style.transform = `scale(${(zoom -= 0.02)})`;
    controlPath.style.strokeWidth = `${1 / zoom}px`;
  }
  draggableControlPonts.map((i) => {
    if (i.getBoundingClientRect().height > 6) {
      i.setAttribute("r", 6 / zoom);
    }
  });
});

/// //////
actions.meshComplexity.addEventListener(
  "change",
  (e) => {
    const newComplexity = e.target.value;
    const oldComplexity = complexityLevel;
    
    // Check if we actually need to change the mesh structure
    const oldPoints = generateMeshPoints(width, height, Number(oldComplexity)).length;
    const newPoints = generateMeshPoints(width, height, Number(newComplexity)).length;
    
    complexityLevel = newComplexity;
    
    // If the number of points is the same, just update without recreating
    if (oldPoints === newPoints && currentControlPoints && currentControlPoints.length > 0) {
      updateSmoothness(); // Just reapply current warp
    } else {
      // Different number of points required - need to recreate mesh
      createNewControlPath();
      init(false, false);
    }
  },
  false
);

/// /////
actions.showOriginalBox.addEventListener(
  "change",
  () => {
    svgControl.classList.toggle("show");
    app.classList.toggle("checkerboard-pattern");
  },
  false
);

// /////
actions.meshInterpolation.addEventListener(
  "change",
  (e) => {
    interpolationLevel = iterpritateSmoothness(e.target.value);
    // For smoothness changes, we only need to re-interpolate, not recreate the mesh
    updateSmoothness();
  },
  false
);

// Initialize font to SVG functionality
const fontToSVGHandler = fontToSVG((newSvgString) => {
  // This callback is called when a new SVG is generated from font
  // Update the main SVG string and reinitialize the warp
  svgString = newSvgString;
  createNewControlPath();
  init();
});

// Initial calling
changeTheme();
moveCanvas(svgContainer);
saveResult(document.getElementById("save-result-btn"), svgElement);
toggleControls();
init(true);
console.log(`
             ▄              ▄
           ▌▒█           ▄▀▒▌
           ▌▒▒█        ▄▀▒▒▒▐
           ▐▄▀▒▒▀▀▀▀▄▄▄▀▒▒▒▒▒▐
        ▄▄▀▒░▒▒▒▒▒▒▒▒▒█▒▒▄█▒▐
      ▄▀▒▒▒░░░▒▒▒░░░▒▒▒▀██▀▒▌
     ▐▒▒▒▄▄▒▒▒▒░░░▒▒▒▒▒▒▒▀▄▒▒▌
     ▌░░▌█▀▒▒▒▒▒▄▀█▄▒▒▒▒▒▒▒█▒▐
    ▐░░░▒▒▒▒▒▒▒▒▌██▀▒▒░░░▒▒▒▀▄▌
    ▌░▒▄██▄▒▒▒▒▒▒▒▒▒░░░░░░▒▒▒▒▌
   ▌▒▀▐▄█▄█▌▄░▀▒▒░░░░░░░░░░▒▒▒▐
   ▐▒▒▐▀▐▀▒░▄▄▒▄▒▒▒▒▒▒░▒░▒░▒▒▒▒▌
   ▐▒▒▒▀▀▄▄▒▒▒▄▒▒▒▒▒▒▒▒░▒░▒░▒▒▐
    ▌▒▒▒▒▒▒▀▀▀▒▒▒▒▒▒░▒░▒░▒░▒▒▒▌
     ▐▒▒▒▒▒▒▒▒▒▒▒▒▒▒░▒░▒░▒▒▄▒▒▐
      ▀▄▒▒▒▒▒▒▒▒▒▒▒░▒░▒░▒▄▒▒▒▒▌
        ▀▄▒▒▒▒▒▒▒▒▒▒▄▄▄▀▒▒▒▒▄▀
          ▀▄▄▄▄▄▄▀▀▀▒▒▒▒▒▄▄▀
             ▒▒▒▒▒▒▒▒▒▒▀▀

░░░░░░░  █░█ ▄▀█ █░░ █░░ █▀█ ░  ░░░░░░░
░░░░░░░  █▀█ █▀█ █▄▄ █▄▄ █▄█ █  ░░░░░░░
`);
