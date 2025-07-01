
# Contractor Registration Page: Implementation Guide

This guide provides a comprehensive walkthrough for implementing a contractor registration page in PropAgentic. The page allows contractors to sign up by providing their name and phone number, with the data stored securely in Firebase Firestore.

## 1. Overview & Architecture

The implementation consists of three main parts:
1.  A new page component for the registration form (`ContractorRegistrationPage.tsx`).
2.  A Firebase service function to handle the data submission (`contractorService.ts`).
3.  A TypeScript interface defining the contractor data model (`contractor.ts`).

This structure follows the existing separation of concerns in the application, keeping UI, business logic, and data models distinct.

## 2. File Structure

Create the following new files within the `src` directory:

```
src/
├── pages/
│   └── ContractorRegistrationPage.tsx  # New: The main registration page component
├── services/
│   └── firestore/
│       └── contractorService.ts        # New: Service for contractor-related Firestore operations
└── models/
    └── contractor.ts                   # New: TypeScript interface for the Contractor model
```

## 3. TypeScript Interface

First, define the data structure for a contractor. This ensures type safety throughout the application when handling contractor data.

**File:** `src/models/contractor.ts`

```typescript
// src/models/contractor.ts

/**
 * Represents a contractor in the PropAgentic system.
 */
export interface Contractor {
  id: string; // Firestore document ID
  name: string;
  phoneNumber: string;
  createdAt: Date;
  status: 'pending' | 'verified' | 'rejected';
}
```

## 4. Firebase Service Integration

Create a dedicated service to handle interactions with the `contractors` collection in Firestore. This encapsulates all Firestore logic, making components cleaner and easier to test.

**File:** `src/services/firestore/contractorService.ts`

```typescript
// src/services/firestore/contractorService.ts

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config'; // Adjust path based on your project
import { Contractor } from '../../models/contractor';

const contractorsCollection = collection(db, 'contractors');

/**
 * Registers a new contractor in Firestore.
 *
 * @param name - The full name of the contractor.
 * @param phoneNumber - The contractor's phone number.
 * @returns The ID of the newly created contractor document.
 * @throws Throws an error if the Firestore operation fails.
 */
export const registerContractor = async (
  name: string,
  phoneNumber: string
): Promise<string> => {
  try {
    const newContractor: Omit<Contractor, 'id' | 'createdAt'> = {
      name,
      phoneNumber,
      status: 'pending',
    };

    const docRef = await addDoc(contractorsCollection, {
      ...newContractor,
      createdAt: serverTimestamp(), // Use server-side timestamp
    });

    return docRef.id;
  } catch (error) {
    console.error('Error registering contractor:', error);
    // Re-throw a more user-friendly error message
    throw new Error('Failed to register. Please try again later.');
  }
};
```

## 5. Contractor Registration Page Component

This is the core UI component for the registration page. It includes the form, state management, validation, and calls the `contractorService` to submit the data.

**File:** `src/pages/ContractorRegistrationPage.tsx`

```tsx
// src/pages/ContractorRegistrationPage.tsx

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { registerContractor } from '../services/firestore/contractorService';

// Assuming you have these reusable components. If not, see notes below.
import { Button } from '../components/ui/Button';
import { AccessibleInput } from '../components/ui/AccessibleInput';
import { Spinner } from '../components/ui/Spinner'; // A simple loading spinner

const ContractorRegistrationPage: React.FC = () => {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phoneNumber?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: { name?: string; phoneNumber?: string } = {};
    let isValid = true;

    if (!name.trim()) {
      newErrors.name = 'Full name is required.';
      isValid = false;
    }

    // Basic phone number validation (e.g., at least 10 digits)
    const phoneRegex = /^\d{10,}$/;
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required.';
      isValid = false;
    } else if (!phoneRegex.test(phoneNumber.replace(/\D/g, ''))) {
      newErrors.phoneNumber = 'Please enter a valid phone number (at least 10 digits).';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await registerContractor(name, phoneNumber);
      setIsSuccess(true);
      toast.success('Registration successful! We will contact you shortly.');
      // Reset form
      setName('');
      setPhoneNumber('');
      setErrors({});
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 text-center">
        <div className="max-w-md w-full">
          <h1 className="text-3xl font-bold text-teal-600 mb-4">Thank You!</h1>
          <p className="text-gray-700">
            Your registration has been submitted. Our team will review your information and get in touch with you soon.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Join PropAgentic</h2>
        <p className="text-center text-gray-600 mb-6">Register as a contractor to start receiving job invitations.</p>
        
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <AccessibleInput
              id="name"
              label="Full Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              required
              autoComplete="name"
              placeholder="e.g., John Doe"
            />
          </div>

          <div className="mb-6">
            <AccessibleInput
              id="phoneNumber"
              label="Phone Number"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              error={errors.phoneNumber}
              required
              autoComplete="tel"
              placeholder="e.g., (555) 123-4567"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? <Spinner /> : 'Register Now'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ContractorRegistrationPage;

```

### Notes on UI Components:

*   **`AccessibleInput`**: This guide assumes you have a reusable input component that handles labels, errors, and accessibility attributes (`aria-invalid`, `aria-describedby`). If not, create one in `src/components/ui/`.
*   **`Button`**: Uses the existing primary button styles from the design system.
*   **`Spinner`**: A simple SVG or component to indicate loading.

## 6. Routing

To make the new page accessible, add it to your application's router. This is typically done in `src/App.jsx` or a dedicated routing configuration file.

**Example for `react-router-dom`:**

```jsx
// src/App.jsx or your router file

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ContractorRegistrationPage from './pages/ContractorRegistrationPage';

// ... other imports

function App() {
  return (
    <Router>
      <Routes>
        {/* ... other routes */}
        <Route path="/contractor-registration" element={<ContractorRegistrationPage />} />
      </Routes>
    </Router>
  );
}
```

## 7. Error Handling & User Feedback

*   **Validation Errors**: Displayed inline below each input field. The `errors` state object holds the error messages.
*   **Submission Errors**: Handled in the `handleSubmit` function's `try...catch` block. `react-hot-toast` is used to display a user-friendly error message.
*   **Loading State**: The `isLoading` state disables the submit button and shows a spinner to prevent multiple submissions.
*   **Success State**: After a successful submission, the form is replaced with a thank-you message to provide clear feedback to the user.

## 8. Accessibility (A11y) Compliance

*   **Semantic HTML**: The form uses `<form>`, `<label>`, and `<input>` elements correctly.
*   **Labels**: The `AccessibleInput` component should ensure every input has a corresponding, programmatically associated `<label>`.
*   **Error Identification**: When an error occurs, the `AccessibleInput` should use `aria-invalid="true"` and link the error message to the input via `aria-describedby`.
*   **Focus Management**: Standard browser focus management should be sufficient. The focus remains on the submit button during loading and is moved to the success message content after submission.
*   **Keyboard Navigation**: The form is fully navigable and operable using only a keyboard.

## 9. Testing Considerations

### Unit Tests
*   **`ContractorRegistrationPage`**:
    *   Test that the component renders correctly.
    *   Test that validation errors appear for empty or invalid inputs.
    *   Mock the `registerContractor` service to test the form submission logic.
    *   Verify that the success message is displayed after a successful submission.
    *   Verify that the loading state works as expected.
*   **`contractorService`**:
    *   Write tests to verify that the `registerContractor` function calls the correct Firestore methods (`addDoc`) with the correct data.

### Integration Tests
*   Write a test that simulates a user filling out and submitting the form, ensuring the data is correctly written to the Firebase Emulator Suite's Firestore instance.

## 10. Integration Steps Summary

1.  **Create Files**: Add the three new files: `src/models/contractor.ts`, `src/services/firestore/contractorService.ts`, and `src/pages/ContractorRegistrationPage.tsx`.
2.  **Populate Content**: Copy the code from this guide into the respective files.
3.  **Review UI Components**: Ensure you have the necessary reusable UI components (`AccessibleInput`, `Button`, `Spinner`) or create them based on the project's standards.
4.  **Update Router**: Add the new route for `/contractor-registration` to your main router.
5.  **Firestore Rules**: Ensure your Firestore security rules allow for public writes to the `contractors` collection. For example:
    ```
    // firestore.rules
    match /contractors/{contractorId} {
      // Allow anyone to create a registration, but only authenticated
      // admins should be able to read or modify them later.
      allow create: if true;
      allow read, update, delete: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    ```
6.  **Test**: Run your test suite and perform manual testing to verify the entire flow.
