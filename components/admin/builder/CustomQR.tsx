import React, { useEffect, useRef } from 'react';
import type QRCodeStyling from 'qr-code-styling';
import type { CornerDotType, CornerSquareType, DotType } from 'qr-code-styling';

// We dynamically import to avoid SSR issues with canvas/window
export default function CustomQR({ 
  data, 
  dotStyle = 'square', 
  cornerStyle = 'square',
  color = '#000000',
  width = 200,
  height = 200,
}: { 
  data: string;
  dotStyle?: DotType;
  cornerStyle?: CornerSquareType;
  color?: string;
  width?: number;
  height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    let qrCode: QRCodeStyling;
    
    const renderQR = async () => {
      try {
        const QRCodeStyling = (await import('qr-code-styling')).default;
        const cornerDotStyle: CornerDotType = cornerStyle === 'extra-rounded' ? 'dot' : cornerStyle;
        qrCode = new QRCodeStyling({
          width,
          height,
          type: 'svg',
          data,
          margin: 0,
          qrOptions: { errorCorrectionLevel: 'H' },
          dotsOptions: { color, type: dotStyle },
          cornersSquareOptions: { color, type: cornerStyle },
          cornersDotOptions: { color, type: cornerDotStyle },
          backgroundOptions: { color: 'transparent' },
        });
        
        if (ref.current) {
          ref.current.innerHTML = '';
          qrCode.append(ref.current);
          
          // Make the generated SVG scale nicely
          const svg = ref.current.querySelector('svg');
          if (svg) {
            svg.style.width = '100%';
            svg.style.height = '100%';
          }
        }
      } catch (err) {
        console.error('Failed to render QR Code', err);
      }
    };
    
    renderQR();
  }, [data, dotStyle, cornerStyle, color, width, height]);

  return <div ref={ref} className="w-full h-full flex items-center justify-center pointer-events-none" />;
}
