import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Bell,
  BookmarkCheck,
  Calendar,
  Check,
  Clock,
  MapPin,
  Package,
  Plus,
  Recycle,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEMO_EVENTS, DEMO_LISTINGS, DEMO_REPORTS } from '../data/demoData';
import { updateItemRequestStatus } from '../services/firestoreService';
import type {
  CampusEvent,
  EventStatus,
  ExchangeListing,
  ItemRequest,
  LostFoundReport,
  SavedEvent,
} from '../types/unilink';
import { ItemMedia, StatusIndicator } from './BrandAndMedia';

interface DashboardViewProps {
  reports: LostFoundReport[];
  listings: ExchangeListing[];
  events: CampusEvent[];
  savedEvents?: SavedEvent[];
  savedEventIds?: Set<string>;
  requests: ItemRequest[];
  loading: boolean;
  onQuickAction: (action: 'lost' | 'found' | 'listing' | 'event') => void;
  onRemoveSavedEvent?: (eventId: string) => Promise<void>;
  onNavigateFind: (reportId?: string) => void;
  onNavigateReuse: (listingId?: string) => void;
  onNavigateEvents: (eventId?: string) => void;
  onNavigateProfile: () => void;
}

function getLocalDayDiff(eventDate: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(eventDate);
  if (!match) return null;
  const now = new Date();
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const targetUtc = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Math.round((targetUtc - todayUtc) / 86400000);
}

function getReminderTiming(
  eventDate: string,
  status: EventStatus,
): { label: string; isSoon: boolean; diffDays: number | null } {
  if (status === 'cancelled') return { label: 'Cancelled', isSoon: false, diffDays: null };
  if (status === 'completed') return { label: 'Completed', isSoon: false, diffDays: null };
  const diff = getLocalDayDiff(eventDate);
  if (status === 'ongoing') return { label: 'Happening now', isSoon: true, diffDays: diff };
  if (diff === null) return { label: eventDate, isSoon: false, diffDays: null };
  if (diff === 0) return { label: 'Today', isSoon: true, diffDays: 0 };
  if (diff === 1) return { label: 'Tomorrow', isSoon: true, diffDays: 1 };
  if (diff > 1 && diff <= 7) return { label: `In ${diff} days`, isSoon: true, diffDays: diff };
  if (diff > 7) return { label: `In ${diff} days`, isSoon: false, diffDays: diff };
  return { label: 'Past date', isSoon: false, diffDays: diff };
}

export function DashboardView({
  reports,
  listings,
  events,
  savedEvents = [],
  savedEventIds,
  requests,
  loading,
  onQuickAction,
  onRemoveSavedEvent,
  onNavigateFind,
  onNavigateReuse,
  onNavigateEvents,
  onNavigateProfile,
}: DashboardViewProps) {
  const { user, profile, domainCheck, resendVerificationEmail, refreshAuthSession } = useAuth();
  const [myTab, setMyTab] = useState<'reports' | 'listings' | 'events' | 'saved' | 'requests'>('reports');
  const [requestBusyId, setRequestBusyId] = useState<string | null>(null);
  const [removingSavedId, setRemovingSavedId] = useState<string | null>(null);
  const [verifyNotice, setVerifyNotice] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [reminderDismissed, setReminderDismissed] = useState(false);
  const [localReminderNotice, setLocalReminderNotice] = useState<string | null>(null);

  const myReports = useMemo(
    () => reports.filter((r) => user && r.reporterId === user.uid),
    [reports, user],
  );
  const myListings = useMemo(
    () => listings.filter((l) => user && l.sellerId === user.uid),
    [listings, user],
  );
  const myEvents = useMemo(
    () => events.filter((ev) => user && ev.creatorId === user.uid),
    [events, user],
  );
  const pendingRequestsCount = useMemo(
    () => requests.filter((r) => r.status === 'pending').length,
    [requests],
  );

  const recentReports = useMemo(() => {
    return [...reports, ...DEMO_REPORTS].slice(0, 3);
  }, [reports]);

  const recentListings = useMemo(() => {
    return [...listings, ...DEMO_LISTINGS].slice(0, 3);
  }, [listings]);

  const upcomingEvents = useMemo(() => {
    const combined = [...events, ...DEMO_EVENTS];
    const activeFirst = [...combined].sort((a, b) => {
      const aActive = a.status === 'upcoming' || a.status === 'ongoing' ? 0 : 1;
      const bActive = b.status === 'upcoming' || b.status === 'ongoing' ? 0 : 1;
      if (aActive !== bActive) return aActive - bActive;
      return a.eventDate.localeCompare(b.eventDate);
    });
    return activeFirst.slice(0, 3);
  }, [events]);

  const resolvedSavedEvents = useMemo(() => {
    const liveMap = new Map(events.map((e) => [e.id, e]));
    return savedEvents.map((saved) => {
      const live = liveMap.get(saved.eventId);
      if (!live) return saved;
      return {
        ...saved,
        title: live.title,
        category: live.category,
        eventDate: live.eventDate,
        eventTime: live.eventTime,
        location: live.location,
        organizer: live.organizer,
        imageUrl: live.imageUrl,
        status: live.status,
      };
    });
  }, [savedEvents, events]);

  const upcomingSavedItems = useMemo(() => {
    return resolvedSavedEvents
      .map((ev) => ({
        event: ev,
        timing: getReminderTiming(ev.eventDate, ev.status),
      }))
      .filter(
        ({ event, timing }) =>
          (event.status === 'upcoming' || event.status === 'ongoing') &&
          (timing.diffDays === null || timing.diffDays >= 0),
      );
  }, [resolvedSavedEvents]);

  const soonSavedItems = useMemo(
    () => upcomingSavedItems.filter(({ timing }) => timing.isSoon),
    [upcomingSavedItems],
  );

  const handleRequestAction = async (
    reqId: string,
    nextStatus: 'accepted' | 'declined' | 'completed' | 'cancelled',
  ) => {
    setRequestBusyId(reqId);
    try {
      await updateItemRequestStatus(reqId, nextStatus);
    } finally {
      setRequestBusyId(null);
    }
  };

  const handleRemoveSaved = async (eventId: string) => {
    if (!onRemoveSavedEvent) return;
    setRemovingSavedId(eventId);
    try {
      await onRemoveSavedEvent(eventId);
      setLocalReminderNotice('Removed event from Saved Events.');
    } catch (err) {
      setLocalReminderNotice(err instanceof Error ? err.message : 'Could not remove saved event.');
    } finally {
      setRemovingSavedId(null);
    }
  };

  const handleTriggerLocalReminder = async () => {
    const nextItem = upcomingSavedItems[0];
    if (!nextItem) {
      setLocalReminderNotice('No upcoming saved events to remind you about right now.');
      return;
    }

    const summaryText = `${nextItem.event.title} (${nextItem.timing.label}) · ${nextItem.event.eventDate} at ${nextItem.event.eventTime} · ${nextItem.event.location}`;
    const countSuffix =
      upcomingSavedItems.length > 1
        ? ` (+${upcomingSavedItems.length - 1} more upcoming)`
        : '';

    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        let permission = Notification.permission;
        if (permission === 'default') {
          permission = await Notification.requestPermission();
        }
        if (permission === 'granted') {
          new Notification('UniLink Event Reminder', {
            body: `${summaryText}${countSuffix}`,
          });
          setLocalReminderNotice(`Browser notification sent for ${summaryText}.`);
          return;
        }
      } catch {
        // Embedded contexts may block Notification API; fall back cleanly to inline reminder
      }
    }

    setLocalReminderNotice(`Local Reminder: ${summaryText}${countSuffix}.`);
  };

  return (
    <div className="space-y-8">
      {/* Unverified Email Alert if applicable */}
      {user && !user.emailVerified && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-amber-950">
              Email verification required to post or claim items
            </p>
            <p className="text-xs text-amber-800">
              Verify {user.email} via the link in your inbox, then refresh your session.
            </p>
            {verifyNotice && <p className="text-xs font-medium text-emerald-800">{verifyNotice}</p>}
            {verifyError && <p className="text-xs font-medium text-rose-800">{verifyError}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={verifyBusy}
              onClick={async () => {
                setVerifyBusy(true);
                setVerifyNotice(null);
                setVerifyError(null);
                try {
                  await resendVerificationEmail();
                  setVerifyNotice('Verification email sent. Check your inbox and spam folder.');
                } catch (err) {
                  setVerifyError(
                    err instanceof Error ? err.message : 'Could not resend verification email.',
                  );
                } finally {
                  setVerifyBusy(false);
                }
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-amber-300 bg-white text-amber-900 hover:bg-amber-100 disabled:opacity-60 cursor-pointer"
            >
              Resend Email
            </button>
            <button
              type="button"
              disabled={verifyBusy}
              onClick={async () => {
                setVerifyBusy(true);
                setVerifyNotice(null);
                setVerifyError(null);
                try {
                  await refreshAuthSession();
                  setVerifyNotice('Session refreshed. Verification status is up to date.');
                } catch (err) {
                  setVerifyError(
                    err instanceof Error ? err.message : 'Could not refresh verification status.',
                  );
                } finally {
                  setVerifyBusy(false);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#0F1A38] text-white hover:bg-[#17254D] disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${verifyBusy ? 'animate-spin' : ''}`} />
              Refresh Status
            </button>
          </div>
        </div>
      )}

      {/* Personal Welcome + Quick Actions */}
      <section className="bg-[#0F1A38] text-white rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2.5 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-300">
            {user?.emailVerified ? (
              <span className="inline-flex items-center gap-1.5 text-[#14B8A6] font-medium">
                <ShieldCheck className="w-4 h-4" />
                {domainCheck?.isAllowedCollegeDomain && domainCheck.domain !== 'gmail.com'
                  ? `College-Verified Student (${domainCheck.domain})`
                  : `Verified Account (${domainCheck?.domain || user.email?.split('@')[1] || 'gmail.com'})`}
              </span>
            ) : (
              <button
                type="button"
                onClick={onNavigateProfile}
                className="inline-flex items-center gap-1.5 text-[#F59E0B] hover:underline font-medium cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4" />
                Unverified Account ({domainCheck?.domain || 'email'}) — View Status
              </button>
            )}
            {(profile?.branch || profile?.semester) && (
              <>
                <span aria-hidden="true" className="text-slate-600">
                  ·
                </span>
                <span>
                  {[profile.branch || profile.department, profile.semester]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </>
            )}
          </div>

          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome back, {profile?.displayName || user?.displayName || 'Student'}
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Lost Things Found. Unused Things Reimagined. Post a report in seconds or pass on
            semester textbooks through ReLife Exchange.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 shrink-0 lg:min-w-[330px]">
          <button
            type="button"
            onClick={() => onQuickAction('lost')}
            className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
            Report Lost
          </button>
          <button
            type="button"
            onClick={() => onQuickAction('found')}
            className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-white/12 hover:bg-white/20 text-white text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
            Report Found
          </button>
          <button
            type="button"
            onClick={() => onQuickAction('listing')}
            className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-[#EA580C] hover:bg-amber-700 text-white text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
            Create Listing
          </button>
          <button
            type="button"
            onClick={() => onQuickAction('event')}
            className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-[#E11D48] hover:bg-rose-700 text-white text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
            Create Event
          </button>
        </div>
      </section>

      {/* Summary Metrics Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'My Lost & Found',
            value: myReports.length,
            hint: 'Reports submitted',
            Icon: Search,
            iconClass: 'bg-teal-50 text-[#0D9488]',
            action: () => setMyTab('reports'),
          },
          {
            label: 'My Exchange Listings',
            value: myListings.length,
            hint: 'Items shared',
            Icon: Recycle,
            iconClass: 'bg-amber-50 text-[#EA580C]',
            action: () => setMyTab('listings'),
          },
          {
            label: 'Pending Requests',
            value: pendingRequestsCount,
            hint: 'Claims & pickups',
            Icon: Clock,
            iconClass: 'bg-slate-100 text-[#0F1A38]',
            action: () => setMyTab('requests'),
          },
          {
            label: 'Live Campus Posts',
            value: reports.length + listings.length + events.length,
            hint: 'Reports, listings & events',
            Icon: Calendar,
            iconClass: 'bg-rose-50 text-[#E11D48]',
            action: () => onNavigateEvents(),
          },
        ].map((stat) => {
          const StatIcon = stat.Icon;
          return (
            <button
              key={stat.label}
              type="button"
              onClick={stat.action}
              className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs rounded-xl p-4 sm:p-5 text-left transition-[border-color,box-shadow] duration-150 cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${stat.iconClass}`}
                >
                  <StatIcon className="w-3.5 h-3.5" />
                </span>
              </div>
              <p className="font-display text-2xl sm:text-3xl font-bold text-[#0F1A38] tabular-nums mt-1.5">
                {loading ? '—' : stat.value}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">{stat.hint}</p>
            </button>
          );
        })}
      </section>

      {/* Local Upcoming Event Reminder Strip */}
      {!loading && upcomingSavedItems.length > 0 && !reminderDismissed && (
        <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <span className="w-8 h-8 rounded-lg bg-white border border-rose-200 text-[#E11D48] flex items-center justify-center shrink-0 mt-0.5">
              <Bell className="w-4 h-4" />
            </span>
            <div className="min-w-0 space-y-0.5">
              <p className="text-xs font-semibold text-[#0F1A38]">
                {soonSavedItems.length > 0
                  ? `${soonSavedItems.length} saved ${soonSavedItems.length === 1 ? 'event is' : 'events are'} coming up soon`
                  : `${upcomingSavedItems.length} upcoming saved ${upcomingSavedItems.length === 1 ? 'event' : 'events'}`}
              </p>
              <p className="text-xs text-slate-600 truncate">
                Next: <strong className="text-[#0F1A38]">{upcomingSavedItems[0].event.title}</strong>{' '}
                · {upcomingSavedItems[0].timing.label} ({upcomingSavedItems[0].event.eventDate} ·{' '}
                {upcomingSavedItems[0].event.eventTime}) · {upcomingSavedItems[0].event.location}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {myTab !== 'saved' && (
              <button
                type="button"
                onClick={() => setMyTab('saved')}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#E11D48] text-white hover:bg-rose-700 whitespace-nowrap cursor-pointer"
              >
                View Saved Events
              </button>
            )}
            <button
              type="button"
              onClick={() => void handleTriggerLocalReminder()}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-rose-200 text-[#0F1A38] hover:bg-rose-100/60 whitespace-nowrap cursor-pointer"
            >
              Notify Me
            </button>
            <button
              type="button"
              onClick={() => setReminderDismissed(true)}
              aria-label="Dismiss upcoming event reminder"
              className="p-1.5 text-slate-500 hover:text-[#0F1A38] rounded-md cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* My Activity Workspace: Reports, Listings, Events, Saved Events & Requests */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-display text-base font-bold text-[#0F1A38]">
            Your Campus Activity
          </h3>
          <div className="inline-flex flex-wrap p-1 bg-slate-100 rounded-lg self-start">
            {(
              [
                { id: 'reports', label: `My Reports (${myReports.length})` },
                { id: 'listings', label: `My Listings (${myListings.length})` },
                { id: 'events', label: `My Events (${myEvents.length})` },
                { id: 'saved', label: `Saved Events (${resolvedSavedEvents.length})` },
                { id: 'requests', label: `Requests (${requests.length})` },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setMyTab(t.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  myTab === t.id
                    ? 'bg-white text-[#0F1A38] shadow-xs'
                    : 'text-slate-600 hover:text-[#0F1A38]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((n) => (
                <div key={n} className="h-14 rounded-lg bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : myTab === 'reports' ? (
            myReports.length === 0 ? (
              <div className="py-8 text-center space-y-2.5">
                <p className="text-sm font-semibold text-[#0F1A38]">
                  You haven’t posted any Lost & Found reports yet
                </p>
                <p className="text-xs text-slate-500">
                  Your live Firestore reports will appear here with quick status management.
                </p>
                <button
                  type="button"
                  onClick={() => onQuickAction('lost')}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-[#0D9488] hover:bg-[#0F766E] rounded-lg cursor-pointer"
                >
                  Post Lost or Found Report
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {myReports.map((rep) => (
                  <div
                    key={rep.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span
                          className={`font-semibold ${
                            rep.type === 'lost' ? 'text-rose-700' : 'text-[#0D9488]'
                          }`}
                        >
                          {rep.type === 'lost' ? 'Lost' : 'Found'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{rep.location}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{rep.eventDate}</span>
                      </div>
                      <p className="text-sm font-semibold text-[#0F1A38] truncate mt-0.5">
                        {rep.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <StatusIndicator status={rep.status} type="report" />
                      <button
                        type="button"
                        onClick={() => onNavigateFind(rep.id)}
                        className="text-xs font-semibold text-[#0D9488] hover:underline cursor-pointer"
                      >
                        Manage →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : myTab === 'listings' ? (
            myListings.length === 0 ? (
              <div className="py-8 text-center space-y-2.5">
                <p className="text-sm font-semibold text-[#0F1A38]">
                  You haven’t shared any items on ReLife Exchange yet
                </p>
                <p className="text-xs text-slate-500">
                  List a textbook, calculator, or lab kit to help juniors on campus.
                </p>
                <button
                  type="button"
                  onClick={() => onQuickAction('listing')}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-[#EA580C] hover:bg-amber-700 rounded-lg cursor-pointer"
                >
                  Create Exchange Listing
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {myListings.map((item) => (
                  <div
                    key={item.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-[#EA580C] capitalize">
                          {item.listingType}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{item.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {item.listingType === 'sell' ? `₹${item.price}` : item.condition}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-[#0F1A38] truncate mt-0.5">
                        {item.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <StatusIndicator status={item.availability} type="listing" />
                      <button
                        type="button"
                        onClick={() => onNavigateReuse(item.id)}
                        className="text-xs font-semibold text-[#EA580C] hover:underline cursor-pointer"
                      >
                        Manage →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : myTab === 'events' ? (
            myEvents.length === 0 ? (
              <div className="py-8 text-center space-y-2.5">
                <p className="text-sm font-semibold text-[#0F1A38]">
                  You haven’t published any Campus Events yet
                </p>
                <p className="text-xs text-slate-500">
                  Post workshops, club meetups, study circles, or technical showcases for students.
                </p>
                <button
                  type="button"
                  onClick={() => onQuickAction('event')}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-[#E11D48] hover:bg-rose-700 rounded-lg cursor-pointer"
                >
                  Create Campus Event
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {myEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-[#E11D48]">{ev.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{ev.location}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {ev.eventDate} · {ev.eventTime}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-[#0F1A38] truncate mt-0.5">
                        {ev.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <StatusIndicator status={ev.status} type="event" />
                      <button
                        type="button"
                        onClick={() => onNavigateEvents(ev.id)}
                        className="text-xs font-semibold text-[#E11D48] hover:underline cursor-pointer"
                      >
                        Manage →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : myTab === 'saved' ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="flex items-center gap-2.5 text-xs text-slate-600">
                  <Bell className="w-4 h-4 text-[#E11D48] shrink-0" />
                  <span>
                    {upcomingSavedItems.length > 0
                      ? `${upcomingSavedItems.length} upcoming saved ${upcomingSavedItems.length === 1 ? 'event' : 'events'} tracked (${soonSavedItems.length} within 7 days).`
                      : 'Mark any Campus Event as Interested to track dates and trigger local reminders.'}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {upcomingSavedItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => void handleTriggerLocalReminder()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-[#0F1A38] hover:bg-slate-100 whitespace-nowrap cursor-pointer"
                    >
                      <Bell className="w-3.5 h-3.5 text-[#E11D48]" />
                      Send Local Reminder
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onNavigateEvents()}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#E11D48] text-white hover:bg-rose-700 whitespace-nowrap cursor-pointer"
                  >
                    Browse Events
                  </button>
                </div>
              </div>

              {localReminderNotice && (
                <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-950">
                  <span>{localReminderNotice}</span>
                  <button
                    type="button"
                    onClick={() => setLocalReminderNotice(null)}
                    aria-label="Dismiss reminder notice"
                    className="text-rose-700 hover:text-rose-950 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {resolvedSavedEvents.length === 0 ? (
                <div className="py-8 text-center space-y-2.5">
                  <p className="text-sm font-semibold text-[#0F1A38]">
                    No saved events yet
                  </p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Tap “Interested” on any event in Campus Events to keep track of dates, venues,
                    and upcoming local reminders here.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigateEvents()}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-[#E11D48] hover:bg-rose-700 rounded-lg cursor-pointer"
                  >
                    Explore Campus Events
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {resolvedSavedEvents.map((ev) => {
                    const timing = getReminderTiming(ev.eventDate, ev.status);
                    const isRemoving = removingSavedId === ev.eventId;
                    return (
                      <div
                        key={ev.id}
                        className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span className="font-semibold text-[#E11D48]">{ev.category}</span>
                            {ev.isDemo && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-amber-700 font-medium">Sample Demo</span>
                              </>
                            )}
                            <span aria-hidden="true">·</span>
                            <span
                              className={`font-semibold tabular-nums ${
                                timing.isSoon ? 'text-[#E11D48]' : 'text-slate-600'
                              }`}
                            >
                              {timing.label}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">
                              {ev.eventDate} · {ev.eventTime}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-[#0F1A38] truncate">
                            {ev.title}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {ev.organizer} · {ev.location}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <StatusIndicator status={ev.status} type="event" />
                          <button
                            type="button"
                            onClick={() => onNavigateEvents(ev.eventId)}
                            className="text-xs font-semibold text-[#E11D48] hover:underline whitespace-nowrap cursor-pointer"
                          >
                            View →
                          </button>
                          {onRemoveSavedEvent && (
                            <button
                              type="button"
                              disabled={isRemoving}
                              onClick={() => void handleRemoveSaved(ev.eventId)}
                              aria-label={`Remove ${ev.title} from Saved Events`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-slate-200 cursor-pointer disabled:opacity-60"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : requests.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <p className="text-sm font-semibold text-[#0F1A38]">No requests or claims yet</p>
              <p className="text-xs text-slate-500">
                When you request an exchange item or submit a claim verification—or receive one—it
                appears here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {requests.map((req) => {
                const isIncoming = user?.uid === req.ownerId;
                const busy = requestBusyId === req.id;
                return (
                  <div
                    key={req.id}
                    className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-[#0F1A38]">
                          {isIncoming ? 'Incoming Request' : 'Sent Request'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {req.targetType === 'lost_found' ? 'Lost/Found Claim' : 'ReLife Exchange'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <StatusIndicator status={req.status} type="request" />
                      </div>
                      <p className="text-sm font-semibold text-[#0F1A38] truncate">
                        {req.targetTitle}
                      </p>
                      <p className="text-xs text-slate-600">
                        {isIncoming
                          ? `From ${req.requesterName}${req.requesterBranch ? ` (${req.requesterBranch})` : ''}`
                          : `To ${req.ownerName}`}{' '}
                        · Pickup: {req.proposedHandoverPoint}
                      </p>
                      <p className="text-xs text-slate-700 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                        {req.message}
                        {req.verificationAnswer && (
                          <span className="block mt-1 font-medium text-[#0D9488]">
                            Verification Answer: “{req.verificationAnswer}”
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {isIncoming && req.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleRequestAction(req.id, 'accepted')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#0D9488] text-white hover:bg-[#0F766E] disabled:opacity-60 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Accept
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleRequestAction(req.id, 'declined')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-60 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            Decline
                          </button>
                        </>
                      )}
                      {isIncoming && req.status === 'accepted' && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleRequestAction(req.id, 'completed')}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#0F1A38] text-white hover:bg-[#17254D] disabled:opacity-60 cursor-pointer"
                        >
                          Mark Handover Completed
                        </button>
                      )}
                      {!isIncoming && (req.status === 'pending' || req.status === 'accepted') && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleRequestAction(req.id, 'cancelled')}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-60 cursor-pointer"
                        >
                          Cancel Request
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Recently Reported Lost & Found + Recently Added Exchange */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Find */}
        <section className="space-y-4 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-[#0D9488]" />
              <h3 className="font-display text-base font-bold text-[#0F1A38]">
                Recent Lost & Found
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateFind()}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#0D9488] hover:underline cursor-pointer"
            >
              View All
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentReports.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigateFind(item.id)}
                className="group w-full bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3 flex items-center gap-3.5 text-left transition-colors overflow-hidden cursor-pointer"
              >
                <ItemMedia
                  imageUrl={item.imageUrl}
                  title={item.title}
                  category={item.category}
                  accent="teal"
                  className="w-20 h-16 rounded-lg shrink-0"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span
                      className={`font-semibold ${
                        item.type === 'lost' ? 'text-rose-700' : 'text-[#0D9488]'
                      }`}
                    >
                      {item.type === 'lost' ? 'Lost' : 'Found'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{item.location}</span>
                    {item.isDemo && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-amber-700 font-medium">Sample Demo</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-[#0F1A38] truncate">{item.title}</p>
                  <StatusIndicator status={item.status} type="report" />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Recent Reuse */}
        <section className="space-y-4 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Recycle className="w-4 h-4 text-[#EA580C]" />
              <h3 className="font-display text-base font-bold text-[#0F1A38]">
                Recent ReLife Exchange
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateReuse()}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#EA580C] hover:underline cursor-pointer"
            >
              Browse All
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentListings.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigateReuse(item.id)}
                className="group w-full bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3 flex items-center gap-3.5 text-left transition-colors overflow-hidden cursor-pointer"
              >
                <ItemMedia
                  imageUrl={item.imageUrl}
                  title={item.title}
                  category={item.category}
                  accent="orange"
                  className="w-20 h-16 rounded-lg shrink-0"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="font-semibold text-[#EA580C] capitalize">
                      {item.listingType}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{item.condition}</span>
                    {item.isDemo && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-amber-700 font-medium">Sample Demo</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-[#0F1A38] truncate">{item.title}</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#0F1A38] tabular-nums">
                      {item.listingType === 'sell'
                        ? `₹${item.price}`
                        : item.listingType === 'donate'
                          ? 'Free'
                          : item.listingType === 'swap'
                            ? 'Swap'
                            : 'Borrow'}
                    </span>
                    <StatusIndicator status={item.availability} type="listing" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Upcoming Campus Events */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#E11D48]" />
            <h3 className="font-display text-base font-bold text-[#0F1A38]">
              Upcoming Campus Events
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigateEvents()}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#E11D48] hover:underline cursor-pointer"
          >
            Explore Events
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {upcomingEvents.map((ev) => (
            <button
              key={ev.id}
              type="button"
              onClick={() => onNavigateEvents(ev.id)}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl overflow-hidden text-left flex flex-col transition-colors cursor-pointer"
            >
              <ItemMedia
                imageUrl={ev.imageUrl}
                title={ev.title}
                category={ev.category}
                accent="coral"
                className="aspect-[16/9]"
              />
              <div className="p-4 flex-1 flex flex-col justify-between space-y-2.5 w-full">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-semibold text-[#E11D48]">{ev.category}</span>
                      {ev.isDemo && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-amber-700 font-medium">Sample Demo</span>
                        </>
                      )}
                    </div>
                    {savedEventIds?.has(ev.id) && (
                      <span className="inline-flex items-center gap-1 text-[#E11D48] font-semibold shrink-0">
                        <BookmarkCheck className="w-3 h-3" />
                        Saved
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-[#0F1A38] line-clamp-2">{ev.title}</p>
                  <p className="text-xs text-slate-600 truncate">{ev.organizer}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{ev.location}</span>
                  </span>
                  <span className="font-mono tabular-nums shrink-0">{ev.eventDate}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Category Shortcuts */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-[#0F1A38] flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display text-sm font-bold text-[#0F1A38]">
              Explore Campus Resource Categories
            </h3>
            <p className="text-xs text-slate-500">
              Jump directly to ID cards, lab kits, senior-to-junior books, or upcoming events.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onNavigateFind()}
            className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
          >
            Lost & Found Board
          </button>
          <button
            type="button"
            onClick={() => onNavigateReuse()}
            className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
          >
            Books & Lab Kits
          </button>
          <button
            type="button"
            onClick={() => onNavigateEvents()}
            className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
          >
            Campus Events
          </button>
          <button
            type="button"
            onClick={onNavigateProfile}
            className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
          >
            Student Profile
          </button>
        </div>
      </section>
    </div>
  );
}
