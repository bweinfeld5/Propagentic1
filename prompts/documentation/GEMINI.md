# PropAgentic - AI-Powered Property Management SaaS

## Project Overview

PropAgentic is a comprehensive AI-powered property management SaaS platform that streamlines property management workflows for landlords, tenants, and contractors. The platform provides role-based dashboards, maintenance request management, tenant communications, contractor coordination, payment processing, and administrative controls.

## Technology Stack

### Frontend
- **React 18** with TypeScript/JavaScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Heroicons** for icons
- **react-hot-toast** for notifications
- **React Query** for data fetching (planned)
- **Lottie** for animations

### Backend & Services
- **Firebase** (primary backend)
  - Firebase Authentication
  - Cloud Firestore (database)
  - Cloud Functions (serverless)
  - Firebase Storage
  - Firebase Hosting
- **Stripe** for payment processing
- **Twilio** for SMS communications

### Build Tools & Configuration
- **react-app-rewired** (customized Create React App)
- **Webpack** with custom configuration
- **Babel** for transpilation
- **ESLint** for code linting
- **Jest** for testing
- **Playwright** for end-to-end testing

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Generic UI elements (Button, StatusPill, etc.)
│   ├── landlord/        # Landlord-specific components
│   ├── tenant/          # Tenant-specific components
│   ├── contractor/      # Contractor-specific components
│   ├── admin/           # Admin dashboard components
│   └── shared/          # Cross-role shared components
├── pages/               # Route-level page components
├── context/             # React Context providers
├── services/            # Data services and Firebase interactions
├── firebase/            # Firebase configuration and setup
├── models/              # TypeScript interfaces and Firestore converters
├── types/               # Additional TypeScript type definitions
├── utils/               # Utility functions
├── hooks/               # Custom React hooks
└── styles/              # Global styles and design system

functions/               # Firebase Cloud Functions
public/                  # Static assets
scripts/                 # Build and deployment scripts
```

## Key Commands

*Note: The following commands are inferred from project structure and may need verification*

### Development
```bash
npm run start:fix        # Start development server (preferred)
npm start               # Alternative start command
npm run build           # Create production build
npm test                # Run test suite
npm run test:watch      # Run tests in watch mode
```

### Firebase Deployment
```bash
firebase deploy                    # Deploy all Firebase services
firebase deploy --only hosting    # Deploy only hosting
firebase deploy --only functions  # Deploy only Cloud Functions
firebase deploy --only firestore  # Deploy Firestore rules and indexes
```

### Testing & Quality
```bash
npm run lint            # Run ESLint
npm run test:e2e        # Run Playwright end-to-end tests
npm run accessibility   # Run accessibility audits
```

## Coding Conventions & Style

### TypeScript/JavaScript
- **Functional components** with React hooks (no class components)
- **Strong TypeScript typing** - avoid `any`, use `unknown` when necessary
- **Interface definitions** for all data models and component props
- **Optional chaining** (`?.`) and nullish coalescing (`??`) operators

### Component Organization
- **PascalCase** for component files and exports
- Role-specific components in respective folders (`tenant/`, `landlord/`, `contractor/`, `admin/`)
- Generic UI components in `/components/ui/`
- Use existing UI components (Button, StatusPill) rather than creating new ones

### Styling
- **Tailwind CSS exclusively** - no inline styles or CSS-in-JS
- **Dark mode support** using `dark:` prefixed classes
- **Responsive design** with mobile-first approach

### Firebase Patterns
- Use service modules for Firebase interactions (`dataService.js`, `inviteService.ts`)
- Handle async errors with try/catch blocks
- Follow resilient operations pattern with retries
- Use Firestore converters for type safety

### State Management
- **React Context API** for global state (see AuthContext)
- **Local state** with useState for component-specific data
- **Custom hooks** for reusable stateful logic

## Deployment

The application uses **Firebase** as the primary deployment platform:

### Environments
- **Development**: Local development with Firebase emulators
- **Staging**: Firebase project for testing
- **Production**: Main Firebase project

### Configuration Files
- `.env` files for environment-specific variables
- `firebase.json` for Firebase project configuration
- `firestore.rules` for database security rules
- `firestore.indexes.json` for database indexes

### Deployment Process
1. Build the application (`npm run build`)
2. Deploy to Firebase Hosting and Functions
3. Update Firestore rules and indexes as needed
4. Verify deployment across all user roles

## Important Files

### Configuration & Entry Points
- `package.json` - Dependencies and scripts
- `config-overrides.js` - react-app-rewired customizations
- `firebase.json` - Firebase project configuration
- `firestore.rules` - Database security rules
- `firestore.indexes.json` - Database indexes
- `src/App.jsx` - Main application entry point
- `src/firebase/config.js` - Firebase initialization

### Key Components
- `src/context/AuthContext.jsx` - Authentication state management
- `src/models/converters.ts` - Firestore data conversion
- `src/services/` - Firebase service modules
- `functions/src/index.ts` - Cloud Functions entry point

### Testing & Quality
- `jest.setup.ts` - Jest testing configuration
- `playwright.config.js` - E2E testing configuration
- `eslint.config.mjs` - ESLint rules and configuration

## Role-Based Architecture

### User Roles
- **Landlords**: Property management, tenant coordination, maintenance oversight
- **Tenants**: Property access, maintenance requests, communication
- **Contractors**: Job management, estimate submission, work completion
- **Admins**: System administration, user management, platform oversight

### Authentication & Authorization
- Firebase Authentication with custom claims
- Role-based route protection
- Firestore security rules based on user roles
- Profile completion requirements for full access

## Development Workflow

1. **Start with user authentication** - all features require proper auth context
2. **Follow existing patterns** - use established service modules and component structures
3. **Implement role-based access** - ensure proper authorization for all features
4. **Test across user types** - verify functionality for landlords, tenants, and contractors
5. **Maintain responsive design** - ensure mobile compatibility
6. **Handle errors gracefully** - use toast notifications and proper error boundaries

## Performance Considerations

- **Code splitting** with React.lazy and Suspense
- **Efficient Firebase queries** with proper indexing
- **Optimized bundle size** - currently ~659KB (needs optimization)
- **Image optimization** and lazy loading
- **Firestore query limitations** and pagination

## Security & Compliance

- **Input validation** before database writes
- **Firestore security rules** for data protection
- **User data sanitization** for user-generated content
- **API key management** through environment variables
- **Role-based access control** throughout the application 