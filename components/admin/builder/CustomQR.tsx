import React, { useEffect, useRef, useState } from 'react';

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
  dotStyle?: string;
  cornerStyle?: string;
  color?: string;
  width?: number;
  height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    let qrCode: any;
    
    const renderQR = async () => {
      try {
        const QRCodeStyling = (await import('qr-code-styling')).default;
        qrCode = new QRCodeStyling({
          width,
          height,
          type: 'svg',
          data,
          margin: 0,
          qrOptions: { errorCorrectionLevel: 'H' },
          dotsOptions: { color, type: dotStyle as any },
          cornersSquareOptions: { color, type: cornerStyle as any },
          cornersDotOptions: { color, type: cornerStyle === 'extra-rounded' ? 'dot' : (cornerStyle as any) },
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
