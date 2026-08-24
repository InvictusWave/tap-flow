export type TemplateAspect = 'square' | 'vertical' | 'horizontal';

export type ElementType =
  | 'text'
  | 'qr'
  | 'nfc_icon'
  | 'google_logo'
  | 'stars'
  | 'shape'
  | 'image'
  | 'svg'
  | 'divider_or';

export type NfcIconVariant =
  | 'hand_phone'
  | 'waves'
  | 'phone_outline'
  | 'circular_tap'
  | 'nfc_badge'
  | 'waves_only'
  | 'tap_target_circle'
  | 'custom_svg';

export type QrVariant = 'standard' | 'scan_corners' | 'solid_frame';
export type QrDotStyle = 'square' | 'dots' | 'rounded' | 'classy' | 'classy-rounded' | 'extra-rounded';
export type QrCornerStyle = 'square' | 'dot' | 'extra-rounded';

export interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
  zIndex: number;
  locked?: boolean;
  
  // Content & Styling
  content?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right';
  letterSpacing?: number;
  lineHeight?: number;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  boxShadow?: string;
  
  // Specific to QR
  qrDarkColor?: string;
  qrLightColor?: string;
  qrVariant?: QrVariant;
  qrDotStyle?: QrDotStyle;
  qrCornerStyle?: QrCornerStyle;
  
  // Specific to Stars
  starCount?: number;
  starFilled?: boolean;
  starColor?: string;

  // Specific to NFC & SVG Elements
  iconVariant?: NfcIconVariant;
  isDark?: boolean;
  svgContent?: string; // Raw SVG XML / Path string
}

export interface CustomTemplateData {
  id: string;
  name: string;
  aspect: TemplateAspect;
  width: number;
  height: number;
  background: string;
  elements: CanvasElement[];
  thumbnail?: string;
  createdAt?: number;
  updatedAt?: number;
}
