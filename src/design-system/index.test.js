import { describe, it, expect } from 'vitest';
import * as designSystem from './index.js';

describe('design-system index.js', () => {
  it('should export DESIGN_SYSTEM_VERSION as a string', () => {
    expect(typeof designSystem.DESIGN_SYSTEM_VERSION).toBe('string');
  });

  it('should export designSystemConfig as an object', () => {
    expect(typeof designSystem.designSystemConfig).toBe('object');
  });

  it('should export cx as a function', () => {
    expect(typeof designSystem.cx).toBe('function');
  });

  it('should export createComponentClasses as a function', () => {
    expect(typeof designSystem.createComponentClasses).toBe('function');
  });

  it('should export designSystemDocs as an object', () => {
    expect(typeof designSystem.designSystemDocs).toBe('object');
  });
}); 