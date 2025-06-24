import { auth } from '../firebase/config';

/**
 * Local invite code service for development/testing
 * This bypasses Firebase Functions to avoid CORS issues during development
 */

interface InviteCodeData {
  code: string;
  propertyId: string;
  createdAt: number;
  expiresAt: number;
  landlordId: string;
}

class InviteCodeServiceLocal {
  private codes: Map<string, InviteCodeData> = new Map();

  /**
   * Generate a demo invite code for testing
   */
  async generateInviteCode(propertyId: string, expirationDays: number = 7): Promise<{ success: boolean; code: string; data?: InviteCodeData }> {
    console.log('🔧 Local invite code service: generating code for property', propertyId);

    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated');
    }

    // Generate a unique code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Make sure code is unique
    while (this.codes.has(code)) {
      code = '';
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }

    const now = Date.now();
    const expiresAt = now + (expirationDays * 24 * 60 * 60 * 1000);

    const inviteData: InviteCodeData = {
      code,
      propertyId,
      createdAt: now,
      expiresAt,
      landlordId: currentUser.uid
    };

    // Store in memory (for demo purposes)
    this.codes.set(code, inviteData);

    console.log('✅ Local invite code generated:', code);

    return {
      success: true,
      code,
      data: inviteData
    };
  }

  /**
   * Validate an invite code
   */
  async validateInviteCode(code: string): Promise<{ valid: boolean; data?: InviteCodeData; message?: string }> {
    const inviteData = this.codes.get(code);
    
    if (!inviteData) {
      return { valid: false, message: 'Invite code not found' };
    }

    if (Date.now() > inviteData.expiresAt) {
      return { valid: false, message: 'Invite code has expired' };
    }

    return { valid: true, data: inviteData };
  }

  /**
   * Get all codes for current user (for debugging)
   */
  getAllCodes(): InviteCodeData[] {
    const currentUser = auth.currentUser;
    if (!currentUser) return [];

    return Array.from(this.codes.values()).filter(
      code => code.landlordId === currentUser.uid
    );
  }

  /**
   * Clear all codes (for testing)
   */
  clearAllCodes(): void {
    this.codes.clear();
    console.log('🔧 All local invite codes cleared');
  }
}

// Export singleton instance
export const inviteCodeServiceLocal = new InviteCodeServiceLocal();
export default inviteCodeServiceLocal; 