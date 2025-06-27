declare module 'qr-code-styling' {
  interface QRCodeStylingOptions {
    width?: number;
    height?: number;
    data?: string;
    image?: string;
    margin?: number;
    qrOptions?: {
      typeNumber?: number;
      mode?: string;
      errorCorrectionLevel?: string;
    };
    imageOptions?: {
      hideBackgroundDots?: boolean;
      imageSize?: number;
      crossOrigin?: string;
      margin?: number;
    };
    dotsOptions?: {
      color?: string;
      gradient?: any;
      type?: string;
    };
    backgroundOptions?: {
      color?: string;
      gradient?: any;
    };
    cornersSquareOptions?: {
      color?: string;
      gradient?: any;
      type?: string;
    };
    cornersDotOptions?: {
      color?: string;
      gradient?: any;
      type?: string;
    };
  }

  export default class QRCodeStyling {
    constructor(options?: QRCodeStylingOptions);
    append(element: HTMLElement): void;
    update(options: QRCodeStylingOptions): void;
    download(options?: { name?: string; extension?: string }): void;
    getRawData(extension?: string): Promise<Blob>;
  }
} 