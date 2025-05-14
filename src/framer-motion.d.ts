declare module 'framer-motion' {
  import * as React from 'react';

  export interface AnimatePresenceProps {
    children?: React.ReactNode;
    initial?: boolean;
    onExitComplete?: () => void;
    exitBeforeEnter?: boolean;
    mode?: 'sync' | 'wait' | 'popLayout';
  }

  export interface MotionProps {
    initial?: any;
    animate?: any;
    exit?: any;
    transition?: any;
    whileHover?: any;
    whileTap?: any;
    variants?: any;
    className?: string;
    style?: React.CSSProperties;
    [key: string]: any;
  }

  export type MotionComponent<T extends React.ElementType> = React.ForwardRefExoticComponent<
    MotionProps & React.ComponentPropsWithoutRef<T> & { ref?: React.Ref<any> }
  >;

  export type Motion = {
    [K in keyof JSX.IntrinsicElements]: MotionComponent<K>;
  } & {
    custom: <T extends React.ElementType>(component: T) => MotionComponent<T>;
  };

  export const motion: Motion;
  export const AnimatePresence: React.FC<AnimatePresenceProps>;
} 