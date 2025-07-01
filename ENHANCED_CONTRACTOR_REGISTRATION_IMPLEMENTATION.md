# Enhanced Contractor Registration System: Implementation Guide

This guide details the process of upgrading the contractor registration system to include trades selection, enhanced form fields, and a new Firestore data structure.

## 1. Project Setup & File Structure

Ensure you are in the project root directory. The primary files to be modified or created are:

-   `src/models/contractor.ts` (or a similar model definition file)
-   `src/services/contractorService.ts`
-   `src/pages/ContractorRegister.tsx` (or the existing registration page)
-   `src/components/contractor/TradesSelector.tsx` (new component)

## 2. TypeScript Interface Updates

First, define the new interface for our waitlist entries in `src/models/contractor.ts` or a relevant models file.

```typescript
// src/models/contractor.ts

import { Timestamp } from 'firebase/firestore';

// Keep the existing interface if it's used elsewhere, or update as needed.
export interface ContractorRegistration {
  name: string;
  phoneNumber: string;
}

// New interface for the contractor waitlist
export interface ContractorWaitlistEntry {
  id?: string; // Optional: Firestore document ID
  name: string;
  phoneNumber: string;
  email?: string;
  trades: string[];
  experience: 'under-1-year' | '1-3-years' | '3-5-years' | '5-10-years' | '10-plus-years';
  serviceArea?: string;
  createdAt: Timestamp;
  status: 'pending' | 'contacted' | 'onboarded' | 'rejected';
  source: 'website-registration';
}
```

## 3. Firebase Service Layer (`contractorService.ts`)

Update the `registerContractor` function to handle the new data structure and write to the `contractorWaitlist` collection.

```typescript
// src/services/contractorService.ts

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config'; // Adjust path if necessary
import { ContractorWaitlistEntry } from '../models/contractor';

// List of available trades for validation
export const availableTrades = [
  'Plumbing', 'Electrical', 'HVAC', 'Carpentry', 'Painting', 'Roofing',
  'Flooring', 'Landscaping', 'Appliance Repair', 'General Maintenance',
  'Pest Control', 'Cleaning Services', 'Handyman Services'
];

/**
 * Registers a contractor for the waitlist.
 *
 * @param formData - The contractor's registration data.
 * @returns The ID of the newly created document.
 */
export const registerContractorForWaitlist = async (
  formData: Omit<ContractorWaitlistEntry, 'id' | 'createdAt' | 'status' | 'source'>
): Promise<string> => {
  try {
    // Basic validation before Firestore write
    if (!formData.name || formData.name.length < 2) {
      throw new Error('Validation Error: Name is required and must be at least 2 characters.');
    }
    if (formData.trades.length === 0) {
      throw new Error('Validation Error: At least one trade must be selected.');
    }

    const waitlistCollection = collection(db, 'contractorWaitlist');

    const newEntry: Omit<ContractorWaitlistEntry, 'id'> = {
      ...formData,
      createdAt: serverTimestamp() as any, // Let Firestore handle the timestamp
      status: 'pending',
      source: 'website-registration',
    };

    const docRef = await addDoc(waitlistCollection, newEntry);
    console.log('Contractor added to waitlist with ID:', docRef.id);
    return docRef.id;

  } catch (error) {
    console.error('Error registering contractor for waitlist:', error);
    // Re-throw the error to be handled by the calling component
    throw new Error('Failed to submit registration. Please try again.');
  }
};
```

## 4. Trades Selection Component

Create a new reusable component for selecting trades. This component will manage its own state and provide the selected trades to the parent form.

```typescript
// src/components/contractor/TradesSelector.tsx

import React, { useState } from 'react';
import { availableTrades } from '../../services/contractorService'; // Import from service

interface TradesSelectorProps {
  selectedTrades: string[];
  onChange: (trades: string[]) => void;
}

const TradesSelector: React.FC<TradesSelectorProps> = ({ selectedTrades, onChange }) => {
  const handleTradeChange = (trade: string) => {
    const newSelection = selectedTrades.includes(trade)
      ? selectedTrades.filter(t => t !== trade)
      : [...selectedTrades, trade];
    onChange(newSelection);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Select Your Trades/Services <span className="text-red-500">*</span>
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {availableTrades.map((trade) => (
          <label
            key={trade}
            className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
              selectedTrades.includes(trade)
                ? 'bg-blue-500 border-blue-600 text-white shadow-md'
                : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            <input
              type="checkbox"
              className="sr-only" // Hide the default checkbox
              checked={selectedTrades.includes(trade)}
              onChange={() => handleTradeChange(trade)}
            />
            <span className="text-sm font-semibold">{trade}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default TradesSelector;
```

## 5. Enhanced Contractor Registration Page

Now, update the main registration page to include the new form fields, validation logic, and the `TradesSelector` component.

```typescript
// src/pages/ContractorRegister.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ContractorWaitlistEntry } from '../models/contractor';
import { registerContractorForWaitlist } from '../services/contractorService';
import TradesSelector from '../components/contractor/TradesSelector';
import Button from '../components/ui/Button'; // Assuming a reusable Button component

type FormErrors = {
  [key in keyof Partial<ContractorWaitlistEntry>]: string;
};

const ContractorRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    trades: [] as string[],
    experience: '' as ContractorWaitlistEntry['experience'],
    serviceArea: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters long.';
    }
    // Basic phone validation (e.g., 10 digits)
    if (!/^\d{10}$/.test(formData.phoneNumber.replace(/\D/g, ''))) {
      newErrors.phoneNumber = 'Please enter a valid 10-digit phone number.';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (formData.trades.length === 0) {
      newErrors.trades = 'Please select at least one trade.';
    }
    if (!formData.experience) {
      newErrors.experience = 'Please select your years of experience.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTradesChange = (trades: string[]) => {
    setFormData(prev => ({ ...prev, trades }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting.');
      return;
    }

    setIsLoading(true);
    try {
      await registerContractorForWaitlist({
        ...formData,
        experience: formData.experience as ContractorWaitlistEntry['experience'],
      });
      toast.success('Registration successful! We will contact you soon.');
      navigate('/contractor/registration-success'); // Redirect to a success page
    } catch (error: any) {
      toast.error(error.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const experienceOptions: ContractorWaitlistEntry['experience'][] = [
    'under-1-year', '1-3-years', '3-5-years', '5-10-years', '10-plus-years'
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-2">Join Our Network</h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
          Register as a contractor to get access to exclusive job opportunities.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-6">
            {/* Name and Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name <span className="text-red-500">*</span></label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600" required />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number <span className="text-red-500">*</span></label>
                <input type="tel" name="phoneNumber" id="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600" required />
                {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>}
              </div>
            </div>

            {/* Email and Service Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                    <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600" />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                <div>
                    <label htmlFor="serviceArea" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Service Area / City</label>
                    <input type="text" name="serviceArea" id="serviceArea" value={formData.serviceArea} onChange={handleChange} placeholder="e.g., San Francisco Bay Area" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600" />
                </div>
            </div>

            {/* Experience */}
            <div>
              <label htmlFor="experience" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Years of Experience <span className="text-red-500">*</span></label>
              <select name="experience" id="experience" value={formData.experience} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600" required>
                <option value="" disabled>Select an option</option>
                {experienceOptions.map(opt => (
                  <option key={opt} value={opt}>{opt.replace('-', ' ').replace('plus', '10+ years')}</option>
                ))}
              </select>
              {errors.experience && <p className="text-red-500 text-xs mt-1">{errors.experience}</p>}
            </div>

            {/* Trades Selector */}
            <div>
              <TradesSelector selectedTrades={formData.trades} onChange={handleTradesChange} />
              {errors.trades && <p className="text-red-500 text-xs mt-1">{errors.trades}</p>}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button type="submit" className="w-full" isLoading={isLoading}>
                {isLoading ? 'Submitting...' : 'Submit Registration'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContractorRegisterPage;
```

## 6. Routing

Ensure the route for `/contractor/register` points to this new `ContractorRegisterPage` component in your main router file (e.g., `src/App.jsx` or `src/routes.js`).

```javascript
// Example in App.jsx
<Route path="/contractor/register" element={<ContractorRegisterPage />} />
<Route path="/contractor/registration-success" element={<RegistrationSuccessPage />} />
```

It is recommended to create a simple `RegistrationSuccessPage` to provide feedback to the user after a successful submission.

## 7. Testing Considerations

### Manual Testing Checklist:
-   [ ] **Form Validation:**
    -   [ ] Submit form with empty required fields (Name, Phone, Experience, Trades) and verify error messages appear.
    -   [ ] Enter an invalid name (less than 2 chars).
    -   [ ] Enter invalid phone numbers (e.g., letters, too few/many digits).
    -   [ ] Enter an invalid email format.
    -   [ ] Verify that the form cannot be submitted with validation errors.
-   [ ] **Successful Submission:**
    -   [ ] Fill out the form correctly and submit.
    -   [ ] Verify a success toast notification appears.
    -   [ ] Verify redirection to the success page.
    -   [ ] Check the `contractorWaitlist` collection in Firestore to confirm the new document was created with the correct data, including the server-generated timestamp.
-   [ ] **Trades Selection:**
    -   [ ] Click to select and deselect multiple trades.
    -   [ ] Verify the UI updates correctly to show selected trades.
    -   [ ] Ensure the selected trades are correctly stored in the form state and submitted to Firestore.
-   [ ] **Responsiveness:**
    -   [ ] Test the form on various screen sizes (mobile, tablet, desktop) to ensure the layout is usable and looks correct.

### Automated Testing (Jest/React Testing Library):
-   Write unit tests for the `validateForm` function.
-   Write component tests for `TradesSelector` to ensure `onChange` is called with the correct values.
-   Write integration tests for `ContractorRegisterPage` that simulate user input, form submission, and mock the `registerContractorForWaitlist` service call to verify its behavior on success and failure.

This implementation provides a robust, user-friendly, and scalable contractor registration system that aligns with PropAgentic's existing technical and design standards.
