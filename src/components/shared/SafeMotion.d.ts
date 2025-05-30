import { ComponentType, ReactNode, ForwardRefExoticComponent, PropsWithoutRef, RefAttributes } from 'react';

// Motion properties interface
export interface MotionProps {
  initial?: any;
  animate?: any;
  exit?: any;
  transition?: any;
  whileHover?: any;
  whileTap?: any;
  whileInView?: any;
  viewport?: any;
  variants?: any;
  [key: string]: any;
}

// Motion components type
export type MotionComponents = {
  [K in keyof JSX.IntrinsicElements]: ForwardRefExoticComponent<
    MotionProps & JSX.IntrinsicElements[K] & RefAttributes<HTMLElement>
  >;
};

// Animate presence props
export interface AnimatePresenceProps {
  children: ReactNode;
  mode?: 'sync' | 'wait' | 'popLayout';
  initial?: boolean;
  onExitComplete?: () => void;
  presenceAffectsLayout?: boolean;
}

// Export type for SafeMotion
export type SafeMotionType = {
  div: ForwardRefExoticComponent<MotionProps & JSX.IntrinsicElements['div'] & RefAttributes<HTMLDivElement>>;
  span: ForwardRefExoticComponent<MotionProps & JSX.IntrinsicElements['span'] & RefAttributes<HTMLSpanElement>>;
  img: ForwardRefExoticComponent<MotionProps & JSX.IntrinsicElements['img'] & RefAttributes<HTMLImageElement>>;
  button: ForwardRefExoticComponent<MotionProps & JSX.IntrinsicElements['button'] & RefAttributes<HTMLButtonElement>>;
  a: ForwardRefExoticComponent<MotionProps & JSX.IntrinsicElements['a'] & RefAttributes<HTMLAnchorElement>>;
  ul: ForwardRefExoticComponent<MotionProps & JSX.IntrinsicElements['ul'] & RefAttributes<HTMLUListElement>>;
  li: ForwardRefExoticComponent<MotionProps & JSX.IntrinsicElements['li'] & RefAttributes<HTMLLIElement>>;
  p: ForwardRefExoticComponent<MotionProps & JSX.IntrinsicElements['p'] & RefAttributes<HTMLParagraphElement>>;
  h1: ForwardRefExoticComponent<MotionProps & JSX.IntrinsicElements['h1'] & RefAttributes<HTMLHeadingElement>>;
  h2: ForwardRefExoticComponent<MotionProps & JSX.IntrinsicElements['h2'] & RefAttributes<HTMLHeadingElement>>;
  h3: ForwardRefExoticComponent<MotionProps & JSX.IntrinsicElements['h3'] & RefAttributes<HTMLHeadingElement>>;
  h4: ForwardRefExoticComponent<MotionProps & JSX.IntrinsicElements['h4'] & RefAttributes<HTMLHeadingElement>>;
  h5: ForwardRefExoticComponent<MotionProps & JSX.IntrinsicElements['h5'] & RefAttributes<HTMLHeadingElement>>;
  h6: ForwardRefExoticComponent<MotionProps & JSX.IntrinsicElements['h6'] & RefAttributes<HTMLHeadingElement>>;
  header: ForwardRefExoticComponent<MotionProps & JSX.IntrinsicElements['header'] & RefAttributes<HTMLElement>>;
  footer: ForwardRefExoticComponent<MotionProps & JSX.IntrinsicElements['footer'] & RefAttributes<HTMLElement>>;
  nav: ForwardRefExoticComponent<MotionProps & JSX.IntrinsicElements['nav'] & RefAttributes<HTMLElement>>;
  form: ForwardRefExoticComponent<MotionProps & JSX.IntrinsicElements['form'] & RefAttributes<HTMLFormElement>>;
  section: ForwardRefExoticComponent<MotionProps & JSX.IntrinsicElements['section'] & RefAttributes<HTMLElement>>;
  article: ForwardRefExoticComponent<MotionProps & JSX.IntrinsicElements['article'] & RefAttributes<HTMLElement>>;
  aside: ForwardRefExoticComponent<MotionProps & JSX.IntrinsicElements['aside'] & RefAttributes<HTMLElement>>;
  main: ForwardRefExoticComponent<MotionProps & JSX.IntrinsicElements['main'] & RefAttributes<HTMLElement>>;
};

// Type for AnimatePresence
export type AnimatePresenceType = ForwardRefExoticComponent<
  AnimatePresenceProps & RefAttributes<HTMLElement>
>;

// Export SafeMotion
export const SafeMotion: SafeMotionType;

// Export AnimatePresence
export const AnimatePresence: AnimatePresenceType;

// Helper function
export function isFramerMotionAvailable(): Promise<boolean>; 