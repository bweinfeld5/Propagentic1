# PropAgentic UI Component Library

This directory contains reusable UI components that follow PropAgentic's design system. All components are built with consistency, accessibility, and reusability in mind.

## Design Tokens

PropAgentic uses a design token system with standardized values for colors, spacing, typography, and more. These tokens are defined in:

- `src/utils/theme.ts` - JavaScript tokens for programmatic usage
- `src/styles/theme.css` - CSS variables for styling

## Color System

Always use the PropAgentic color tokens rather than generic Tailwind colors to maintain brand consistency:

✅ **Correct**: `bg-propagentic-teal text-white`  
❌ **Incorrect**: `bg-teal-500 text-white`

### Primary Brand Colors

- `propagentic-teal` - Primary brand color, used for CTAs and important UI elements
- `propagentic-blue` - Used for links, information indicators
- `propagentic-yellow` - Used for warnings, in-progress status
- `propagentic-error` - Used for error states, destructive actions
- `propagentic-success` - Used for success states, confirmations

### Neutral Colors

Use the neutrals and slate color palettes for backgrounds, text, and UI elements:

- `neutral-lightest` to `neutral-darkest` - General UI elements
- `slate-lightest` to `slate-darkest` - More subtle UI elements

## Components

### Button
The `Button` component supports different variants, sizes, and states. Use it for all button elements in the application.

```jsx
import Button from '../ui/Button';

// Primary button (default)
<Button onClick={handleClick}>Click Me</Button>

// Other variants
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="danger">Danger</Button>
<Button variant="success">Success</Button>

// Sizes
<Button size="xs">Extra Small</Button>
<Button size="sm">Small</Button>
<Button size="md">Medium (Default)</Button>
<Button size="lg">Large</Button>

// With icon
<Button icon={<PlusIcon />}>Add Item</Button>
<Button icon={<ArrowRightIcon />} iconPosition="right">Next</Button>

// Full width
<Button fullWidth>Full Width Button</Button>
```

### StatusPill

The `StatusPill` component is used to display status indicators throughout the application.

```jsx
import StatusPill from '../ui/StatusPill';

<StatusPill status="new" />
<StatusPill status="in progress" />
<StatusPill status="completed" />
<StatusPill status="canceled" />
<StatusPill status="pending" />
```

## Typography

Use consistent text styling throughout the application:

- Headings: `text-3xl font-bold` (for main headings), scale down appropriately for subheadings
- Body text: `text-base` or `text-sm` for smaller text
- Always use the system font stack defined in the theme

## Spacing

Use consistent spacing based on the theme tokens:

- Small spacing (between related elements): `p-2`, `m-2`, `gap-2`
- Medium spacing (between sections): `p-4`, `m-4`, `gap-4`
- Large spacing (between major sections): `p-8`, `m-8`, `gap-8`

## Dark Mode

All components should support dark mode by using:

- `dark:` prefix for Tailwind classes that should have different values in dark mode
- Reference the theme CSS variables that automatically adjust for dark mode

## Accessibility

Ensure all components:

- Have appropriate color contrast (WCAG AA minimum)
- Include proper ARIA attributes when needed
- Support keyboard navigation
- Have focus states with visible indicators

## Contributing New Components

When adding new UI components:

1. Follow existing naming and file structure conventions
2. Document the component with JSDoc comments
3. Implement dark mode support
4. Ensure the component uses theme tokens, not hardcoded values
5. Test in both light and dark modes 