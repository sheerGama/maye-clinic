// src/assets/placeholders.js
const enc = (s) =>
  `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(s)}`;

export const ph = {
  hero: enc(`
<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="900">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f6efe8"/>
      <stop offset="0.55" stop-color="#e9d6c6"/>
      <stop offset="1" stop-color="#c9a24d"/>
    </linearGradient>
    <filter id="blur" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="25"/>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <circle cx="320" cy="260" r="220" fill="#ffffff" opacity="0.35" filter="url(#blur)"/>
  <circle cx="980" cy="430" r="280" fill="#ffffff" opacity="0.25" filter="url(#blur)"/>
  <circle cx="760" cy="160" r="160" fill="#2e241d" opacity="0.08" filter="url(#blur)"/>
  <text x="80" y="760" font-family="Georgia" font-size="52" fill="#2e241d" opacity="0.75">
    maye-clinic
  </text>
  <text x="80" y="820" font-family="Arial" font-size="22" fill="#2e241d" opacity="0.65">
    Premium Skin & Body Care • Booking • Products
  </text>
</svg>`),

  service: (label = "SERVICE") =>
    enc(`
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f7f1eb"/>
      <stop offset="0.5" stop-color="#ead8c8"/>
      <stop offset="1" stop-color="#d6b27a"/>
    </linearGradient>
    <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#000" flood-opacity="0.12"/>
    </filter>
  </defs>
  <rect width="100%" height="100%" rx="28" fill="url(#g)"/>
  <rect x="70" y="70" width="760" height="420" rx="28" fill="#fff" opacity="0.35" filter="url(#s)"/>
  <circle cx="240" cy="290" r="120" fill="#fff" opacity="0.40"/>
  <circle cx="540" cy="270" r="160" fill="#2e241d" opacity="0.07"/>
  <text x="90" y="610" font-family="Arial" font-size="34" fill="#2e241d" opacity="0.85" letter-spacing="2">
    ${label}
  </text>
</svg>`),

  portfolio: () =>
    enc(`
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f6efe8"/>
      <stop offset="0.6" stop-color="#e7d2c0"/>
      <stop offset="1" stop-color="#c9a24d"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" rx="28" fill="url(#g)"/>
  <path d="M0,640 C180,520 260,780 430,650 C600,520 720,720 900,590 L900,900 L0,900 Z" fill="#ffffff" opacity="0.28"/>
  <path d="M0,520 C160,440 300,600 450,520 C620,430 710,540 900,470 L900,900 L0,900 Z" fill="#2e241d" opacity="0.06"/>
</svg>`),

  specialist: (name = "Specialist") =>
    enc(`
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f3ebe3"/>
      <stop offset="0.55" stop-color="#e6d2c2"/>
      <stop offset="1" stop-color="#c9a24d"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" rx="28" fill="url(#g)"/>
  <circle cx="450" cy="370" r="170" fill="#fff" opacity="0.35"/>
  <circle cx="450" cy="330" r="110" fill="#2e241d" opacity="0.08"/>
  <rect x="220" y="560" width="460" height="70" rx="18" fill="#fff" opacity="0.38"/>
  <text x="240" y="610" font-family="Arial" font-size="28" fill="#2e241d" opacity="0.85">
    ${name}
  </text>
</svg>`),
};
