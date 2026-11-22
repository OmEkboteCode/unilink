import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Edit3,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEMO_REPORTS } from '../data/demoData';
import { uploadCampusItemImage } from '../lib/mediaUpload';
import {
  CAMPUS_DROP_POINTS,
  CAMPUS_LOCATIONS,
  findPotentialMatches,
  LOST_FOUND_CATEGORIES,
  validateLostFoundInput,
} from '../lib/validation';
import {
  createItemRequest,
  createLostFoundReport,
  deleteLostFoundReport,
  updateLostFoundReportDetails,
  updateLostFoundReportStatus,
} from '../services/firestoreService';
import type {
  LostFoundCategory,
  LostFoundReport,
  LostFoundStatus,
  ReportType,
} from '../types/unilink';
import { ItemMedia, StatusIndicator } from './BrandAndMedia';

interface FindModuleProps {
  reports: LostFoundReport[];
  loading: boolean;
  initialComposerType?: ReportType | null;
  onClearComposerTrigger?: () => void;
  selectedReportId?: string | null;
  onSelectReportId?: (id: string | null) => void;
}

export function FindModule({
  reports,
  loading,
  initialComposerType,
  onClearComposerTrigger,
  selectedReportId,
  onSelectReportId,
}: FindModuleProps) {
  const { user, profile, campusConfig } = useAuth();

  const [typeFilter, setTypeFilter] = useState<'all' | ReportType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [includeDemos, setIncludeDemos] = useState(true);

  const [composerOpen, setComposerOpen] = useState(Boolean(initialComposerType));
  const [editingReport, setEditingReport] = useState<LostFoundReport | null>(null);
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);

  const activeDetailId = selectedReportId !== undefined ? selectedReportId : internalSelectedId;
  const setActiveDetailId = (id: string | null) => {
    if (onSelectReportId) onSelectReportId(id);
    else setInternalSelectedId(id);
  };

  // Composer Form State
  const [formType, setFormType] = useState<ReportType>(initialComposerType || 'lost');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<LostFoundCategory>(LOST_FOUND_CATEGORIES[0]);
  const [location, setLocation] = useState(CAMPUS_LOCATIONS[0]);
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 10));
  const [eventTime, setEventTime] = useState('10:30');
  const [verificationPrompt, setVerificationPrompt] = useState('');
  const [handoverLocation, setHandoverLocation] = useState(
    campusConfig.campusDropPoints[0] || CAMPUS_DROP_POINTS[0],
  );
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImg, setUploadingImg] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Claim / Verification Request State
  const [claimAnswer, setClaimAnswer] = useState('');
  const [claimMessage, setClaimMessage] = useState('');
  const [claimHandoverPoint, setClaimHandoverPoint] = useState(
    campusConfig.campusDropPoints[0] || CAMPUS_DROP_POINTS[0],
  );
  const [claimBusy, setClaimBusy] = useState(false);
  const [claimFeedback, setClaimFeedback] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  React.useEffect(() => {
    if (initialComposerType) {
      openNewComposer(initialComposerType);
      onClearComposerTrigger?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialComposerType]);

  React.useEffect(() => {
    if (!composerOpen && !activeDetailId) return;
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        if (composerOpen) setComposerOpen(false);
        else if (activeDetailId) {
          setActiveDetailId(null);
          setClaimFeedback(null);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [composerOpen, activeDetailId]);

  const hasActiveFilters =
    typeFilter !== 'all' ||
    categoryFilter !== 'all' ||
    locationFilter !== 'all' ||
    statusFilter !== 'all' ||
    searchQuery.trim().length > 0;

  const clearFilters = () => {
    setTypeFilter('all');
    setCategoryFilter('all');
    setLocationFilter('all');
    setStatusFilter('all');
    setSearchQuery('');
  };

  const allReports = useMemo(() => {
    return includeDemos ? [...reports, ...DEMO_REPORTS] : reports;
  }, [reports, includeDemos]);

  const availableLocations = useMemo(() => {
    const set = new Set<string>(CAMPUS_LOCATIONS);
    allReports.forEach((rep) => {
      if (rep.location) set.add(rep.location);
    });
    return Array.from(set);
  }, [allReports]);

  const filteredReports = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allReports.filter((item) => {
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (locationFilter !== 'all' && item.location !== locationFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (q) {
        const hay = `${item.title} ${item.description} ${item.location} ${item.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allReports, typeFilter, categoryFilter, locationFilter, statusFilter, searchQuery]);

  const selectedReport = useMemo(
    () => allReports.find((r) => r.id === activeDetailId) || null,
    [allReports, activeDetailId],
  );

  const potentialMatches = useMemo(() => {
    if (!selectedReport) return [];
    return findPotentialMatches(selectedReport, allReports);
  }, [selectedReport, allReports]);

  function openNewComposer(type: ReportType) {
    setEditingReport(null);
    setFormType(type);
    setTitle('');
    setDescription('');
    setCategory(LOST_FOUND_CATEGORIES[0]);
    setLocation(CAMPUS_LOCATIONS[0]);
    setEventDate(new Date().toISOString().slice(0, 10));
    setEventTime('10:30');
    setVerificationPrompt('');
    setHandoverLocation(campusConfig.campusDropPoints[0] || CAMPUS_DROP_POINTS[0]);
    setImageUrl('');
    setFormError(null);
    setComposerOpen(true);
  }

  function openEditComposer(report: LostFoundReport) {
    setEditingReport(report);
    setFormType(report.type);
    setTitle(report.title);
    setDescription(report.description);
    setCategory(report.category);
    setLocation(report.location);
    setEventDate(report.eventDate);
    setEventTime(report.eventTime);
    setVerificationPrompt(report.verificationPrompt);
    setHandoverLocation(report.handoverLocation || CAMPUS_DROP_POINTS[0]);
    setImageUrl(report.imageUrl);
    setFormError(null);
    setComposerOpen(true);
  }

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    setFormError(null);
    try {
      const res = await uploadCampusItemImage(file, 'reports');
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
      setFormError('Please sign in with a verified email to post a report.');
      return;
    }
    if (!user.emailVerified) {
      setFormError('Your email must be verified before creating reports.');
      return;
    }

    const errors = validateLostFoundInput({
      title,
      description,
      category,
      location,
      eventDate,
      eventTime,
      verificationPrompt,
      handoverLocation,
      imageUrl,
    });
    const firstError = Object.values(errors)[0];
    if (firstError) {
      setFormError(firstError);
      return;
    }

    setSubmitting(true);
    try {
      if (editingReport) {
        await updateLostFoundReportDetails(
          editingReport.id,
          {
            title,
            description,
            category,
            imageUrl,
            location,
            eventDate,
            eventTime,
            verificationPrompt,
            handoverLocation,
          },
          profile,
        );
        setFeedbackMsg('Report updated successfully.');
      } else {
        const id = await createLostFoundReport(
          {
            type: formType,
            title,
            description,
            category,
            imageUrl,
            location,
            eventDate,
            eventTime,
            verificationPrompt,
            handoverLocation,
          },
          profile,
        );
        setFeedbackMsg('Report published to the campus Lost & Found board.');
        setActiveDetailId(id);
      }
      setComposerOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save report.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (report: LostFoundReport, nextStatus: LostFoundStatus) => {
    try {
      await updateLostFoundReportStatus(report.id, nextStatus, report.handoverLocation);
      setFeedbackMsg(`Report status updated to ${nextStatus.replace('_', ' ')}.`);
    } catch (err) {
      setFeedbackMsg(err instanceof Error ? err.message : 'Could not update status.');
    }
  };

  const handleDelete = async (report: LostFoundReport) => {
    setDeleteBusy(true);
    try {
      await deleteLostFoundReport(report.id);
      setConfirmDeleteId(null);
      setActiveDetailId(null);
      setFeedbackMsg('Report removed.');
    } catch (err) {
      setFeedbackMsg(err instanceof Error ? err.message : 'Could not delete report.');
    } finally {
      setDeleteBusy(false);
    }
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport || !profile || !user?.emailVerified) return;
    setClaimBusy(true);
    setClaimFeedback(null);
    try {
      await createItemRequest(
        {
          targetType: 'lost_found',
          targetId: selectedReport.id,
          targetTitle: selectedReport.title,
          ownerId: selectedReport.reporterId,
          ownerName: selectedReport.reporterName,
          message: claimMessage.trim() || 'Requesting ownership verification & handover.',
          verificationAnswer: claimAnswer.trim(),
          proposedHandoverPoint: claimHandoverPoint,
        },
        profile,
      );
      setClaimAnswer('');
      setClaimMessage('');
      setClaimFeedback(
        'Verification claim sent! Check your Dashboard Requests inbox for the reporter’s confirmation.',
      );
    } catch (err) {
      setClaimFeedback(err instanceof Error ? err.message : 'Failed to send claim.');
    } finally {
      setClaimBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#0F1A38]">
            Smart Lost & Found
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Report missing items or log found belongings with hidden-detail ownership verification.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => openNewComposer('lost')}
            className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0F1A38] hover:bg-[#17254D] text-white text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Report Lost Item
          </button>
          <button
            type="button"
            onClick={() => openNewComposer('found')}
            className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Report Found Item
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="flex items-center justify-between gap-3 p-3.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 text-sm">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#0D9488] shrink-0" />
            {feedbackMsg}
          </span>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-teal-700 hover:text-teal-950 cursor-pointer"
            aria-label="Dismiss message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Segmented Lost / Found Switch */}
          <div className="inline-flex p-1 bg-slate-100 rounded-lg self-start">
            {(
              [
                { id: 'all', label: 'All Reports' },
                { id: 'lost', label: 'Lost Items' },
                { id: 'found', label: 'Found Items' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTypeFilter(tab.id)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  typeFilter === tab.id
                    ? 'bg-white text-[#0D9488] shadow-xs'
                    : 'text-slate-600 hover:text-[#0F1A38]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search item title, description, or location..."
              className="w-full pl-9 pr-9 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by category"
            className="px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-[#0D9488]"
          >
            <option value="all">All Categories</option>
            {LOST_FOUND_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            aria-label="Filter by location"
            className="px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-[#0D9488]"
          >
            <option value="all">All Campus Locations</option>
            {availableLocations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
            className="px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-[#0D9488]"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="claim_pending">Claim Pending</option>
            <option value="verified">Verified Match</option>
            <option value="reunited">Reunited</option>
            <option value="closed">Closed</option>
          </select>

          <label className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg bg-slate-50 cursor-pointer">
            <input
              type="checkbox"
              checked={includeDemos}
              onChange={(e) => setIncludeDemos(e.target.checked)}
              className="rounded border-slate-300 text-[#0D9488] focus:ring-[#0D9488]"
            />
            <span>Show sample demo items</span>
          </label>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span className="tabular-nums">
            Showing <strong className="text-[#0F1A38]">{filteredReports.length}</strong>{' '}
            {filteredReports.length === 1 ? 'report' : 'reports'}
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="font-semibold text-[#0D9488] hover:underline cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Grid / Loading / Empty States */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse"
            >
              <div className="aspect-[4/3] bg-slate-200" />
              <div className="p-4 space-y-3">
                <div className="h-3 w-24 bg-slate-200 rounded" />
                <div className="h-4 w-3/4 bg-slate-200 rounded" />
                <div className="h-3 w-1/2 bg-slate-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
          <p className="font-display text-base font-semibold text-[#0F1A38]">
            No matching lost or found reports
          </p>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Try clearing your search filters, or post a new report so campus peers can spot it.
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
              onClick={() => openNewComposer('lost')}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0D9488] hover:bg-[#0F766E] rounded-lg transition-colors cursor-pointer"
            >
              {hasActiveFilters ? 'Post New Report' : 'Create First Report'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredReports.map((item) => (
            <article
              key={item.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col hover:border-slate-300 hover:shadow-sm transition-[border-color,box-shadow] duration-150"
            >
              <button
                type="button"
                onClick={() => setActiveDetailId(item.id)}
                className="group text-left flex-1 flex flex-col cursor-pointer"
              >
                <ItemMedia
                  imageUrl={item.imageUrl}
                  title={item.title}
                  category={item.category}
                  accent="teal"
                />
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3 w-full">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span
                        className={`font-semibold ${
                          item.type === 'lost' ? 'text-rose-700' : 'text-[#0D9488]'
                        }`}
                      >
                        {item.type === 'lost' ? 'Lost' : 'Found'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{item.category}</span>
                      {item.isDemo && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-amber-700 font-medium">Sample Demo</span>
                        </>
                      )}
                    </div>

                    <h3 className="font-display text-base font-semibold text-[#0F1A38] line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 truncate">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{item.location}</span>
                      </span>
                      <span className="font-mono tabular-nums shrink-0">{item.eventDate}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <StatusIndicator status={item.status} type="report" />
                      <span className="text-xs font-medium text-[#0D9488]">Inspect →</span>
                    </div>
                  </div>
                </div>
              </button>
            </article>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedReport && (
        <div
          onClick={() => {
            setActiveDetailId(null);
            setClaimFeedback(null);
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
                  <span
                    className={`font-semibold ${
                      selectedReport.type === 'lost' ? 'text-rose-700' : 'text-[#0D9488]'
                    }`}
                  >
                    {selectedReport.type === 'lost' ? 'Lost Item Report' : 'Found Item Report'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedReport.category}</span>
                  {selectedReport.isDemo ? (
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
                  {selectedReport.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveDetailId(null);
                  setClaimFeedback(null);
                  setConfirmDeleteId(null);
                }}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                aria-label="Close detail"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-6">
              <ItemMedia
                imageUrl={selectedReport.imageUrl}
                title={selectedReport.title}
                category={selectedReport.category}
                accent="teal"
                className="aspect-[16/9] rounded-xl"
              />

              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <StatusIndicator status={selectedReport.status} type="report" />
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {selectedReport.location}
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {selectedReport.eventDate} · {selectedReport.eventTime}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-500">Description</h4>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {selectedReport.description}
                </p>
              </div>

              {/* Reporter Info (No private phone/email exposed) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500">Reported by (Private contact protected)</p>
                  <p className="text-sm font-semibold text-[#0F1A38] mt-0.5">
                    {selectedReport.reporterName}
                    {selectedReport.reporterBranch ? ` · ${selectedReport.reporterBranch}` : ''}
                    {selectedReport.reporterSemester ? ` · ${selectedReport.reporterSemester}` : ''}
                  </p>
                </div>
                <div className="text-xs">
                  {selectedReport.reporterCollegeVerified ? (
                    <span className="inline-flex items-center gap-1 text-[#0D9488] font-medium">
                      <ShieldCheck className="w-4 h-4" />
                      College-Verified Student
                    </span>
                  ) : (
                    <span className="text-slate-500">Verified Member</span>
                  )}
                </div>
              </div>

              {/* Safe Handover & Verification Box */}
              <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-semibold text-[#0F1A38]">
                  Safe Handover & Ownership Verification
                </h4>
                <p className="text-xs text-slate-600">
                  Preferred Campus Drop Point:{' '}
                  <span className="font-semibold text-[#0F1A38]">
                    {selectedReport.handoverLocation || 'Main Block Security Desk'}
                  </span>
                </p>
                {selectedReport.verificationPrompt && (
                  <p className="text-xs text-slate-600">
                    Hidden-Detail Verification Question:{' '}
                    <span className="font-medium text-[#0F1A38]">
                      “{selectedReport.verificationPrompt}”
                    </span>
                  </p>
                )}
              </div>

              {/* Potential Matches Panel (Deterministic matching, no fake AI claim) */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <div>
                  <h4 className="text-xs font-semibold text-[#0F1A38]">
                    Potential {selectedReport.type === 'lost' ? 'Found' : 'Lost'} Matches
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Attribute-based suggestions using category, location, and keywords (AI vision &
                    semantic matching planned for Phase 2).
                  </p>
                </div>

                {potentialMatches.length === 0 ? (
                  <p className="text-xs text-slate-500 py-1">
                    No close attribute matches found on the opposite board yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {potentialMatches.map((m) => (
                      <button
                        key={m.report.id}
                        type="button"
                        onClick={() => setActiveDetailId(m.report.id)}
                        className="w-full text-left p-3 rounded-lg bg-slate-50 hover:bg-teal-50/60 border border-slate-200 flex items-center justify-between gap-3 transition-colors cursor-pointer"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#0F1A38] truncate">
                            {m.report.title}
                          </p>
                          <p className="text-[11px] text-slate-600 truncate mt-0.5">
                            {m.reasons.join(' · ')}
                          </p>
                        </div>
                        <span className="text-xs font-mono font-semibold text-[#0D9488] shrink-0">
                          View
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Owner Actions vs Claimant Workflow */}
              {selectedReport.isDemo ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                  <p className="font-semibold">Sample Demonstration Record</p>
                  <p>
                    This entry illustrates how campus reports look. To test real claim verification
                    and status transitions, create a live report using the buttons above.
                  </p>
                </div>
              ) : user && selectedReport.reporterId === user.uid ? (
                <div className="border-t border-slate-200 pt-4 space-y-3">
                  <h4 className="text-xs font-semibold text-slate-600">Manage Your Report</h4>
                  <div className="flex flex-wrap items-center gap-2">
                    {!(selectedReport.status === 'reunited' || selectedReport.status === 'closed') && (
                      <>
                        <button
                          type="button"
                          onClick={() => openEditComposer(selectedReport)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit Details
                        </button>
                        {selectedReport.status === 'open' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(selectedReport, 'claim_pending')}
                            className="px-3 py-2 text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 rounded-lg hover:bg-amber-100 cursor-pointer"
                          >
                            Mark Claim Pending
                          </button>
                        )}
                        {(selectedReport.status === 'open' ||
                          selectedReport.status === 'claim_pending') && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(selectedReport, 'verified')}
                            className="px-3 py-2 text-xs font-medium bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-lg hover:bg-indigo-100 cursor-pointer"
                          >
                            Mark Verified
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(selectedReport, 'reunited')}
                          className="px-3 py-2 text-xs font-semibold bg-[#0D9488] text-white rounded-lg hover:bg-[#0F766E] cursor-pointer"
                        >
                          Mark Reunited
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(selectedReport, 'closed')}
                          className="px-3 py-2 text-xs font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 cursor-pointer"
                        >
                          Close Report
                        </button>
                      </>
                    )}
                    {confirmDeleteId === selectedReport.id ? (
                      <div className="inline-flex items-center gap-2 ml-auto">
                        <button
                          type="button"
                          disabled={deleteBusy}
                          onClick={() => void handleDelete(selectedReport)}
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
                        onClick={() => setConfirmDeleteId(selectedReport.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 rounded-lg ml-auto cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ) : selectedReport.status === 'reunited' || selectedReport.status === 'closed' ? (
                <p className="text-xs text-slate-500 border-t border-slate-200 pt-4">
                  This report is marked {selectedReport.status} and is no longer accepting claims.
                </p>
              ) : (
                <form
                  onSubmit={handleClaimSubmit}
                  className="border-t border-slate-200 pt-5 space-y-3"
                >
                  <h4 className="font-display text-sm font-bold text-[#0F1A38]">
                    {selectedReport.type === 'found'
                      ? 'Submit Ownership Verification Claim'
                      : 'Report Sighting / Found Match'}
                  </h4>
                  {user && !user.emailVerified && (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                      Verify your email address first (from Dashboard or Profile) before submitting
                      ownership claims.
                    </div>
                  )}
                  {claimFeedback && (
                    <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 text-xs text-teal-900">
                      {claimFeedback}
                    </div>
                  )}
                  {selectedReport.verificationPrompt && (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Answer Verification Prompt: “{selectedReport.verificationPrompt}”
                      </label>
                      <input
                        type="text"
                        required
                        value={claimAnswer}
                        onChange={(e) => setClaimAnswer(e.target.value)}
                        placeholder="Enter identifying detail..."
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0D9488]"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Preferred Campus Handover Desk
                    </label>
                    <select
                      value={claimHandoverPoint}
                      onChange={(e) => setClaimHandoverPoint(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#0D9488]"
                    >
                      {campusConfig.campusDropPoints.map((pt) => (
                        <option key={pt} value={pt}>
                          {pt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Message for Reporter
                    </label>
                    <textarea
                      required
                      minLength={5}
                      rows={2}
                      value={claimMessage}
                      onChange={(e) => setClaimMessage(e.target.value)}
                      placeholder="Describe when you can meet at the security desk or library counter..."
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0D9488]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={claimBusy || !user?.emailVerified}
                    className="min-h-[40px] px-4 py-2 text-xs font-semibold text-white bg-[#0D9488] hover:bg-[#0F766E] rounded-lg transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    {claimBusy ? 'Submitting...' : 'Submit Verification Claim'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Report Modal */}
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
                {editingReport
                  ? 'Edit Report'
                  : formType === 'lost'
                    ? 'Report Lost Item'
                    : 'Report Found Item'}
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

              {!editingReport && (
                <div className="inline-flex p-1 bg-slate-100 rounded-lg">
                  {(['lost', 'found'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormType(t)}
                      className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                        formType === t
                          ? 'bg-white text-[#0F1A38] shadow-xs'
                          : 'text-slate-600 hover:text-[#0F1A38]'
                      }`}
                    >
                      {t === 'lost' ? 'I Lost Something' : 'I Found Something'}
                    </button>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={100}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Navy Blue Cardholder Wallet or Casio Calculator"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0D9488]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as LostFoundCategory)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#0D9488]"
                  >
                    {LOST_FOUND_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Campus Location
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#0D9488]"
                  >
                    {CAMPUS_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
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
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0D9488]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Approximate Time
                  </label>
                  <input
                    type="time"
                    required
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0D9488]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Description (Color, brand, landmarks — avoid sharing private phone numbers)
                </label>
                <textarea
                  required
                  minLength={10}
                  maxLength={1000}
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe distinct visual traits and exact room/floor..."
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0D9488]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Hidden-Detail Verification Question
                  </label>
                  <input
                    type="text"
                    maxLength={200}
                    value={verificationPrompt}
                    onChange={(e) => setVerificationPrompt(e.target.value)}
                    placeholder="e.g. What sticker is inside the case?"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0D9488]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Safe Handover Desk
                  </label>
                  <select
                    value={handoverLocation}
                    onChange={(e) => setHandoverLocation(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#0D9488]"
                  >
                    {campusConfig.campusDropPoints.map((pt) => (
                      <option key={pt} value={pt}>
                        {pt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Item Photo (Optional)
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    {uploadingImg ? 'Uploading...' : imageUrl ? 'Replace Photo' : 'Upload Photo'}
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
                        alt="Uploaded item preview"
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
                  className="min-h-[40px] px-5 py-2 text-xs font-semibold text-white bg-[#0D9488] hover:bg-[#0F766E] rounded-lg transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {submitting
                    ? 'Saving...'
                    : editingReport
                      ? 'Save Changes'
                      : 'Publish Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
