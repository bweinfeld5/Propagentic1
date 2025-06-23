/// <reference types="react-scripts" />

// Declare the dotlottie-wc element for TypeScript
declare namespace JSX {
  interface IntrinsicElements {
    'dotlottie-wc': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      src?: string;
      autoplay?: boolean;
      loop?: boolean;
      controls?: boolean;
      style?: React.CSSProperties;
    }, HTMLElement>;
  }
}
