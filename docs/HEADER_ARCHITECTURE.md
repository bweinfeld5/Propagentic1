# PropAgentic Header Architecture v2.0
## Unified Progressive Disclosure System

### 🎯 **Executive Summary**
Consolidate 5+ header components into a single, context-aware system following modern SaaS patterns from Linear, Stripe, and Notion. Implement progressive disclosure to reduce cognitive load while maintaining full functionality.

---

## 📊 **Current State Analysis**

### Existing Components (TO BE DEPRECATED)
```
src/components/layout/
├── GlassyHeader.jsx          ❌ 402 lines - Marketing + Dashboard hybrid
├── HeaderNav.jsx             ❌ 169 lines - Dashboard only  
├── HeaderBar.jsx             ❌ 61 lines - Maintenance specific
├── SidebarNav.jsx            ✅ Keep - Sidebar navigation (237 lines)
└── newComponents/
    └── StickyHeader.jsx      ❌ 104 lines - Alternative marketing header

src/components/landing/
├── components/HeaderTabs.tsx ❌ 28 lines - Landing page only
└── newComponents/HeaderTabs.jsx ❌ 28+ lines - Another landing variant
```

### Problems Identified
- 🔥 **7 different header components** with overlapping functionality
- 🔥 **Inconsistent routing**: `/login`, `/signup` vs `/auth?tab=login`
- 🔥 **Design system drift** across components
- 🔥 **Mobile UX inconsistencies** 
- 🔥 **Maintenance overhead** - changes needed in multiple places

---

## 🏗️ **New Architecture: UnifiedHeader System**

### Component Hierarchy
```
src/components/layout/headers/
├── UnifiedHeader.tsx         🆕 Main export - context switcher
├── MarketingHeader.tsx       🆕 Public website header  
├── AppHeader.tsx             🆕 Authenticated app header
├── MinimalHeader.tsx         🆕 Auth pages, onboarding
└── components/
    ├── UserMenu.tsx          🆕 Profile dropdown with role context
    ├── NotificationCenter.tsx 🆕 Smart notification system
    ├── CommandPalette.tsx    🆕 Global search (⌘K)
    └── RoleNavigation.tsx    🆕 Progressive disclosure nav
```

### Progressive Disclosure Strategy

#### **Level 1: Core Actions (Always Visible)**
```tsx
// Landlord Core
['Dashboard', 'Properties', 'Maintenance']

// Tenant Core  
['Dashboard', 'Maintenance', 'Payments']

// Contractor Core
['Dashboard', 'Jobs', 'Schedule']
```

#### **Level 2: Contextual Actions (Page-Based)**
```tsx
// When on /maintenance/*
contextual: ['New Request', 'Filters', 'Export']

// When on /properties/*  
contextual: ['Add Property', 'Bulk Edit', 'Reports']

// When on /dashboard
contextual: ['Quick Add', 'Notifications', 'Settings']
```

#### **Level 3: Advanced Features (Menu/Search)**
```tsx
// Available via Command Palette (⌘K) or User Menu
advanced: [
  'Analytics', 'Integrations', 'Team Management', 
  'Billing', 'API Keys', 'Audit Logs'
]
```

---

## 🎨 **Design System Standards**

### Visual Hierarchy
```tsx
// Desktop Layout (1200px+)
[Logo][Primary Nav][Contextual Actions] [Search][Notifications][User]

// Tablet Layout (768px-1199px)  
[☰][Logo][Key Action] [Search][👤]

// Mobile Layout (320px-767px)
[☰][Logo] [👤]
```

### Interaction Patterns
- **Hover states**: Consistent 150ms transitions
- **Focus management**: Proper keyboard navigation
- **Mobile gestures**: Swipe to reveal sidebar
- **Loading states**: Skeleton UI during role transitions

### Accessibility Standards
- **WCAG 2.1 AA compliant**
- **Screen reader optimized**
- **Keyboard navigation** with skip links
- **High contrast mode** support

---

## 🔄 **State Management**

### Header Context Provider
```tsx
interface HeaderContextType {
  variant: 'marketing' | 'app' | 'minimal';
  userRole: 'landlord' | 'tenant' | 'contractor' | null;
  currentSection: string;
  breadcrumbs: BreadcrumbItem[];
  notifications: NotificationItem[];
  searchIndex: SearchableItem[];
}
```

### Navigation State
```tsx
interface NavigationState {
  primaryItems: NavItem[];          // Always visible
  contextualItems: NavItem[];       // Page-specific  
  quickActions: ActionItem[];       // Role-specific shortcuts
  recentPages: PageItem[];          // Smart history
}
```

---

## 📱 **Responsive Behavior**

### Breakpoint Strategy
```scss
// Mobile First Approach
$mobile: 320px;     // Core functionality only
$tablet: 768px;     // Add contextual actions  
$desktop: 1200px;   // Full progressive disclosure
$xl: 1600px;        // Enhanced spacing/features
```

### Progressive Enhancement
1. **Mobile**: Essential navigation only
2. **Tablet**: Add contextual actions
3. **Desktop**: Full progressive disclosure
4. **XL**: Enhanced features (breadcrumbs, advanced search)

---

## 🔐 **Authentication Flow**

### Standardized Routes
```tsx
// All components use these routes
const AUTH_ROUTES = {
  login: '/auth?tab=login',
  signup: '/auth?tab=signup',
  forgot: '/auth?tab=forgot',
  reset: '/auth?tab=reset&token=:token',
  verify: '/auth?tab=verify&code=:code'
} as const;

// Post-auth redirects
const DASHBOARD_ROUTES = {
  landlord: '/landlord/dashboard',
  tenant: '/tenant/dashboard', 
  contractor: '/contractor/dashboard',
  admin: '/admin/dashboard'
} as const;
```

### Smart Redirects
```tsx
// Deep linking with intent preservation
const getAuthRedirect = (userProfile, searchParams) => {
  const role = userProfile?.userType;
  const intent = searchParams.get('intent');
  const redirect = searchParams.get('redirect');
  
  // Priority: intent > redirect > default dashboard
  return intent || redirect || DASHBOARD_ROUTES[role] || '/dashboard';
};
```

---

## 🚀 **Implementation Plan**

### Phase 1: Foundation (Week 1)
- [ ] Create `UnifiedHeader` architecture
- [ ] Implement `HeaderContextProvider`
- [ ] Build `MarketingHeader` (consolidate public headers)
- [ ] Update all auth routes to use `/auth?tab=*`

### Phase 2: Core Features (Week 2)  
- [ ] Build `AppHeader` with progressive disclosure
- [ ] Implement `RoleNavigation` component
- [ ] Add `UserMenu` with role context
- [ ] Create `NotificationCenter`

### Phase 3: Enhanced UX (Week 3)
- [ ] Add `CommandPalette` with global search
- [ ] Implement contextual navigation
- [ ] Add breadcrumb system
- [ ] Mobile optimization

### Phase 4: Cleanup (Week 4)
- [ ] Migrate all pages to use `UnifiedHeader`
- [ ] Remove deprecated header components
- [ ] Performance optimization
- [ ] Accessibility audit

---

## 📊 **Success Metrics**

### Performance
- [ ] **Bundle size reduction**: Target 40% decrease
- [ ] **First Contentful Paint**: < 1.2s
- [ ] **Time to Interactive**: < 2.5s

### User Experience  
- [ ] **Navigation task completion**: 95% success rate
- [ ] **Mobile usability score**: > 90
- [ ] **Accessibility score**: WCAG 2.1 AA (100%)

### Developer Experience
- [ ] **Component count**: 7 → 1 main export
- [ ] **Code duplication**: 0% across headers
- [ ] **Type safety**: 100% TypeScript coverage

---

## 🎯 **Quick Wins**

### Immediate Impact (Day 1)
1. **Fix auth routing** - Update all `/login`, `/signup` to `/auth?tab=*`
2. **Remove unused headers** - Delete redundant components
3. **Standardize user menu** - Consistent profile dropdown

### Week 1 Goals
1. **Single header import** - `import { UnifiedHeader } from '@/components/layout'`
2. **Role-based navigation** - Dynamic nav based on user type
3. **Mobile-first design** - Clean responsive experience

---

## 🔧 **Technical Specifications**

### Dependencies
```json
{
  "@headlessui/react": "^1.7.0",    // Accessible UI primitives
  "@heroicons/react": "^2.0.0",     // Consistent iconography  
  "react-router-dom": "^6.8.0",     // Routing
  "tailwindcss": "^3.2.0"           // Styling
}
```

### Bundle Impact
- **Before**: ~45KB (gzipped) across 7 components
- **After**: ~18KB (gzipped) for unified system
- **Savings**: 60% reduction in header-related code

---

## 📚 **References & Inspiration**

### Best-in-Class Examples
- **Linear**: Contextual navigation that adapts to current view
- **Stripe**: Clean progressive disclosure with power-user shortcuts  
- **Notion**: Role-based navigation with smart defaults
- **Vercel**: Minimal design with maximum functionality
- **GitHub**: Command palette for power users

### Design Tokens
```tsx
// Header-specific design tokens
const HEADER_TOKENS = {
  height: {
    mobile: '60px',
    desktop: '72px'
  },
  zIndex: {
    header: 40,
    dropdown: 50,
    modal: 60
  },
  timing: {
    transition: '150ms ease-in-out',
    dropdown: '200ms ease-out'
  }
} as const;
```

---

*This document serves as the blueprint for PropAgentic's header architecture evolution. All implementation should reference this specification for consistency and alignment with our progressive disclosure strategy.* 