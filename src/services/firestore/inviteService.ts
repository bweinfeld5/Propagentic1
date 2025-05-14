import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc,
  query,
  where,
  Timestamp,
  deleteDoc,
  onSnapshot,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Invite } from '../../models/schema';
import { inviteConverter, createNewInvite } from '../../models/converters';
import dataService from '../dataService'; // To get current user info

// Define role type inline
type InviteRole = 'tenant' | 'contractor';

// Collection references
const invitesCollection = collection(db, 'invites').withConverter(inviteConverter);

/**
 * Get an invite by ID
 */
export async function getInviteById(inviteId: string): Promise<Invite | null> {
  const inviteDoc = doc(db, 'invites', inviteId).withConverter(inviteConverter);
  const inviteSnapshot = await getDoc(inviteDoc);
  
  if (inviteSnapshot.exists()) {
    return inviteSnapshot.data();
  }
  
  return null;
}

/**
 * Get all invites sent by a landlord
 */
export async function getLandlordInvites(landlordId: string): Promise<Invite[]> {
  const q = query(invitesCollection, where('landlordId', '==', landlordId));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => doc.data());
}

/**
 * Get invite by email
 */
export async function getInviteByEmail(email: string): Promise<Invite | null> {
  const q = query(invitesCollection, where('tenantEmail', '==', email), where('status', '==', 'pending'));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].data();
  }
  
  return null;
}

/**
 * Get all *pending* invites for a specific tenant email.
 * This is what the tenant dashboard will use.
 */
export async function getPendingInvitesForTenant(tenantEmail: string): Promise<Invite[]> {
  if (!tenantEmail) {
    console.log("getPendingInvitesForTenant: No email provided.");
    return [];
  }
  console.log(`Fetching pending invites for email: ${tenantEmail}`);
  const q = query(
    invitesCollection, 
    where('tenantEmail', '==', tenantEmail), 
    where('status', '==', 'pending')
  );
  
  try {
    const querySnapshot = await getDocs(q);
    const invites = querySnapshot.docs.map(doc => doc.data());
    console.log(`Found ${invites.length} pending invites for ${tenantEmail}`);
    return invites;
  } catch (error) {
    console.error("Error fetching pending invites for tenant:", error);
    throw new Error("Failed to fetch pending invitations.");
  }
}

/**
 * Create a new tenant invite
 */
export async function createTenantInvite(
  email: string,
  landlordId: string,
  propertyId: string,
  unitNumber: string
): Promise<Invite> {
  // Check if an invite already exists for this email
  const existingInvite = await getInviteByEmail(email);
  
  if (existingInvite) {
    // Update the existing invite if it's for the same landlord
    if (existingInvite.landlordId === landlordId) {
      await updateInvite(existingInvite.inviteId, {
        propertyId,
        unitNumber,
        status: 'pending',
        expiresAt: new Timestamp(
          Timestamp.now().seconds + 7 * 24 * 60 * 60,
          Timestamp.now().nanoseconds
        )
      });
      
      return {
        ...existingInvite,
        propertyId,
        unitNumber,
        status: 'pending',
        expiresAt: new Timestamp(
          Timestamp.now().seconds + 7 * 24 * 60 * 60,
          Timestamp.now().nanoseconds
        )
      };
    }
  }
  
  // Create a new invite
  const inviteRef = doc(collection(db, 'invites'));
  const inviteId = inviteRef.id;
  
  const inviteData = createNewInvite(
    inviteId,
    email,
    'tenant',
    landlordId,
    propertyId,
    unitNumber
  );
  
  await setDoc(inviteRef, inviteData);
  
  // Add the invite to the landlord's profile
  const landlordProfileRef = doc(db, 'landlordProfiles', landlordId);
  const landlordProfileSnapshot = await getDoc(landlordProfileRef);
  
  if (landlordProfileSnapshot.exists()) {
    const invitesSent = landlordProfileSnapshot.data().invitesSent || [];
    await updateDoc(landlordProfileRef, {
      invitesSent: [
        ...invitesSent,
        {
          email,
          status: 'pending',
          propertyId,
          unit: unitNumber,
          timestamp: Timestamp.now()
        }
      ]
    });
  }
  
  return inviteData;
}

/**
 * Create a new contractor invite
 */
export async function createContractorInvite(
  email: string,
  landlordId: string
): Promise<Invite> {
  // Check if an invite already exists for this email
  const existingInvite = await getInviteByEmail(email);
  
  if (existingInvite) {
    // Update the existing invite if it's for the same landlord
    if (existingInvite.landlordId === landlordId) {
      await updateInvite(existingInvite.inviteId, {
        status: 'pending',
        expiresAt: new Timestamp(
          Timestamp.now().seconds + 7 * 24 * 60 * 60,
          Timestamp.now().nanoseconds
        )
      });
      
      return {
        ...existingInvite,
        status: 'pending',
        expiresAt: new Timestamp(
          Timestamp.now().seconds + 7 * 24 * 60 * 60,
          Timestamp.now().nanoseconds
        )
      };
    }
  }
  
  // Create a new invite
  const inviteRef = doc(collection(db, 'invites'));
  const inviteId = inviteRef.id;
  
  const inviteData = createNewInvite(
    inviteId,
    email,
    'contractor',
    landlordId
  );
  
  await setDoc(inviteRef, inviteData);
  
  // Add the invite to the landlord's profile
  const landlordProfileRef = doc(db, 'landlordProfiles', landlordId);
  const landlordProfileSnapshot = await getDoc(landlordProfileRef);
  
  if (landlordProfileSnapshot.exists()) {
    const invitesSent = landlordProfileSnapshot.data().invitesSent || [];
    await updateDoc(landlordProfileRef, {
      invitesSent: [
        ...invitesSent,
        {
          email,
          status: 'pending',
          timestamp: Timestamp.now()
        }
      ]
    });
  }
  
  return inviteData;
}

/**
 * Update an invite
 */
export async function updateInvite(
  inviteId: string,
  updateData: Partial<Invite>
): Promise<void> {
  const inviteRef = doc(db, 'invites', inviteId);
  await updateDoc(inviteRef, updateData);
}

/**
 * Mark an invite as accepted
 */
export async function acceptInvite(inviteId: string, userId: string): Promise<void> {
  const inviteRef = doc(db, 'invites', inviteId);
  const inviteSnapshot = await getDoc(inviteRef);
  
  if (inviteSnapshot.exists()) {
    const invite = inviteSnapshot.data();
    
    // Update the invite
    await updateDoc(inviteRef, {
      status: 'accepted'
    });
    
    // Also update the landlord's profile
    if (invite.landlordId) {
      const landlordProfileRef = doc(db, 'landlordProfiles', invite.landlordId);
      const landlordProfileSnapshot = await getDoc(landlordProfileRef);
      
      if (landlordProfileSnapshot.exists()) {
        const invitesSent = landlordProfileSnapshot.data().invitesSent || [];
        const updatedInvites = invitesSent.map((sentInvite: any) => {
          if (sentInvite.email === invite.email) {
            return {
              ...sentInvite,
              status: 'accepted'
            };
          }
          return sentInvite;
        });
        
        await updateDoc(landlordProfileRef, {
          invitesSent: updatedInvites
        });
        
        // If this is a tenant invite, also update the tenants array
        if (invite.role === 'tenant') {
          const tenants = landlordProfileSnapshot.data().tenants || [];
          
          if (!tenants.includes(userId)) {
            await updateDoc(landlordProfileRef, {
              tenants: [...tenants, userId]
            });
          }
        }
        
        // If this is a contractor invite, also update the contractors array
        if (invite.role === 'contractor') {
          const contractors = landlordProfileSnapshot.data().contractors || [];
          
          if (!contractors.includes(userId)) {
            await updateDoc(landlordProfileRef, {
              contractors: [...contractors, userId]
            });
          }
        }
      }
    }
  }
}

/**
 * Delete an invite
 */
export async function deleteInvite(inviteId: string): Promise<void> {
  const inviteRef = doc(db, 'invites', inviteId);
  const inviteSnapshot = await getDoc(inviteRef);
  
  if (inviteSnapshot.exists()) {
    const invite = inviteSnapshot.data();
    
    // Delete the invite
    await deleteDoc(inviteRef);
    
    // Also update the landlord's profile
    if (invite.landlordId) {
      const landlordProfileRef = doc(db, 'landlordProfiles', invite.landlordId);
      const landlordProfileSnapshot = await getDoc(landlordProfileRef);
      
      if (landlordProfileSnapshot.exists()) {
        const invitesSent = landlordProfileSnapshot.data().invitesSent || [];
        const updatedInvites = invitesSent.filter(
          (sentInvite: any) => sentInvite.email !== invite.email
        );
        
        await updateDoc(landlordProfileRef, {
          invitesSent: updatedInvites
        });
      }
    }
  }
}

interface InviteData {
    propertyId: string;
    tenantEmail: string;
    propertyName?: string; // Optional but good for notifications
    landlordName?: string; // Optional but good for notifications
}

const inviteService = {
    /**
     * Creates an invitation record in Firestore.
     * This triggers the createNotificationOnInvite cloud function.
     * @param inviteDetails - Object containing propertyId and tenantEmail.
     */
    async createInvite({ propertyId, tenantEmail, propertyName = 'a property', landlordName = 'Your Landlord' }: InviteData): Promise<string> {
        const currentUser = dataService.currentUser; // Get user from configured dataService
        if (!currentUser) {
            throw new Error("User must be authenticated to create an invite.");
        }
        if (!propertyId || !tenantEmail) {
            throw new Error("Property ID and Tenant Email are required.");
        }

        const landlordUid = currentUser.uid;
        const lowerCaseEmail = tenantEmail.toLowerCase(); // Normalize email

        console.log(`Creating invite for ${lowerCaseEmail} to property ${propertyId} by landlord ${landlordUid}`);

        // Optional: Check if a pending invite already exists for this email/property
        try {
             const invitesRef = collection(db, 'invites');
             const q = query(invitesRef,
                 where('propertyId', '==', propertyId),
                 where('tenantEmail', '==', lowerCaseEmail),
                 where('status', '==', 'pending')
             );
             const existingInvitesSnap = await getDocs(q);
             if (!existingInvitesSnap.empty) {
                 console.warn(`Pending invite already exists for ${lowerCaseEmail} to property ${propertyId}`);
                 // You might want to throw an error or return the existing invite ID
                 // throw new Error("A pending invitation already exists for this tenant and property.");
                 return existingInvitesSnap.docs[0].id; // Or just return existing ID
             }
        } catch (checkError) {
             console.error("Error checking for existing invites:", checkError);
             // Decide if this should prevent creating a new invite
        }


        const inviteData = {
            propertyId: propertyId,
            tenantEmail: lowerCaseEmail,
            landlordId: landlordUid,
            status: 'pending',
            createdAt: serverTimestamp(),
            // Include names if provided, helps the notification trigger
            propertyName: propertyName,
            landlordName: landlordName || currentUser.displayName || 'Your Landlord',
        };

        try {
            const invitesCollection = collection(db, 'invites');
            const docRef = await addDoc(invitesCollection, inviteData);
            console.log('Invite record created successfully in Firestore with ID:', docRef.id);
            return docRef.id; // Return the new invite ID
        } catch (err: unknown) {
            console.error("Error creating invite record:", err);
            // Normalize unknown error to string message
            const errorMessage = err instanceof Error ? err.message : String(err);
            throw new Error(`Failed to create invitation record: ${errorMessage}`);
        }
    }
};

export default inviteService; 