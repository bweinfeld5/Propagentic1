// Canvas Design System Components
// Clean, minimal components following Canvas LMS design patterns

export { default as CanvasCard } from './CanvasCard';
export { default as CanvasButton } from './CanvasButton';
export { default as CanvasBadge } from './CanvasBadge';

// Layout Components
export { 
  default as CanvasDashboardLayout,
  CanvasMobileNav,
  CanvasMobileNavItem 
} from '../../contractor/canvas/CanvasDashboardLayout';

// Re-export design system utilities
export { 
  canvasDesignSystem,
  getCanvasColor,
  getCanvasSpacing,
  getCanvasComponent
} from '../../../styles/canvasDesignSystem';

export {
  canvasLayoutSystem,
  getCanvasContainer,
  getCanvasLayout,
  getCanvasCard,
  getCanvasWidget,
  canvasResponsive
} from '../../../styles/canvasLayoutSystem'; 