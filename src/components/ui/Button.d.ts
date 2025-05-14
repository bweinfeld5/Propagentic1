import React from 'react';

type ButtonVariant = 
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'filter-active'
  | 'filter-inactive'
  | 'light'
  | 'outline-inverse'
  | 'ghost-inverse'
  | 'tab-active'
  | 'tab-inactive';

type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type IconPosition = 'left' | 'right';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
  className?: string;
  icon?: React.ReactElement;
  iconPosition?: IconPosition;
  to?: string;
  href?: string;
  as?: React.ElementType;
  role?: string;
  'aria-selected'?: boolean;
  'aria-expanded'?: boolean;
  'aria-label'?: string;
  tabIndex?: number;
}

declare const Button: React.ForwardRefExoticComponent<
  ButtonProps & React.RefAttributes<HTMLButtonElement | HTMLAnchorElement>
>;

export default Button; 