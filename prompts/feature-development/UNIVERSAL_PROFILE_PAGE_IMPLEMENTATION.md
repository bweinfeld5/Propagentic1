#what 

This plan outlines the steps to create a universal profile page that can be adapted for all user roles, starting with the landlord.

## 1. Create Universal Profile Page Component

Create a new file `src/pages/UniversalProfilePage.jsx` that will serve as the main profile page for all users. This component will fetch the user's profile and render the appropriate layout and content based on the user's role.

```javascript
// src/pages/UniversalProfilePage.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import ProfileLayout from '../components/profile/ProfileLayout';
import LandlordProfileContent from '../components/landlord/LandlordProfileContent';
// Import other role-specific content components as they are created
// import TenantProfileContent from '../components/tenant/TenantProfileContent';
// import ContractorProfileContent from '../components/contractor/ContractorProfileContent';

const UniversalProfilePage = () => {
  const { userProfile } = useAuth();

  const renderProfileContent = () => {
    switch (userProfile?.userType) {
      case 'landlord':
        return <LandlordProfileContent profile={userProfile} />;
      // case 'tenant':
      //   return <TenantProfileContent profile={userProfile} />;
      // case 'contractor':
      //   return <ContractorProfileContent profile={userProfile} />;
      default:
        return <div>Unknown user role</div>;
    }
  };

  return (
    <ProfileLayout>
      {renderProfileContent()}
    </ProfileLayout>
  );
};

export default UniversalProfilePage;
```

## 2. Create Reusable Profile Layout Component

Create a new file `src/components/profile/ProfileLayout.jsx` to define the shared structure of the profile page. This will include a header, and a content area.

```javascript
// src/components/profile/ProfileLayout.jsx
import React from 'react';
import ProfileHeader from './ProfileHeader';

const ProfileLayout = ({ children }) => {
  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <ProfileHeader />
        <main className="mt-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default ProfileLayout;
```

## 3. Create Landlord-Specific Profile Content Component

Create a new file `src/components/landlord/LandlordProfileContent.jsx` to display landlord-specific information and actions.

```javascript
// src/components/landlord/LandlordProfileContent.jsx
import React from 'react';

const LandlordProfileContent = ({ profile }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Landlord Profile</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p><span className="font-semibold">Name:</span> {profile.displayName}</p>
          <p><span className="font-semibold">Email:</span> {profile.email}</p>
        </div>
        <div>
          <p><span className="font-semibold">Business Name:</span> {profile.businessName || 'N/A'}</p>
          <p><span className="font-semibold">Phone Number:</span> {profile.phoneNumber || 'N/A'}</p>
        </div>
      </div>
      {/* Add more landlord-specific details and actions here */}
    </div>
  );
};

export default LandlordProfileContent;
```

## 4. Create Profile Header Component

Create a new file `src/components/profile/ProfileHeader.jsx` to display the user's primary information.

```javascript
// src/components/profile/ProfileHeader.jsx
import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { UserCircleIcon } from '@heroicons/react/24/solid';

const ProfileHeader = () => {
  const { userProfile } = useAuth();

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center">
        <UserCircleIcon className="h-24 w-24 text-gray-300" />
        <div className="ml-6">
          <h1 className="text-3xl font-bold">{userProfile?.displayName || 'User'}</h1>
          <p className="text-gray-500">{userProfile?.userType}</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
```

## 5. Update Routing in `src/App.jsx`

Add a new route to `src/App.jsx` to render the `UniversalProfilePage`.

```javascript
// src/App.jsx

// ... other imports
import UniversalProfilePage from './pages/UniversalProfilePage';

// ... inside the Router component
<Route path="/u/profile" element={<PrivateRoute><UniversalProfilePage /></PrivateRoute>} />
```
