/**
 * Inline blueprint grid SVG as a fallback
 * This can be used directly as a data URI in case the external SVG files aren't loading
 */
const inlineBlueprintGridSvg = `
<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
      <!-- Horizontal lines -->
      <path d="M 0 0 L 50 0" stroke="#094067" stroke-width="0.5" opacity="0.07" />
      <path d="M 0 10 L 50 10" stroke="#094067" stroke-width="0.3" opacity="0.05" />
      <path d="M 0 20 L 50 20" stroke="#094067" stroke-width="0.3" opacity="0.05" />
      <path d="M 0 30 L 50 30" stroke="#094067" stroke-width="0.3" opacity="0.05" />
      <path d="M 0 40 L 50 40" stroke="#094067" stroke-width="0.3" opacity="0.05" />
      
      <!-- Vertical lines -->
      <path d="M 0 0 L 0 50" stroke="#094067" stroke-width="0.5" opacity="0.07" />
      <path d="M 10 0 L 10 50" stroke="#094067" stroke-width="0.3" opacity="0.05" />
      <path d="M 20 0 L 20 50" stroke="#094067" stroke-width="0.3" opacity="0.05" />
      <path d="M 30 0 L 30 50" stroke="#094067" stroke-width="0.3" opacity="0.05" />
      <path d="M 40 0 L 40 50" stroke="#094067" stroke-width="0.3" opacity="0.05" />
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#grid)" />
</svg>
`;

/**
 * Inline blueprint details SVG as a fallback
 */
const inlineBlueprintDetailsSvg = `
<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="details" width="300" height="300" patternUnits="userSpaceOnUse">
      <!-- Building/Apartment outline -->
      <rect x="20" y="20" width="70" height="70" stroke="#3DA9FC" fill="none" stroke-width="0.8" opacity="0.04" />
      <rect x="30" y="30" width="20" height="20" stroke="#3DA9FC" fill="none" stroke-width="0.5" opacity="0.03" />
      <rect x="60" y="30" width="20" height="20" stroke="#3DA9FC" fill="none" stroke-width="0.5" opacity="0.03" />
      <rect x="30" y="60" width="20" height="20" stroke="#3DA9FC" fill="none" stroke-width="0.5" opacity="0.03" />
      <rect x="60" y="60" width="20" height="20" stroke="#3DA9FC" fill="none" stroke-width="0.5" opacity="0.03" />
      
      <!-- Pipes -->
      <path d="M 150 40 L 200 40 L 200 80 L 250 80" stroke="#3DA9FC" stroke-width="1" opacity="0.03" fill="none" />
      <circle cx="150" cy="40" r="3" stroke="#3DA9FC" stroke-width="0.6" opacity="0.04" fill="none" />
      <circle cx="200" cy="40" r="3" stroke="#3DA9FC" stroke-width="0.6" opacity="0.04" fill="none" />
      <circle cx="200" cy="80" r="3" stroke="#3DA9FC" stroke-width="0.6" opacity="0.04" fill="none" />
      <circle cx="250" cy="80" r="3" stroke="#3DA9FC" stroke-width="0.6" opacity="0.04" fill="none" />
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#details)" />
</svg>
`;

// Convert SVG to data URI
const svgToDataUri = (svgString) => {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
};

export const blueprintGridDataUri = svgToDataUri(inlineBlueprintGridSvg);
export const blueprintDetailsDataUri = svgToDataUri(inlineBlueprintDetailsSvg); 