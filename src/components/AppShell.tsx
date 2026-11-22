import React from 'react';
import {
  Calendar,
  Home,
  LayoutDashboard,
  LogOut,
  Plus,
  Recycle,
  Search,
  ShieldAlert,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UniLinkLogo, UserAvatar } from './BrandAndMedia';

export type WorkspaceTab = 'dashboard' | 'find' | 'reuse' | 'events' | 'profile';

export function AppShell({
  activeTab,
  onSelectTab,
  onGoLanding,
  onQuickAction,
  children,
}: {
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  onGoLanding: () => void;
  onQuickAction: (action: 'lost' | 'found' | 'listing' | 'event') => void;
  children: React.ReactNode;
}) {
  const { user, profile, domainCheck, logout } = useAuth();

  const navItems: {
    id: WorkspaceTab;
    label: string;
    shortLabel: string;
    Icon: React.ElementType;
    accentClass: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      shortLabel: 'Home',
      Icon: LayoutDashboard,
      accentClass: 'text-white',
    },
    {
      id: 'find',
      label: 'Find · Lost & Found',
      shortLabel: 'Find',
      Icon: Search,
      accentClass: 'text-[#14B8A6]',
    },
    {
      id: 'reuse',
      label: 'Reuse · ReLife Exchange',
      shortLabel: 'Reuse',
      Icon: Recycle,
      accentClass: 'text-[#F59E0B]',
    },
    {
      id: 'events',
      label: 'Connect · Campus Events',
      shortLabel: 'Events',
      Icon: Calendar,
      accentClass: 'text-[#F45B7A]',
    },
    {
      id: 'profile',
      label: 'Student Profile',
      shortLabel: 'Profile',
      Icon: User,
      accentClass: 'text-slate-300',
    },
  ];

  const pageTitleMap: Record<WorkspaceTab, string> = {
    dashboard: 'Student Dashboard',
    find: 'Find · Smart Lost & Found',
    reuse: 'Reuse · ReLife Exchange',
    events: 'Connect · Campus Events',
    profile: 'Student Profile & Verification',
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 bg-[#0F1A38] text-white min-h-screen sticky top-0 h-screen">
        <div className="h-16 px-5 flex items-center justify-between border-b border-white/10">
          <button
            type="button"
            onClick={onGoLanding}
            className="text-left cursor-pointer"
            title="View Landing Page"
          >
            <UniLinkLogo variant="light" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto" aria-label="Primary Sidebar">
          <p className="px-3.5 pb-1.5 text-[11px] font-semibold text-slate-400">
            Campus Workspace
          </p>
          {navItems.map((item) => {
            const Icon = item.Icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-white/14 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-white/7 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? item.accentClass : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Student Summary */}
        <div className="p-4 border-t border-white/10 space-y-3">
          <button
            type="button"
            onClick={() => onSelectTab('profile')}
            className="w-full flex items-center gap-3 text-left p-2 rounded-lg hover:bg-white/8 transition-colors cursor-pointer"
          >
            <UserAvatar
              photoUrl={profile?.photoUrl}
              name={profile?.displayName || user?.displayName || undefined}
              email={user?.email}
              size="sm"
              variant="light"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">
                {profile?.displayName || user?.displayName || 'Student'}
              </p>
              <p className="text-[11px] text-slate-300 flex items-center gap-1 truncate mt-0.5">
                {user?.emailVerified ? (
                  <>
                    <ShieldCheck className="w-3 h-3 text-[#14B8A6] shrink-0" />
                    <span>
                      {domainCheck?.isAllowedCollegeDomain && domainCheck.domain !== 'gmail.com'
                        ? 'College Verified'
                        : 'Verified Account'}
                    </span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-3 h-3 text-[#F59E0B] shrink-0" />
                    <span>Email Unverified</span>
                  </>
                )}
              </p>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onGoLanding}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              Landing
            </button>
            <button
              type="button"
              onClick={() => void logout()}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-rose-500/20 hover:text-rose-200 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 h-14 sm:h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="lg:hidden">
              <button
                type="button"
                onClick={onGoLanding}
                className="cursor-pointer"
                aria-label="UniLink Home"
              >
                <UniLinkLogo variant="dark" />
              </button>
            </div>
            <div className="hidden lg:flex items-center gap-2 text-sm min-w-0">
              <span className="text-slate-400 font-medium">UniLink</span>
              <span aria-hidden="true" className="text-slate-300">/</span>
              <h1 className="font-display text-base font-bold text-[#0F1A38] truncate">
                {pageTitleMap[activeTab]}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {activeTab === 'reuse' ? (
              <button
                type="button"
                onClick={() => onQuickAction('listing')}
                className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#EA580C] hover:bg-amber-700 text-white text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Listing
              </button>
            ) : activeTab === 'events' ? (
              <button
                type="button"
                onClick={() => onQuickAction('event')}
                className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#E11D48] hover:bg-rose-700 text-white text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Event
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onQuickAction('lost')}
                className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Report Item
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {children}
        </main>
      </div>

      {/* Compact Mobile Bottom Thumb Navigation (<= 15% viewport height) */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed inset-x-0 bottom-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 h-16 px-1.5 grid grid-cols-5 items-center"
      >
        {navItems.map((item) => {
          const Icon = item.Icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`min-h-[44px] flex flex-col items-center justify-center gap-1 rounded-lg px-1 py-1 text-[11px] transition-colors cursor-pointer ${
                active ? 'text-[#0F1A38] font-semibold bg-slate-100/80' : 'text-slate-500 font-medium'
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  active
                    ? item.id === 'find'
                      ? 'text-[#0D9488]'
                      : item.id === 'reuse'
                        ? 'text-[#EA580C]'
                        : item.id === 'events'
                          ? 'text-[#E11D48]'
                          : 'text-[#0F1A38]'
                    : 'text-slate-400'
                }`}
              />
              <span className="truncate max-w-full">{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
