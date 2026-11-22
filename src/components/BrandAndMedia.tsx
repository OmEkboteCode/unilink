import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Briefcase,
  Calculator,
  Calendar,
  CheckCircle2,
  Clock,
  Cpu,
  CreditCard,
  KeyRound,
  Package,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trophy,
  Users,
  XCircle,
} from 'lucide-react';

export function UniLinkLogo({
  variant = 'dark',
}: {
  variant?: 'dark' | 'light';
}) {
  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0">
      <svg
        width="28"
        height="28"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect width="32" height="32" rx="8" fill="#0F1A38" />
        <circle cx="10" cy="11" r="3.2" fill="#0D9488" />
        <circle cx="22" cy="11" r="3.2" fill="#F59E0B" />
        <circle cx="16" cy="22" r="3.2" fill="#F45B7A" />
        <path
          d="M12.2 12.6L16 19.5M19.8 12.6L16 19.5M13.2 11H18.8"
          stroke="white"
          strokeOpacity="0.45"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
      <span
        className={`font-display text-lg font-bold tracking-tight ${
          variant === 'light' ? 'text-white' : 'text-[#0F1A38]'
        }`}
      >
        UniLink
      </span>
    </span>
  );
}

export function UserAvatar({
  photoUrl,
  name,
  email,
  size = 'sm',
  variant = 'dark',
}: {
  photoUrl?: string;
  name?: string;
  email?: string | null;
  size?: 'sm' | 'lg';
  variant?: 'dark' | 'light';
}) {
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setErrored(false);
  }, [photoUrl]);

  const initials = (name || email || 'U').trim().slice(0, 2).toUpperCase();
  const dimensions = size === 'lg' ? 'w-16 h-16 text-lg' : 'w-9 h-9 text-xs';
  const fallbackSurface =
    variant === 'light'
      ? 'bg-white/15 text-white border border-white/15'
      : 'bg-[#0F1A38] text-white border border-slate-200';
  const imgBorder = variant === 'light' ? 'border-white/20' : 'border-slate-200';

  if (photoUrl && !errored) {
    return (
      <img
        src={photoUrl}
        alt={name || 'Profile avatar'}
        referrerPolicy="no-referrer"
        onError={() => setErrored(true)}
        className={`${dimensions} rounded-full object-cover border ${imgBorder} shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${dimensions} rounded-full ${fallbackSurface} flex items-center justify-center font-display font-bold shrink-0`}
      aria-label={name || 'Profile avatar'}
    >
      {initials}
    </div>
  );
}

function getCategoryIcon(category: string) {
  switch (category) {
    case 'ID & Cards':
      return CreditCard;
    case 'Electronics':
      return Smartphone;
    case 'Books & Notes':
      return BookOpen;
    case 'Calculators':
      return Calculator;
    case 'Lab Kits':
    case 'Lab Gear':
      return Cpu;
    case 'Keys & Wallets':
      return KeyRound;
    case 'Tech & Hackathons':
    case 'Workshops & Seminars':
      return Calendar;
    case 'Cultural & Fests':
      return Sparkles;
    case 'Clubs & Meetups':
      return Users;
    case 'Sports & Wellness':
      return Trophy;
    case 'Placement & Career':
      return Briefcase;
    default:
      return Package;
  }
}

export function ItemMedia({
  imageUrl,
  title,
  category,
  accent = 'teal',
  className = 'aspect-[4/3]',
}: {
  imageUrl?: string;
  title: string;
  category: string;
  accent?: 'teal' | 'orange' | 'navy' | 'coral';
  className?: string;
}) {
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setErrored(false);
  }, [imageUrl]);

  const Icon = getCategoryIcon(category);
  const hasExplicitWidth = /\bw-\S+/.test(className);
  const widthClass = hasExplicitWidth ? '' : 'w-full';
  const isCompact = /\bh-(1[0-9]|20)\b/.test(className);

  const bgGradient =
    accent === 'orange'
      ? 'from-amber-50 via-orange-50/70 to-slate-100 text-amber-700'
      : accent === 'coral'
        ? 'from-rose-50 via-pink-50/70 to-slate-100 text-[#E11D48]'
        : accent === 'navy'
          ? 'from-slate-100 via-indigo-50/60 to-slate-100 text-[#0F1A38]'
          : 'from-teal-50 via-cyan-50/60 to-slate-100 text-teal-700';

  if (!imageUrl || errored) {
    return (
      <div
        className={`${widthClass} overflow-hidden bg-gradient-to-br ${bgGradient} flex flex-col items-center justify-center ${
          isCompact ? 'p-2' : 'p-4'
        } text-center ${className}`}
      >
        <div
          className={`${
            isCompact ? 'w-8 h-8 rounded-lg' : 'w-11 h-11 rounded-xl mb-2'
          } bg-white/90 border border-slate-200/80 flex items-center justify-center`}
        >
          <Icon className={isCompact ? 'w-4 h-4' : 'w-5 h-5'} />
        </div>
        {!isCompact && (
          <span className="text-xs font-medium text-slate-600 line-clamp-1 max-w-[200px]">
            {category}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`${widthClass} overflow-hidden bg-slate-100 ${className}`}>
      <img
        src={imageUrl}
        alt={title}
        referrerPolicy="no-referrer"
        onError={() => setErrored(true)}
        className="w-full h-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.03]"
      />
    </div>
  );
}

export function StatusIndicator({
  status,
  type = 'report',
}: {
  status: string;
  type?: 'report' | 'listing' | 'request' | 'event';
}) {
  const map: Record<string, { label: string; color: string; Icon: React.ElementType }> = {
    open: { label: 'Open', color: 'text-teal-700', Icon: Clock },
    claim_pending: { label: 'Claim Pending', color: 'text-amber-700', Icon: Clock },
    verified: { label: 'Verified Match', color: 'text-indigo-700', Icon: ShieldCheck },
    reunited: { label: 'Reunited', color: 'text-emerald-700', Icon: CheckCircle2 },
    closed: { label: 'Closed', color: 'text-slate-500', Icon: XCircle },

    available: { label: 'Available', color: 'text-emerald-700', Icon: CheckCircle2 },
    requested: { label: 'Requested', color: 'text-amber-700', Icon: Clock },
    reserved: { label: 'Reserved', color: 'text-indigo-700', Icon: ShieldCheck },
    completed: { label: 'Completed', color: 'text-slate-600', Icon: CheckCircle2 },
    removed: { label: 'Removed', color: 'text-slate-500', Icon: XCircle },

    pending: { label: 'Pending Review', color: 'text-amber-700', Icon: Clock },
    accepted: { label: 'Accepted', color: 'text-emerald-700', Icon: CheckCircle2 },
    declined: { label: 'Declined', color: 'text-rose-700', Icon: XCircle },
    cancelled: { label: 'Cancelled', color: 'text-slate-500', Icon: XCircle },

    upcoming: { label: 'Upcoming', color: 'text-[#E11D48]', Icon: Calendar },
    ongoing: { label: 'Happening Now', color: 'text-emerald-700', Icon: CheckCircle2 },
  };

  const info = map[status] || {
    label: `${type}: ${status}`,
    color: 'text-slate-600',
    Icon: Clock,
  };
  const Icon = info.Icon;

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${info.color}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{info.label}</span>
    </span>
  );
}
