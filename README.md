# Propagentic Property Management Platform

An AI-powered property management platform that simplifies communication between landlords, contractors, and tenants.

## Features

- 🔐 Role-based authentication (landlord, contractor, tenant)
- 🔧 Maintenance request submission with photo uploads
- 🤖 AI-powered issue classification and contractor matching
- 📊 Dashboard for landlords to manage requests
- 📱 Automated notifications to contractors
- 📁 Structured data storage with Firebase Firestore

## Tech Stack

- **Frontend**: React with Tailwind CSS
- **Backend**: Firebase (Auth, Firestore, Cloud Functions, Storage)
- **AI Integration**: Claude API for intelligent request classification
- **Notifications**: Twilio integration (or mock function)

## Project Structure

```
├── public/                  # Static assets
├── src/
│   ├── components/          # React components
│   │   ├── auth/            # Authentication components
│   │   ├── dashboard/       # Dashboard components
│   │   ├── layout/          # Layout components
│   │   ├── maintenance/     # Maintenance request components
│   │   └── ui/              # UI components
│   ├── contexts/            # React contexts
│   │   ├── AuthContext.js   # Authentication context
│   │   └── AppContext.js    # Application state context
│   ├── firebase/            # Firebase configuration
│   ├── hooks/               # Custom hooks
│   ├── pages/               # Page components
│   ├── utils/               # Utility functions
│   ├── App.js               # Main application component
│   └── index.js             # Entry point
├── functions/               # Firebase Cloud Functions
│   ├── index.js             # Functions implementation
│   └── claude/              # Claude API integration
├── firestore.rules          # Firestore security rules
├── storage.rules            # Firebase Storage rules
└── tailwind.config.js       # Tailwind CSS configuration
```

## Getting Started

1. Clone this repository
2. Install dependencies: `npm install`
3. Run the development server: `npm start`
4. Deploy to Firebase: `npm run build && firebase deploy`

## Authentication Flows

- **Tenant**: Sign up/login to submit maintenance requests
- **Contractor**: Login to view assigned tasks
- **Landlord**: Login to manage properties, tenants, and maintenance requests

## Data Model

- **Users**: User accounts with roles and profile information
- **Requests**: Maintenance requests with status, details, and assignments
- **Contractors**: Contractor profiles with specialties and availability
- **Properties**: Property information with units and tenant assignments

## License

MIT 