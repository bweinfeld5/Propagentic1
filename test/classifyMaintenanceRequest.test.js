import { describe, it, expect } from 'vitest';
import { classifyMaintenanceRequest } from '../src/utils/maintenanceUtils';

// Placeholder function for now, replace with actual import
// const classifyMaintenanceRequest = (description) => {
//   if (description.toLowerCase().includes('pipe burst') || description.toLowerCase().includes('major leak')) {
//     return { urgency: 'high', category: 'plumbing' };
//   }
//   if (description.toLowerCase().includes('flickering light')) {
//     return { urgency: 'medium', category: 'electrical' };
//   }
//   return { urgency: 'low', category: 'general' };
// };

describe('classifyMaintenanceRequest()', () => {
  it('flags plumbing leaks like "Pipe burst in kitchen" as high urgency', () => {
    const result = classifyMaintenanceRequest('Pipe burst in kitchen');
    expect(result.urgency).toBe('high');
    expect(result.category).toBe('plumbing');
  });

  it('flags "Major leak in bathroom" as high urgency plumbing issue', () => {
    const result = classifyMaintenanceRequest('Major leak in bathroom');
    expect(result.urgency).toBe('high');
    expect(result.category).toBe('plumbing');
  });

  it('flags "Flickering light in bedroom" as medium urgency electrical issue', () => {
    const result = classifyMaintenanceRequest('Flickering light in bedroom');
    expect(result.urgency).toBe('medium');
    expect(result.category).toBe('electrical');
  });

  it('classifies general requests with low urgency', () => {
    const result = classifyMaintenanceRequest('Squeaky door hinge');
    expect(result.urgency).toBe('low');
    expect(result.category).toBe('general');
  });
});
