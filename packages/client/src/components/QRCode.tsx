import { QRCodeSVG } from 'qrcode.react';

interface QRCodeProps {
  value: string;
  size?: number;
}

export function QRCode({ value, size = 148 }: QRCodeProps) {
  return (
    <QRCodeSVG
      value={value}
      size={size}
      bgColor="#ffffff"
      fgColor="#111111"
      style={{ borderRadius: 12, display: 'block' }}
    />
  );
}
