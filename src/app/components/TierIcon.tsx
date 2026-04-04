// DAKER — Tier Icons (SVG-based)
// Each tier has a unique visual identity.

interface TierIconProps {
  tierId: string;
  color: string;
  size?: number;
}

export function TierIcon({ tierId, color, size = 24 }: TierIconProps) {
  const s = size;

  if (tierId === 'script') {
    // </> code brackets
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="1" y="1" width="22" height="22" rx="6" fill={color} fillOpacity="0.12" stroke={color} strokeOpacity="0.4" strokeWidth="1.2" />
        <text x="12" y="16.5" textAnchor="middle" fontSize="10" fontWeight="800" fontFamily="monospace" fill={color}>
          {'</>'}
        </text>
      </svg>
    );
  }

  if (tierId === 'compiler') {
    // Gear / cog
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="1" y="1" width="22" height="22" rx="6" fill={color} fillOpacity="0.12" stroke={color} strokeOpacity="0.4" strokeWidth="1.2" />
        <path
          d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"
          fill={color}
        />
        <path
          d="M11 5h2v1.5l1.2.5.9-1 1.4 1.4-1 .9.5 1.2H18v2h-1.5l-.5 1.2 1 .9-1.4 1.4-.9-1L13 15v1.5h-2V15l-1.2-.5-.9 1-1.4-1.4 1-.9-.5-1.2H6v-2h1.5l.5-1.2-1-.9 1.4-1.4.9 1L11 6.5V5z"
          fill={color}
          fillOpacity="0.75"
        />
      </svg>
    );
  }

  if (tierId === 'debugger') {
    // Magnifying glass with bug dot
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="1" y="1" width="22" height="22" rx="6" fill={color} fillOpacity="0.12" stroke={color} strokeOpacity="0.4" strokeWidth="1.2" />
        <circle cx="10.5" cy="10.5" r="4" stroke={color} strokeWidth="1.8" fill="none" />
        <line x1="14" y1="14" x2="17.5" y2="17.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
        {/* Bug dot */}
        <circle cx="10.5" cy="10.5" r="1.4" fill={color} fillOpacity="0.9" />
        <line x1="8" y1="8" x2="7" y2="7" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
        <line x1="13" y1="8" x2="14" y2="7" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }

  if (tierId === 'architect') {
    // Blueprint diamond with structural lines
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="1" y="1" width="22" height="22" rx="6" fill={color} fillOpacity="0.12" stroke={color} strokeOpacity="0.4" strokeWidth="1.2" />
        {/* Diamond */}
        <path d="M12 5L18 12L12 19L6 12Z" stroke={color} strokeWidth="1.6" fill={color} fillOpacity="0.15" />
        {/* Cross lines */}
        <line x1="6" y1="12" x2="18" y2="12" stroke={color} strokeWidth="0.9" strokeOpacity="0.6" />
        <line x1="12" y1="5" x2="12" y2="19" stroke={color} strokeWidth="0.9" strokeOpacity="0.6" />
        <circle cx="12" cy="12" r="1.5" fill={color} />
      </svg>
    );
  }

  if (tierId === 'kernel') {
    // Flame / core with rays
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="1" y="1" width="22" height="22" rx="6" fill={color} fillOpacity="0.18" stroke={color} strokeOpacity="0.5" strokeWidth="1.2" />
        {/* Outer rays */}
        <circle cx="12" cy="12" r="6" stroke={color} strokeWidth="0.8" strokeOpacity="0.3" fill="none" strokeDasharray="2 2" />
        {/* Flame shape */}
        <path
          d="M12 18c-2.5 0-4.5-2-4.5-4.5 0-1.5.8-2.8 1.8-3.8C10.5 8.5 10 7 10 5.5c1 .5 1.8 1.5 2 2.5.5-.5.8-1.2.8-2 1.2 1 2.2 2.8 2.2 4.5 0 1-.3 1.8-.8 2.5.5-.2.8-.5 1-.8.3 1 .3 2-.2 3-.5 1.3-1.5 2.3-3 2.8z"
          fill={color}
          fillOpacity="0.9"
        />
        <circle cx="12" cy="13.5" r="1.5" fill={color} fillOpacity="0.4" />
      </svg>
    );
  }

  // fallback
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect x="1" y="1" width="22" height="22" rx="6" fill={color} fillOpacity="0.12" stroke={color} strokeOpacity="0.4" strokeWidth="1.2" />
      <circle cx="12" cy="12" r="4" fill={color} fillOpacity="0.6" />
    </svg>
  );
}

// ─── Tier Badge (icon + name inline) ─────────────────────────

interface TierBadgeProps {
  tierId: string;
  tierName: string;
  color: string;
  bgColor: string;
  borderColor: string;
  size?: 'sm' | 'md' | 'lg';
}

export function TierBadge({ tierId, tierName, color, bgColor, borderColor, size = 'md' }: TierBadgeProps) {
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 28 : 20;
  const fontSize = size === 'sm' ? '11px' : size === 'lg' ? '15px' : '13px';
  const padding = size === 'sm' ? '2px 8px 2px 4px' : size === 'lg' ? '6px 14px 6px 8px' : '4px 10px 4px 6px';
  const gap = size === 'sm' ? 4 : 6;

  return (
    <span
      className="inline-flex items-center rounded-xl"
      style={{
        background: bgColor,
        border: `1px solid ${borderColor}`,
        padding,
        gap,
      }}
    >
      <TierIcon tierId={tierId} color={color} size={iconSize} />
      <span style={{ color, fontWeight: 700, fontSize }}>{tierName}</span>
    </span>
  );
}
