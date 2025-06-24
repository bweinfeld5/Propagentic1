import QRCode from 'qrcode';

/**
 * QR Code generation options interface
 */
export interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  quality?: number;
}

/**
 * Invite QR code result interface
 */
export interface InviteQRResult {
  dataUrl: string;
  svg: string;
  inviteUrl: string;
  qrCodeId: string;
}

/**
 * QR Code style presets
 */
export type QRStyle = 'minimal' | 'branded' | 'artistic';

/**
 * PropAgentic QR Code Service
 * Handles generation of QR codes for invite codes with PropAgentic branding
 */
export class QRCodeService {
  private baseUrl: string;
  private defaultOptions: QRCodeOptions;

  constructor() {
    this.baseUrl = process.env.REACT_APP_QR_BASE_URL || 'https://propagentic.com';
    this.defaultOptions = {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M',
      quality: 0.92
    };
  }

  /**
   * Generate QR code for invite codes
   * Creates both PNG and SVG versions with invite URL
   */
  async generateInviteQR(
    inviteCode: string, 
    propertyName: string,
    options?: Partial<QRCodeOptions>
  ): Promise<InviteQRResult> {
    try {
      const inviteUrl = `${this.baseUrl}/invite/${inviteCode}`;
      const qrOptions = { ...this.defaultOptions, ...options };
      
      // Generate PNG data URL - using proper interface
      const dataUrl = await QRCode.toDataURL(inviteUrl, {
        width: qrOptions.width,
        margin: qrOptions.margin,
        color: qrOptions.color,
        errorCorrectionLevel: qrOptions.errorCorrectionLevel
      });
      
      // Generate SVG string - using proper type and interface
      const svg = await QRCode.toString(inviteUrl, {
        type: 'svg',
        width: qrOptions.width,
        margin: qrOptions.margin,
        color: qrOptions.color,
        errorCorrectionLevel: qrOptions.errorCorrectionLevel
      });

      const qrCodeId = `qr-${inviteCode}-${Date.now()}`;

      return {
        dataUrl,
        svg,
        inviteUrl,
        qrCodeId
      };
    } catch (error: any) {
      console.error('Error generating invite QR code:', error);
      throw new Error(`Failed to generate QR code for invite ${inviteCode}: ${error.message}`);
    }
  }

  /**
   * Generate QR code with custom styling based on preset
   */
  async generateStyledQR(
    data: string, 
    style: QRStyle = 'minimal',
    customOptions?: Partial<QRCodeOptions>
  ): Promise<string> {
    let styleOptions: QRCodeOptions;

    switch (style) {
      case 'branded':
        styleOptions = {
          ...this.defaultOptions,
          width: 250,
          margin: 3,
          color: {
            dark: '#ea580c', // PropAgentic orange
            light: '#fff7ed'  // Light orange background
          }
        };
        break;
      
      case 'artistic':
        styleOptions = {
          ...this.defaultOptions,
          width: 300,
          margin: 4,
          color: {
            dark: '#dc2626', // Red accent
            light: '#fef2f2'  // Light red background
          }
        };
        break;
      
      case 'minimal':
      default:
        styleOptions = this.defaultOptions;
        break;
    }

    const finalOptions = { ...styleOptions, ...customOptions };

    try {
      return await QRCode.toDataURL(data, {
        width: finalOptions.width,
        margin: finalOptions.margin,
        color: finalOptions.color,
        errorCorrectionLevel: finalOptions.errorCorrectionLevel
      });
    } catch (error: any) {
      console.error('Error generating styled QR code:', error);
      throw new Error(`Failed to generate styled QR code: ${error.message}`);
    }
  }

  /**
   * Generate downloadable QR code as Blob
   */
  async generateDownloadableQR(
    inviteCode: string, 
    format: 'png' | 'svg' = 'png',
    options?: Partial<QRCodeOptions>
  ): Promise<Blob> {
    try {
      const inviteUrl = `${this.baseUrl}/invite/${inviteCode}`;
      const qrOptions = { 
        ...this.defaultOptions, 
        ...options
      };

      if (format === 'png') {
        // Generate PNG buffer and convert to Blob
        const buffer = await QRCode.toBuffer(inviteUrl, {
          width: qrOptions.width,
          margin: qrOptions.margin,
          color: qrOptions.color,
          errorCorrectionLevel: qrOptions.errorCorrectionLevel
        });
        return new Blob([buffer], { type: 'image/png' });
      } else {
        // Generate SVG string and convert to Blob
        const svgString = await QRCode.toString(inviteUrl, {
          type: 'svg',
          width: qrOptions.width,
          margin: qrOptions.margin,
          color: qrOptions.color,
          errorCorrectionLevel: qrOptions.errorCorrectionLevel
        });
        return new Blob([svgString], { type: 'image/svg+xml' });
      }
    } catch (error: any) {
      console.error('Error generating downloadable QR code:', error);
      throw new Error(`Failed to generate downloadable QR code: ${error.message}`);
    }
  }

  /**
   * Generate QR code for property flyer/marketing materials
   */
  async generatePropertyQR(
    inviteCode: string,
    propertyName: string,
    propertyAddress: string,
    options?: Partial<QRCodeOptions>
  ): Promise<InviteQRResult> {
    const enhancedOptions = {
      ...this.defaultOptions,
      width: 250,
      margin: 3,
      color: {
        dark: '#ea580c', // PropAgentic orange
        light: '#ffffff'
      },
      ...options
    };

    return this.generateInviteQR(inviteCode, propertyName, enhancedOptions);
  }

  /**
   * Validate QR code content matches expected format
   */
  validateInviteQR(scannedData: string): {
    isValid: boolean;
    inviteCode?: string;
    error?: string;
  } {
    try {
      // Check if it's a valid PropAgentic invite URL
      const inviteUrlPattern = new RegExp(`^${this.baseUrl}/invite/([A-Z0-9]{6,12})$`);
      const match = scannedData.match(inviteUrlPattern);

      if (match) {
        return {
          isValid: true,
          inviteCode: match[1]
        };
      }

      // Also check for direct invite code format
      const codePattern = /^[A-Z0-9]{6,12}$/;
      if (codePattern.test(scannedData)) {
        return {
          isValid: true,
          inviteCode: scannedData
        };
      }

      return {
        isValid: false,
        error: 'QR code does not contain a valid PropAgentic invite code'
      };
    } catch (error: any) {
      return {
        isValid: false,
        error: `Error validating QR code: ${error.message}`
      };
    }
  }

  /**
   * Generate batch QR codes for multiple invite codes
   */
  async generateBatchQR(
    inviteCodes: string[],
    propertyNames: string[],
    options?: Partial<QRCodeOptions>
  ): Promise<InviteQRResult[]> {
    if (inviteCodes.length !== propertyNames.length) {
      throw new Error('Invite codes and property names arrays must have the same length');
    }

    const results: InviteQRResult[] = [];
    
    for (let i = 0; i < inviteCodes.length; i++) {
      try {
        const result = await this.generateInviteQR(
          inviteCodes[i],
          propertyNames[i],
          options
        );
        results.push(result);
      } catch (error) {
        console.error(`Error generating QR for code ${inviteCodes[i]}:`, error);
        // Continue with other codes even if one fails
      }
    }

    return results;
  }

  /**
   * Get QR code analytics data
   */
  getQRAnalytics(qrCodeId: string): {
    generatedAt: Date;
    scans: number;
    lastScanned?: Date;
  } {
    // Placeholder for analytics - would integrate with actual analytics service
    return {
      generatedAt: new Date(),
      scans: 0
    };
  }

  /**
   * Update base URL for QR generation (useful for environment switching)
   */
  updateBaseUrl(newBaseUrl: string): void {
    this.baseUrl = newBaseUrl;
  }
}

// Export singleton instance
export const qrCodeService = new QRCodeService();

// Export class for testing/custom instances
export default QRCodeService; 