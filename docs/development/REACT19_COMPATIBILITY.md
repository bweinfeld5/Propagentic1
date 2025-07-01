# React 19 Compatibility Guide

This document outlines the steps we've taken to ensure our codebase is compatible with React 19, focusing particularly on the handling of third-party libraries that may not be fully compatible yet.

## SafeMotion: A Compatibility Layer for Framer Motion

One of the key challenges with React 19 is ensuring compatibility with animation libraries like Framer Motion. To address this, we've implemented a compatibility layer called `SafeMotion`.

### How SafeMotion Works

1. `SafeMotion` provides fallback components that mimic the API of Framer Motion
2. It attempts to dynamically load the real Framer Motion library at runtime
3. If successful, it uses the real library; if not, it gracefully falls back to basic components

This approach allows us to:
- Continue using the same component API throughout our codebase
- Gracefully degrade when used with React 19 if Framer Motion isn't fully compatible
- Avoid hard dependencies that would break the build

### Using SafeMotion in Your Components

Instead of importing directly from `framer-motion`, import from our compatibility layer:

```tsx
// DON'T do this
import { motion, AnimatePresence } from 'framer-motion';

// DO this instead
import { SafeMotion, AnimatePresence } from '../shared/SafeMotion';
```

Then use `SafeMotion` instead of `motion` in your JSX:

```tsx
// DON'T do this
<motion.div animate={{ opacity: 1 }}>
  Content
</motion.div>

// DO this instead
<SafeMotion.div animate={{ opacity: 1 }}>
  Content
</SafeMotion.div>
```

### Migration Script

We've included a migration script to help convert existing components to use SafeMotion:

```bash
npm run migrate-framer-motion
```

This script:
1. Finds files with direct Framer Motion imports
2. Replaces them with SafeMotion imports
3. Updates component references from `motion` to `SafeMotion`

### Animation Best Practices

When working with animations in a React 19 compatible codebase:

1. **Avoid layout animations when possible** - These can be particularly problematic
2. **Use simpler animations** - Stick to opacity, transform, etc. rather than complex layout animations
3. **Consider using CSS animations as fallback** - For critical UI elements
4. **Test with animation disabled** - Ensure your UI works even if animations fail

## Other React 19 Compatibility Considerations

### 1. Use Effect Cleanup

React 19 is stricter about effect cleanup. Always return a cleanup function from your `useEffect` hooks:

```tsx
useEffect(() => {
  const subscription = someService.subscribe();
  
  // Always include a cleanup function
  return () => {
    subscription.unsubscribe();
  };
}, [someService]);
```

### 2. Avoid Legacy Context API

React 19 has deprecated the legacy Context API. Use the modern Context API with `createContext`:

```tsx
// Modern approach
const MyContext = createContext(defaultValue);
```

### 3. Event Pooling

React 19 has removed event pooling, so you no longer need to call `e.persist()` when using events asynchronously.

### 4. Strict Mode

Test your components with React's Strict Mode enabled to catch potential compatibility issues early.

## Library-Specific Notes

The following libraries may have compatibility issues with React 19:

1. **Framer Motion** - Use our SafeMotion compatibility layer
2. **React Router** - Ensure you're using v6.3+ for best compatibility
3. **Material UI** - Use v5+ for React 19 compatibility
4. **Redux** - Use the latest version with hooks API

## Need Help?

If you encounter React 19 compatibility issues:

1. Check if we already have a compatibility wrapper (like SafeMotion)
2. Consider implementing a similar compatibility layer if needed
3. Test thoroughly with React 19 before deploying
4. Document any workarounds you discover

For additional questions, contact the development team. 