# Developer Setup Guide

## Getting Started with PropAgentic

### Prerequisites
- Node.js 18+
- npm or yarn
- Git
- Firebase account

### Installation
```bash
# Clone repository
git clone https://github.com/your-org/propagentic.git
cd propagentic

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your Firebase config

# Start development server
npm start
```

### Project Structure
```
src/
  components/     # Reusable UI components
  pages/         # Route components
  services/      # API and business logic
  context/       # React context providers
  utils/         # Helper functions
  security/      # Security utilities
```

### Development Workflow
1. Create feature branch
2. Make changes
3. Run tests: `npm test`
4. Submit pull request

### Testing
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test
npm test PropertyCard
```

---
*Developer Guide v1.0*
