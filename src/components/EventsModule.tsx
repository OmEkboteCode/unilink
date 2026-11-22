import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Bookmark,
  BookmarkCheck,
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEMO_EVENTS } from '../data/demoData';
import { uploadCampusItemImage } from '../lib/mediaUpload';
import {
  CAMPUS_LOCATIONS,
  EVENT_CATEGORIES,
  validateEventInput,
} from '../lib/validation';
import {
  createCampusEvent,
  deleteCampusEvent,
  updateCampusEventDetails,
  updateCampusEventStatus,
} from '../services/firestoreService';
import type { CampusEvent, EventCategory, EventStatus } from '../types/unilink';
import { ItemMedia, StatusIndicator } from './BrandAndMedia';

interface EventsModuleProps {
  events: CampusEvent[];
  loading: boolean;
  savedEventIds?: Set<string>;
  onToggleSaveEvent?: (event: CampusEvent) => Promise<boolean>;
  openCreateTrigger?: boolean;
  onClearCreateTrigger?: () => void;
  selectedEventId?: string | null;
  onSelectEventId?: (id: string | null) => void;
}

export function EventsModule({
  events,
  loading,
  savedEventIds,
  onToggleSaveEvent,
  openCreateTrigger,
  onClearCreateTrigger,
  selectedEventId,
  onSelectEventId,
}: EventsModuleProps) {
  const { user, profile } = useAuth();

  const [statusFilter, setStatusFilter] = useState<'all' | EventStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [includeDemos, setIncludeDemos] = useState(true);

  const [composerOpen, setComposerOpen] = useState(Boolean(openCreateTrigger));
  const [editingEvent, setEditingEvent] = useState<CampusEvent | null>(null);
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);

  const activeDetailId = selectedEventId !== undefined ? selectedEventId : internalSelectedId;
  const setActiveDetailId = (id: string | null) => {
    if (onSelectEventId) onSelectEventId(id);
    else setInternalSelectedId(id);
  };

  // Composer Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EventCategory>(EVENT_CATEGORIES[0]);
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 10));
  const [eventTime, setEventTime] = useState('15:00');
  const [location, setLocation] = useState(CAMPUS_LOCATIONS[0]);
  const [organizer, setOrganizer] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImg, setUploadingImg] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (openCreateTrigger) {
      openNewComposer();
      onClearCreateTrigger?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openCreateTrigger]);

  React.useEffect(() => {
    if (!composerOpen && !activeDetailId) return;
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        if (composerOpen) setComposerOpen(false);
        else if (activeDetailId) setActiveDetailId(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [composerOpen, activeDetailId]);

  const hasActiveFilters =
    statusFilter !== 'all' ||
    categoryFilter !== 'all' ||
    locationFilter !== 'all' ||
    searchQuery.trim().length > 0;

  const clearFilters = () => {
    setStatusFilter('all');
    setCategoryFilter('all');
    setLocationFilter('all');
    setSearchQuery('');
  };

  const allEvents = useMemo(() => {
    return includeDemos ? [...events, ...DEMO_EVENTS] : events;
  }, [events, includeDemos]);

  const availableLocations = useMemo(() => {
    const set = new Set<string>(CAMPUS_LOCATIONS);
    allEvents.forEach((ev) => {
      if (ev.location) set.add(ev.location);
    });
    return Array.from(set);
  }, [allEvents]);

  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allEvents.filter((ev) => {
      if (statusFilter !== 'all' && ev.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && ev.category !== categoryFilter) return false;
      if (locationFilter !== 'all' && ev.location !== locationFilter) return false;
      if (q) {
        const hay = `${ev.title} ${ev.description} ${ev.organizer} ${ev.location} ${ev.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allEvents, statusFilter, categoryFilter, locationFilter, searchQuery]);

  const selectedEvent = useMemo(
    () => allEvents.find((e) => e.id === activeDetailId) || null,
    [allEvents, activeDetailId],
  );

  function openNewComposer() {
    setEditingEvent(null);
    setTitle('');
    setDescription('');
    setCategory(EVENT_CATEGORIES[0]);
    setEventDate(new Date().toISOString().slice(0, 10));
    setEventTime('15:00');
    setLocation(CAMPUS_LOCATIONS[1]);
    setOrganizer(profile?.branch ? `${profile.branch} Student Chapter` : '');
    setImageUrl('');
    setFormError(null);
    setComposerOpen(true);
  }

  function openEditComposer(ev: CampusEvent) {
    setEditingEvent(ev);
    setTitle(ev.title);
    setDescription(ev.description);
    setCategory(ev.category);
    setEventDate(ev.eventDate);
    setEventTime(ev.eventTime);
    setLocation(ev.location);
    setOrganizer(ev.organizer);
    setImageUrl(ev.imageUrl);
    setFormError(null);
    setComposerOpen(true);
  }

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    setFormError(null);
    try {
      const res = await uploadCampusItemImage(file, 'listings');
      setImageUrl(res.url);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      setUploadingImg(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!user || !profile) {
      setFormError('Please sign in with a verified email to create an event.');
      return;
    }
    if (!user.emailVerified) {
      setFormError('Your email must be verified before creating campus events.');
      return;
    }

    const errors = validateEventInput({
      title,
      description,
      category,
      eventDate,
      eventTime,
      location,
      organizer,
      imageUrl,
    });
    const firstError = Object.values(errors)[0];
    if (firstError) {
      setFormError(firstError);
      return;
    }

    setSubmitting(true);
    try {
      if (editingEvent) {
        await updateCampusEventDetails(
          editingEvent.id,
          {
            title,
            description,
            category,
            eventDate,
            eventTime,
            location,
            organizer,
            imageUrl,
          },
          profile,
        );
        setFeedbackMsg('Event listing updated.');
      } else {
        const id = await createCampusEvent(
          {
            title,
            description,
            category,
            eventDate,
            eventTime,
            location,
            organizer,
            imageUrl,
          },
          profile,
        );
        setFeedbackMsg('Campus event published.');
        setActiveDetailId(id);
      }
      setComposerOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save event.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (ev: CampusEvent, nextStatus: EventStatus) => {
    try {
      await updateCampusEventStatus(ev.id, nextStatus);
      setFeedbackMsg(`Event marked as ${nextStatus}.`);
    } catch (err) {
      setFeedbackMsg(err instanceof Error ? err.message : 'Could not update event status.');
    }
  };

  const handleDelete = async (ev: CampusEvent) => {
    setDeleteBusy(true);
    try {
      await deleteCampusEvent(ev.id);
      setConfirmDeleteId(null);
      setActiveDetailId(null);
      setFeedbackMsg('Event listing deleted.');
    } catch (err) {
      setFeedbackMsg(err instanceof Error ? err.message : 'Could not delete event.');
    } finally {
      setDeleteBusy(false);
    }
  };

  const handleToggleInterest = async (ev: CampusEvent) => {
    if (!onToggleSaveEvent) return;
    setSavingId(ev.id);
    try {
      const saved = await onToggleSaveEvent(ev);
      setFeedbackMsg(
        saved
          ? `"${ev.title}" saved to Dashboard · Saved Events.`
          : `"${ev.title}" removed from Saved Events.`,
      );
    } catch (err) {
      setFeedbackMsg(err instanceof Error ? err.message : 'Could not update saved event.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#0F1A38]">
            Campus Events
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Discover and publish workshops, hackathons, club meetups, and academic seminars across campus.
          </p>
        </div>

        <button
          type="button"
          onClick={openNewComposer}
          className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#E11D48] hover:bg-rose-700 text-white text-xs font-semibold transition-colors whitespace-nowrap self-start md:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Event
        </button>
      </div>

      {feedbackMsg && (
        <div className="flex items-center justify-between gap-3 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-950 text-sm">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#E11D48] shrink-0" />
            {feedbackMsg}
          </span>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-rose-700 hover:text-rose-950 cursor-pointer"
            aria-label="Dismiss message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="inline-flex flex-wrap p-1 bg-slate-100 rounded-lg self-start">
            {(
              [
                { id: 'all', label: 'All Events' },
                { id: 'upcoming', label: 'Upcoming' },
                { id: 'ongoing', label: 'Happening Now' },
                { id: 'completed', label: 'Completed' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  statusFilter === tab.id
                    ? 'bg-white text-[#E11D48] shadow-xs'
                    : 'text-slate-600 hover:text-[#0F1A38]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search event title, organizer, or venue..."
              className="w-full pl-9 pr-9 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F45B7A]/30 focus:border-[#E11D48]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-2 p-0.5 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by event category"
            className="px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-[#E11D48]"
          >
            <option value="all">All Categories</option>
            {EVENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            aria-label="Filter by event location"
            className="px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-[#E11D48]"
          >
            <option value="all">All Campus Venues</option>
            {availableLocations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          <label className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg bg-slate-50 cursor-pointer">
            <input
              type="checkbox"
              checked={includeDemos}
              onChange={(e) => setIncludeDemos(e.target.checked)}
              className="rounded border-slate-300 text-[#E11D48] focus:ring-[#E11D48]"
            />
            <span>Show sample demo events</span>
          </label>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span className="tabular-nums">
            Showing <strong className="text-[#0F1A38]">{filteredEvents.length}</strong>{' '}
            {filteredEvents.length === 1 ? 'event' : 'events'}
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="font-semibold text-[#E11D48] hover:underline cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse"
            >
              <div className="aspect-[4/3] bg-slate-200" />
              <div className="p-4 space-y-3">
                <div className="h-3 w-28 bg-slate-200 rounded" />
                <div className="h-4 w-3/4 bg-slate-200 rounded" />
                <div className="h-3 w-1/2 bg-slate-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
          <p className="font-display text-base font-semibold text-[#0F1A38]">
            No matching campus events
          </p>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Try clearing your search filters, or publish a workshop, seminar, or club meetup for
            your peers.
          </p>
          <div className="pt-1 flex flex-wrap items-center justify-center gap-2.5">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="px-4 py-2 text-xs font-semibold text-[#0F1A38] bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            )}
            <button
              type="button"
              onClick={openNewComposer}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#E11D48] hover:bg-rose-700 rounded-lg transition-colors cursor-pointer"
            >
              {hasActiveFilters ? 'Create Event' : 'Create First Event'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map((ev) => {
            const isSaved = Boolean(savedEventIds?.has(ev.id));
            const isSaving = savingId === ev.id;
            return (
              <article
                key={ev.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col hover:border-slate-300 hover:shadow-sm transition-[border-color,box-shadow] duration-150"
              >
                <button
                  type="button"
                  onClick={() => setActiveDetailId(ev.id)}
                  className="group text-left flex-1 flex flex-col cursor-pointer"
                >
                  <ItemMedia
                    imageUrl={ev.imageUrl}
                    title={ev.title}
                    category={ev.category}
                    accent="coral"
                  />
                  <div className="p-4 pb-3 flex-1 flex flex-col justify-between space-y-3 w-full">
                    <div className="space-y-1.5">
                      <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-[#E11D48]">{ev.category}</span>
                        {ev.isDemo && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-amber-700 font-medium">Sample Demo</span>
                          </>
                        )}
                      </div>

                      <h3 className="font-display text-base font-semibold text-[#0F1A38] line-clamp-2">
                        {ev.title}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {ev.description}
                      </p>
                      <p className="text-xs font-medium text-slate-700 inline-flex items-center gap-1.5 pt-0.5 truncate max-w-full">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{ev.organizer}</span>
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 truncate">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{ev.location}</span>
                      </span>
                      <span className="font-mono tabular-nums shrink-0">
                        {ev.eventDate} · {ev.eventTime}
                      </span>
                    </div>
                  </div>
                </button>

                <div className="px-4 pb-3.5 pt-1 flex items-center justify-between gap-2">
                  <StatusIndicator status={ev.status} type="event" />
                  <div className="flex items-center gap-2 shrink-0">
                    {onToggleSaveEvent && (
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => void handleToggleInterest(ev)}
                        aria-pressed={isSaved}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap cursor-pointer disabled:opacity-60 ${
                          isSaved
                            ? 'bg-rose-50 border-rose-200 text-[#E11D48] hover:bg-rose-100'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {isSaved ? (
                          <BookmarkCheck className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <Bookmark className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>{isSaved ? 'Saved' : 'Interested'}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setActiveDetailId(ev.id)}
                      className="px-2 py-1.5 text-xs font-semibold text-[#E11D48] hover:underline whitespace-nowrap cursor-pointer"
                    >
                      Details →
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div
          onClick={() => {
            setActiveDetailId(null);
            setConfirmDeleteId(null);
          }}
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
          >
            <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-[#E11D48]">{selectedEvent.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedEvent.organizer}</span>
                  {selectedEvent.isDemo ? (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-amber-700 font-medium">Sample Demo Record</span>
                    </>
                  ) : (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-emerald-700 font-medium">Live Campus Record</span>
                    </>
                  )}
                </div>
                <h3 className="font-display text-lg font-bold text-[#0F1A38] truncate mt-0.5">
                  {selectedEvent.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveDetailId(null);
                  setConfirmDeleteId(null);
                }}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                aria-label="Close event details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-6">
              <ItemMedia
                imageUrl={selectedEvent.imageUrl}
                title={selectedEvent.title}
                category={selectedEvent.category}
                accent="coral"
                className="aspect-[16/9] rounded-xl"
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#F8FAFC] border border-slate-200 rounded-xl p-4 text-xs">
                <div className="space-y-0.5">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Date & Time
                  </span>
                  <p className="font-mono font-semibold text-[#0F1A38] tabular-nums">
                    {selectedEvent.eventDate} · {selectedEvent.eventTime}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    Venue
                  </span>
                  <p className="font-semibold text-[#0F1A38]">{selectedEvent.location}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Status
                  </span>
                  <div className="pt-0.5">
                    <StatusIndicator status={selectedEvent.status} type="event" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-500">About This Event</h4>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {selectedEvent.description}
                </p>
              </div>

              {onToggleSaveEvent && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-rose-50/60 border border-rose-200 rounded-xl p-4">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-[#0F1A38]">
                      {savedEventIds?.has(selectedEvent.id)
                        ? 'Saved to your Dashboard'
                        : 'Interested in attending?'}
                    </p>
                    <p className="text-xs text-slate-600">
                      Save this event to track it under Dashboard · Saved Events and receive upcoming reminders.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={savingId === selectedEvent.id}
                    onClick={() => void handleToggleInterest(selectedEvent)}
                    aria-pressed={Boolean(savedEventIds?.has(selectedEvent.id))}
                    className={`min-h-[38px] inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60 ${
                      savedEventIds?.has(selectedEvent.id)
                        ? 'bg-white border border-rose-300 text-[#E11D48] hover:bg-rose-50'
                        : 'bg-[#E11D48] text-white hover:bg-rose-700'
                    }`}
                  >
                    {savedEventIds?.has(selectedEvent.id) ? (
                      <BookmarkCheck className="w-4 h-4 shrink-0" />
                    ) : (
                      <Bookmark className="w-4 h-4 shrink-0" />
                    )}
                    <span>
                      {savedEventIds?.has(selectedEvent.id)
                        ? 'Saved · Remove'
                        : 'Mark Interested'}
                    </span>
                  </button>
                </div>
              )}

              {/* Organizer & Creator Attribution (No private PII exposed) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500">
                    Organized by <span className="font-semibold text-[#0F1A38]">{selectedEvent.organizer}</span>
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Posted by {selectedEvent.creatorName}
                    {selectedEvent.creatorBranch ? ` · ${selectedEvent.creatorBranch}` : ''}
                    {selectedEvent.creatorSemester ? ` · ${selectedEvent.creatorSemester}` : ''}
                  </p>
                </div>
                <div className="text-xs">
                  {selectedEvent.creatorCollegeVerified ? (
                    <span className="inline-flex items-center gap-1 text-[#0D9488] font-medium">
                      <ShieldCheck className="w-4 h-4" />
                      College-Verified Host
                    </span>
                  ) : (
                    <span className="text-slate-500">Verified Host</span>
                  )}
                </div>
              </div>

              {/* Creator Management Controls */}
              {selectedEvent.isDemo ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
                  <p className="font-semibold">Sample Demonstration Event</p>
                  <p>
                    This preview event shows how campus listings look. Click “Create Event” to
                    publish, edit, and manage a live event persisted in Cloud Firestore.
                  </p>
                </div>
              ) : user && selectedEvent.creatorId === user.uid ? (
                <div className="border-t border-slate-200 pt-4 space-y-3">
                  <h4 className="text-xs font-semibold text-slate-600">Manage Your Event</h4>
                  <div className="flex flex-wrap items-center gap-2">
                    {!(selectedEvent.status === 'completed' || selectedEvent.status === 'cancelled') && (
                      <>
                        <button
                          type="button"
                          onClick={() => openEditComposer(selectedEvent)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit Event
                        </button>
                        {selectedEvent.status === 'upcoming' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(selectedEvent, 'ongoing')}
                            className="px-3 py-2 text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg hover:bg-emerald-100 cursor-pointer"
                          >
                            Mark Happening Now
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(selectedEvent, 'completed')}
                          className="px-3 py-2 text-xs font-semibold bg-[#0F1A38] text-white rounded-lg hover:bg-[#17254D] cursor-pointer"
                        >
                          Mark Completed
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(selectedEvent, 'cancelled')}
                          className="px-3 py-2 text-xs font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 cursor-pointer"
                        >
                          Cancel Event
                        </button>
                      </>
                    )}
                    {confirmDeleteId === selectedEvent.id ? (
                      <div className="inline-flex items-center gap-2 ml-auto">
                        <button
                          type="button"
                          disabled={deleteBusy}
                          onClick={() => void handleDelete(selectedEvent)}
                          className="px-3 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer disabled:opacity-60"
                        >
                          {deleteBusy ? 'Deleting...' : 'Confirm Delete'}
                        </button>
                        <button
                          type="button"
                          disabled={deleteBusy}
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(selectedEvent.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 rounded-lg ml-auto cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Event Modal */}
      {composerOpen && (
        <div
          onClick={() => setComposerOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
          >
            <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-[#0F1A38]">
                {editingEvent ? 'Edit Campus Event' : 'Create Campus Event'}
              </h3>
              <button
                type="button"
                onClick={() => setComposerOpen(false)}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 sm:p-6 space-y-4">
              {formError && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={120}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Annual Campus Hackathon or Robotics Orientation"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#E11D48]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Organizer (Club, Dept, or Host)
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={100}
                    value={organizer}
                    onChange={(e) => setOrganizer(e.target.value)}
                    placeholder="e.g. IEEE Student Branch"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#E11D48]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as EventCategory)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#E11D48]"
                  >
                    {EVENT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#E11D48]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Time</label>
                  <input
                    type="time"
                    required
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#E11D48]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Campus Venue / Location
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={120}
                  list="campus-event-venues"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Main Auditorium or Seminar Hall 2"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#E11D48]"
                />
                <datalist id="campus-event-venues">
                  {CAMPUS_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Description (Agenda, prerequisites, or who should attend)
                </label>
                <textarea
                  required
                  minLength={10}
                  maxLength={1000}
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Share schedule highlights, speaker details, and registration instructions..."
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#E11D48]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Event Poster / Cover Image (Optional)
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    {uploadingImg ? 'Uploading...' : imageUrl ? 'Replace Poster' : 'Upload Poster'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFile}
                      className="hidden"
                    />
                  </label>
                  {imageUrl && (
                    <div className="flex items-center gap-2">
                      <img
                        src={imageUrl}
                        alt="Uploaded event poster preview"
                        referrerPolicy="no-referrer"
                        className="w-16 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setComposerOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingImg}
                  className="min-h-[40px] px-5 py-2 text-xs font-semibold text-white bg-[#E11D48] hover:bg-rose-700 rounded-lg transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {submitting
                    ? 'Saving...'
                    : editingEvent
                      ? 'Save Changes'
                      : 'Publish Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
