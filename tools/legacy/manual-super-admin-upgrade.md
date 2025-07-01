# Manual Super Admin Upgrade Guide

## Option 1: Browser Console Method (Recommended)

1. **Navigate to your PropAgentic app** (localhost:3000)
2. **Log in as admin@propagenticai.com**
3. **Open browser developer console** (F12 or Cmd+Opt+I)
4. **Run this JavaScript code** in the console:

```javascript
// Import Firebase functions
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './src/firebase/config.js';

// Update user profile to super_admin
const upgradeToSuperAdmin = async () => {
  try {
    const uid = 'VIkgEcFBXBPMi1dOwzlKlDPJHkm1';
    const userDocRef = doc(db, 'userProfiles', uid);
    
    await updateDoc(userDocRef, {
      role: 'super_admin',
      userType: 'super_admin',
      permissions: [
        'read_users',
        'write_users', 
        'delete_users',
        'read_system_config',
        'write_system_config',
        'read_audit_logs',
        'write_audit_logs',
        'manage_roles',
        'system_maintenance',
        'security_monitoring'
      ],
      updatedAt: new Date().toISOString()
    });
    
    console.log('✅ Successfully upgraded to super_admin!');
    console.log('Please refresh the page to see changes.');
  } catch (error) {
    console.error('❌ Error upgrading:', error);
  }
};

// Run the upgrade
upgradeToSuperAdmin();
```

## Option 2: Firebase Console Method

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: propagentic
3. **Navigate to Firestore Database**
4. **Find collection**: `userProfiles`
5. **Find document**: `VIkgEcFBXBPMi1dOwzlKlDPJHkm1`
6. **Edit the document** and update these fields:
   - `role`: Change to `"super_admin"`
   - `userType`: Change to `"super_admin"`
   - `permissions`: Add array with these values:
     ```
     ["read_users", "write_users", "delete_users", "read_system_config", "write_system_config", "read_audit_logs", "write_audit_logs", "manage_roles", "system_maintenance", "security_monitoring"]
     ```
   - `updatedAt`: Set to current timestamp (ISO string)

## Option 3: Create a Temporary Admin Component

Add this temporary component to your admin dashboard:

```tsx
// Add to AdminDashboardPage.tsx or create a separate component
const SuperAdminUpgrade: React.FC = () => {
  const { userProfile } = useAuth();
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = async () => {
    if (!userProfile?.uid) return;
    
    setIsUpgrading(true);
    try {
      const userDocRef = doc(db, 'userProfiles', userProfile.uid);
      await updateDoc(userDocRef, {
        role: 'super_admin',
        userType: 'super_admin',
        permissions: [
          'read_users', 'write_users', 'delete_users',
          'read_system_config', 'write_system_config',
          'read_audit_logs', 'write_audit_logs',
          'manage_roles', 'system_maintenance', 'security_monitoring'
        ],
        updatedAt: new Date().toISOString()
      });
      
      alert('Upgraded to super_admin! Please refresh the page.');
      window.location.reload();
    } catch (error) {
      console.error('Upgrade failed:', error);
      alert('Upgrade failed: ' + error.message);
    }
    setIsUpgrading(false);
  };

  if (userProfile?.role === 'super_admin') {
    return <div className="text-green-600">✅ Already super admin</div>;
  }

  return (
    <Button onClick={handleUpgrade} disabled={isUpgrading} className="mb-4">
      {isUpgrading ? 'Upgrading...' : 'Upgrade to Super Admin'}
    </Button>
  );
};
```

## After Upgrade

1. **Log out and log back in** (or refresh the page)
2. **Navigate to** `/admin/dashboard`
3. **Verify access** to System Configuration panel
4. **Test all features** including user management

## Expected Result

After successful upgrade, the user profile should have:
- `role: "super_admin"`
- `userType: "super_admin"`
- Full permissions array
- Access to all admin dashboard features 