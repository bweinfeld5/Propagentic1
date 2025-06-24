declare module 'qr-code-styling' {
  export interface QRCodeStylingOptions {
    width?: number;
    height?: number;
    type?: 'canvas' | 'svg';
    data?: string;
    image?: string;
    dotsOptions?: {
      color?: string;
      type?: 'rounded' | 'dots' | 'classy' | 'classy-rounded' | 'square' | 'extra-rounded';
    };
    backgroundOptions?: {
      color?: string;
    };
    imageOptions?: {
      crossOrigin?: string;
      margin?: number;
    };
    margin?: number;
    qrOptions?: {
      typeNumber?: number;
      mode?: 'Numeric' | 'Alphanumeric' | 'Byte' | 'Kanji';
      errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    };
    cornersSquareOptions?: {
      color?: string;
      type?: 'dot' | 'square' | 'extra-rounded';
    };
    cornersDotOptions?: {
      color?: string;
      type?: 'dot' | 'square';
    };
  }

  export default class QRCodeStyling {
    constructor(options?: QRCodeStylingOptions);
    append(container: HTMLElement): void;
    getRawData(extension?: string): Promise<Blob | null>;
    download(options?: { name?: string; extension?: string }): Promise<void>;
    update(options: QRCodeStylingOptions): void;
  }
} 