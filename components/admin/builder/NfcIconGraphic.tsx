import type { NfcIconVariant } from '@/types/template-builder';

interface Props {
  variant?: NfcIconVariant;
  color?: string;
  className?: string;
}

export default function NfcIconGraphic({
  variant = 'hand_phone',
  color = 'currentColor',
  className = 'w-full h-full',
}: Props) {
  const common = {
    fill: 'none',
    stroke: color,
    strokeWidth: 4,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (variant) {
    case 'hand_phone':
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <rect x="38" y="6" width="42" height="64" rx="9" fill={color} opacity="0.08" />
          <rect x="38" y="6" width="42" height="64" rx="9" {...common} />
          <path d="M52 14h14M56 61h6" {...common} />
          <path d="M48 38c6-6 16-6 22 0M52 44c4-4 10-4 14 0" {...common} />
          <path d="M16 87V61c0-5 8-5 8 0v10-17c0-5 8-5 8 0v17-11c0-5 8-5 8 0v12-7c0-5 8-5 8 0v11l7-7c4-4 10 2 6 6L49 87c-3 3-7 4-11 4H24c-4 0-8-2-8-4Z" fill={color} opacity="0.1" />
          <path d="M16 87V61c0-5 8-5 8 0v10-17c0-5 8-5 8 0v17-11c0-5 8-5 8 0v12-7c0-5 8-5 8 0v11l7-7c4-4 10 2 6 6L49 87c-3 3-7 4-11 4H24c-4 0-8-2-8-4Z" {...common} />
        </svg>
      );

    case 'circular_tap':
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <circle cx="48" cy="48" r="36" fill={color} opacity="0.08" />
          <path d="M22 27A36 36 0 0 1 80 40M74 29l6 11-12 2" {...common} />
          <path d="M74 69A36 36 0 0 1 16 56M22 67l-6-11 12-2" {...common} />
          <path d="M39 37c7 6 7 16 0 22M48 31c12 9 12 25 0 34M57 25c17 13 17 33 0 46" {...common} />
          <circle cx="32" cy="48" r="3" fill={color} stroke="none" />
        </svg>
      );

    case 'phone_outline':
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <rect x="27" y="7" width="42" height="82" rx="10" fill={color} opacity="0.08" />
          <rect x="27" y="7" width="42" height="82" rx="10" {...common} />
          <path d="M42 15h12M44 80h8" {...common} />
          <path d="M39 42c6-6 12-6 18 0M35 35c10-10 22-10 26 0M31 28c14-14 30-14 34 0" {...common} />
          <circle cx="48" cy="49" r="3" fill={color} stroke="none" />
        </svg>
      );

    case 'nfc_badge':
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <rect x="9" y="9" width="78" height="78" rx="20" fill={color} opacity="0.08" />
          <rect x="9" y="9" width="78" height="78" rx="20" {...common} />
          <path d="M29 55a12 12 0 0 1 12 12M29 44a23 23 0 0 1 23 23M29 33a34 34 0 0 1 34 34" {...common} />
          <circle cx="29" cy="67" r="4" fill={color} stroke="none" />
        </svg>
      );

    case 'waves_only':
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <circle cx="22" cy="48" r="4" fill={color} stroke="none" />
          <path d="M31 37c8 6 8 16 0 22M42 29c14 10 14 28 0 38M53 20c21 16 21 40 0 56M64 12c28 21 28 51 0 72" {...common} />
        </svg>
      );

    case 'n_mark':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          {/* N-Mark by Leonid Tsvetkov, CC Attribution: https://www.figma.com/@Leonid */}
          <path fillRule="evenodd" clipRule="evenodd" d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12ZM8.66859 7.93767C8.64917 7.75318 8.54474 7.58024 8.3718 7.48038C8.26596 7.41928 8.14923 7.39408 8.03574 7.40102C7.91551 7.39374 7.79193 7.42249 7.682 7.4912C7.50792 7.6 7.4089 7.78346 7.4005 7.97413C6.74423 9.21292 6.4 10.5949 6.4 12C6.4 13.5096 6.79737 14.9926 7.55218 16.3C7.71787 16.587 8.08482 16.6853 8.3718 16.5196C8.65877 16.3539 8.7571 15.987 8.59141 15.7C7.94193 14.5751 7.6 13.299 7.6 12C7.6 11.0746 7.77352 10.1609 8.10815 9.30511L12.3314 16.0623C12.3508 16.2468 12.4553 16.4198 12.6282 16.5196C12.734 16.5807 12.8508 16.6059 12.9643 16.599C13.0845 16.6063 13.2081 16.5775 13.318 16.5088C13.4921 16.4 13.5911 16.2165 13.5995 16.0259C14.2558 14.7871 14.6 13.4051 14.6 12C14.6 10.4904 14.2026 9.00737 13.4478 7.7C13.2821 7.41302 12.9152 7.3147 12.6282 7.48038C12.3412 7.64607 12.2429 8.01302 12.4086 8.3C13.0581 9.42494 13.4 10.701 13.4 12C13.4 12.9254 13.2265 13.8391 12.8919 14.6949L8.66859 7.93767ZM16.0067 6.8C15.841 6.51302 15.9393 6.14607 16.2263 5.98038C16.5133 5.8147 16.8802 5.91302 17.0459 6.2C18.064 7.96342 18.6 9.96377 18.6 12C18.6 14.0362 18.064 16.0366 17.0459 17.8C16.8802 18.087 16.5133 18.1853 16.2263 18.0196C15.9393 17.8539 15.841 17.487 16.0067 17.2C16.9195 15.619 17.4 13.8256 17.4 12C17.4 10.1744 16.9195 8.381 16.0067 6.8Z" fill={color} />
        </svg>
      );

    case 'tap_target_circle':
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <circle cx="48" cy="48" r="40" fill={color} opacity="0.06" />
          <circle cx="48" cy="48" r="40" stroke={color} strokeWidth="3" fill="none" opacity="0.45" />
          <circle cx="48" cy="48" r="27" {...common} />
          <circle cx="48" cy="48" r="7" fill={color} stroke="none" />
          <path d="M48 13v7M48 76v7M13 48h7M76 48h7" {...common} />
        </svg>
      );

    default:
      return null;
  }
}
