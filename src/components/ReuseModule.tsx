import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
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
import { DEMO_LISTINGS } from '../data/demoData';
import { uploadCampusItemImage } from '../lib/mediaUpload';
import {
  CAMPUS_DROP_POINTS,
  DEPARTMENTS,
  EXCHANGE_CATEGORIES,
  isSeniorToJuniorRecommended,
  ITEM_CONDITIONS,
  LISTING_TYPES,
  SEMESTERS,
  validateListingInput,
} from '../lib/validation';
import {
  createExchangeListing,
  createItemRequest,
  deleteExchangeListing,
  updateExchangeListingAvailability,
  updateExchangeListingDetails,
} from '../services/firestoreService';
import type {
  ExchangeCategory,
  ExchangeListing,
  ItemCondition,
  ListingAvailability,
  ListingType,
} from '../types/unilink';
import { ItemMedia, StatusIndicator } from './BrandAndMedia';

interface ReuseModuleProps {
  listings: ExchangeListing[];
  loading: boolean;
  openCreateTrigger?: boolean;
  onClearCreateTrigger?: () => void;
  selectedListingId?: string | null;
  onSelectListingId?: (id: string | null) => void;
}

export function ReuseModule({
  listings,
  loading,
  openCreateTrigger,
  onClearCreateTrigger,
  selectedListingId,
  onSelectListingId,
}: ReuseModuleProps) {
  const { user, profile, campusConfig } = useAuth();

  const [typeFilter, setTypeFilter] = useState<'all' | ListingType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [conditionFilter, setConditionFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [bookChainOnly, setBookChainOnly] = useState(false);
  const [includeDemos, setIncludeDemos] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [composerOpen, setComposerOpen] = useState(Boolean(openCreateTrigger));
  const [editingListing, setEditingListing] = useState<ExchangeListing | null>(null);
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);

  const activeDetailId = selectedListingId !== undefined ? selectedListingId : internalSelectedId;
  const setActiveDetailId = (id: string | null) => {
    if (onSelectListingId) onSelectListingId(id);
    else setInternalSelectedId(id);
  };

  // Composer State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [listingType, setListingType] = useState<ListingType>('donate');
  const [category, setCategory] = useState<ExchangeCategory>(EXCHANGE_CATEGORIES[0]);
  const [condition, setCondition] = useState<ItemCondition>('Good');
  const [price, setPrice] = useState<number>(0);
  const [swapFor, setSwapFor] = useState('');
  const [borrowDuration, setBorrowDuration] = useState('');
  const [targetBranch, setTargetBranch] = useState(profile?.branch || '');
  const [targetSemester, setTargetSemester] = useState(profile?.semester || '');
  const [subjectCode, setSubjectCode] = useState('');
  const [pickupLocation, setPickupLocation] = useState(
    campusConfig.campusDropPoints[0] || CAMPUS_DROP_POINTS[0],
  );
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImg, setUploadingImg] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Request Item State
  const [requestMsg, setRequestMsg] = useState('');
  const [requestPoint, setRequestPoint] = useState(
    campusConfig.campusDropPoints[0] || CAMPUS_DROP_POINTS[0],
  );
  const [requestBusy, setRequestBusy] = useState(false);
  const [requestFeedback, setRequestFeedback] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

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
        else if (activeDetailId) {
          setActiveDetailId(null);
          setRequestFeedback(null);
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
    conditionFilter !== 'all' ||
    availabilityFilter !== 'all' ||
    bookChainOnly ||
    searchQuery.trim().length > 0;

  const clearFilters = () => {
    setTypeFilter('all');
    setCategoryFilter('all');
    setConditionFilter('all');
    setAvailabilityFilter('all');
    setBookChainOnly(false);
    setSearchQuery('');
  };

  const allListings = useMemo(() => {
    return includeDemos ? [...listings, ...DEMO_LISTINGS] : listings;
  }, [listings, includeDemos]);

  const filteredListings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allListings.filter((item) => {
      if (typeFilter !== 'all' && item.listingType !== typeFilter) return false;
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (conditionFilter !== 'all' && item.condition !== conditionFilter) return false;
      if (availabilityFilter !== 'all' && item.availability !== availabilityFilter) return false;
      if (bookChainOnly && !item.targetBranch && !item.targetSemester) return false;
      if (q) {
        const hay = `${item.title} ${item.description} ${item.category} ${item.targetBranch} ${item.subjectCode}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    allListings,
    typeFilter,
    categoryFilter,
    conditionFilter,
    availabilityFilter,
    bookChainOnly,
    searchQuery,
  ]);

  const selectedListing = useMemo(
    () => allListings.find((l) => l.id === activeDetailId) || null,
    [allListings, activeDetailId],
  );

  function openNewComposer() {
    setEditingListing(null);
    setTitle('');
    setDescription('');
    setListingType('donate');
    setCategory(EXCHANGE_CATEGORIES[0]);
    setCondition('Good');
    setPrice(0);
    setSwapFor('');
    setBorrowDuration('');
    setTargetBranch(profile?.branch || '');
    setTargetSemester(profile?.semester || '');
    setSubjectCode('');
    setPickupLocation(campusConfig.campusDropPoints[0] || CAMPUS_DROP_POINTS[0]);
    setImageUrl('');
    setFormError(null);
    setComposerOpen(true);
  }

  function openEditComposer(listing: ExchangeListing) {
    setEditingListing(listing);
    setTitle(listing.title);
    setDescription(listing.description);
    setListingType(listing.listingType);
    setCategory(listing.category);
    setCondition(listing.condition);
    setPrice(listing.price);
    setSwapFor(listing.swapFor);
    setBorrowDuration(listing.borrowDuration);
    setTargetBranch(listing.targetBranch);
    setTargetSemester(listing.targetSemester);
    setSubjectCode(listing.subjectCode);
    setPickupLocation(listing.pickupLocation);
    setImageUrl(listing.imageUrl);
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
      setFormError('Please sign in to create a listing.');
      return;
    }
    if (!user.emailVerified) {
      setFormError('Please verify your email address before creating listings.');
      return;
    }

    const effectivePrice = listingType === 'sell' ? Number(price) : 0;
    const errors = validateListingInput({
      title,
      description,
      listingType,
      category,
      condition,
      price: effectivePrice,
      swapFor,
      borrowDuration,
      pickupLocation,
      imageUrl,
    });
    const firstError = Object.values(errors)[0];
    if (firstError) {
      setFormError(firstError);
      return;
    }

    setSubmitting(true);
    try {
      if (editingListing) {
        await updateExchangeListingDetails(
          editingListing.id,
          {
            title,
            description,
            listingType,
            category,
            condition,
            price: effectivePrice,
            swapFor,
            borrowDuration,
            targetBranch,
            targetSemester,
            subjectCode,
            pickupLocation,
            imageUrl,
          },
          profile,
        );
        setFeedbackMsg('Listing updated.');
      } else {
        const id = await createExchangeListing(
          {
            title,
            description,
            listingType,
            category,
            condition,
            price: effectivePrice,
            swapFor,
            borrowDuration,
            targetBranch,
            targetSemester,
            subjectCode,
            pickupLocation,
            imageUrl,
          },
          profile,
        );
        setFeedbackMsg('Listing published to ReLife Exchange.');
        setActiveDetailId(id);
      }
      setComposerOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save listing.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAvailabilityChange = async (
    listing: ExchangeListing,
    next: ListingAvailability,
  ) => {
    try {
      await updateExchangeListingAvailability(listing.id, next);
      setFeedbackMsg(`Listing marked as ${next}.`);
    } catch (err) {
      setFeedbackMsg(err instanceof Error ? err.message : 'Could not update availability.');
    }
  };

  const handleDelete = async (listing: ExchangeListing) => {
    setDeleteBusy(true);
    try {
      await deleteExchangeListing(listing.id);
      setConfirmDeleteId(null);
      setActiveDetailId(null);
      setFeedbackMsg('Listing removed.');
    } catch (err) {
      setFeedbackMsg(err instanceof Error ? err.message : 'Could not remove listing.');
    } finally {
      setDeleteBusy(false);
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListing || !profile || !user?.emailVerified) return;
    setRequestBusy(true);
    setRequestFeedback(null);
    try {
      await createItemRequest(
        {
          targetType: 'exchange',
          targetId: selectedListing.id,
          targetTitle: selectedListing.title,
          ownerId: selectedListing.sellerId,
          ownerName: selectedListing.sellerName,
          message: requestMsg.trim(),
          verificationAnswer: '',
          proposedHandoverPoint: requestPoint,
        },
        profile,
      );
      setRequestMsg('');
      setRequestFeedback(
        'Request sent! Track its approval in your Dashboard Requests inbox.',
      );
    } catch (err) {
      setRequestFeedback(err instanceof Error ? err.message : 'Failed to submit request.');
    } finally {
      setRequestBusy(false);
    }
  };

  const formatListingPrice = (item: ExchangeListing) => {
    if (item.listingType === 'sell') return `₹${item.price}`;
    if (item.listingType === 'donate') return 'Free (Donate)';
    if (item.listingType === 'swap') return 'Swap';
    return 'Borrow';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#0F1A38]">
            ReLife Exchange
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Donate, sell, swap, or borrow books, calculators, and lab kits across semesters.
          </p>
        </div>

        <button
          type="button"
          onClick={openNewComposer}
          className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#EA580C] hover:bg-amber-700 text-white text-xs font-semibold transition-colors whitespace-nowrap self-start md:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Exchange Listing
        </button>
      </div>

      {/* Senior -> Junior Book Chain Callout */}
      <div className="bg-[#0F1A38] text-white rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#F59E0B]/20 text-[#F59E0B] flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display text-sm font-bold">Senior → Junior Book Chain</h3>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              Filter resources tagged with branch, subject code, and semester so juniors inherit
              textbooks and lab gear directly from outgoing seniors.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setBookChainOnly((v) => !v)}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            bookChainOnly
              ? 'bg-[#F59E0B] text-[#0F1A38]'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          {bookChainOnly ? 'Showing Book Chain Only' : 'Filter Book Chain Items'}
        </button>
      </div>

      {feedbackMsg && (
        <div className="flex items-center justify-between gap-3 p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#EA580C] shrink-0" />
            {feedbackMsg}
          </span>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-amber-700 hover:text-amber-950 cursor-pointer"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="inline-flex flex-wrap p-1 bg-slate-100 rounded-lg self-start">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                typeFilter === 'all'
                  ? 'bg-white text-[#EA580C] shadow-xs'
                  : 'text-slate-600 hover:text-[#0F1A38]'
              }`}
            >
              All Types
            </button>
            {LISTING_TYPES.map((lt) => (
              <button
                key={lt.value}
                type="button"
                onClick={() => setTypeFilter(lt.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  typeFilter === lt.value
                    ? 'bg-white text-[#EA580C] shadow-xs'
                    : 'text-slate-600 hover:text-[#0F1A38]'
                }`}
              >
                {lt.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, subject code, or branch..."
              className="w-full pl-9 pr-9 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/30 focus:border-[#EA580C]"
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
            className="px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-[#EA580C]"
          >
            <option value="all">All Categories</option>
            {EXCHANGE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            aria-label="Filter by condition"
            className="px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-[#EA580C]"
          >
            <option value="all">Any Condition</option>
            {ITEM_CONDITIONS.map((cond) => (
              <option key={cond} value={cond}>
                {cond}
              </option>
            ))}
          </select>

          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            aria-label="Filter by availability"
            className="px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-[#EA580C]"
          >
            <option value="all">All Availability</option>
            <option value="available">Available</option>
            <option value="requested">Requested</option>
            <option value="reserved">Reserved</option>
            <option value="completed">Completed</option>
          </select>

          <label className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg bg-slate-50 cursor-pointer">
            <input
              type="checkbox"
              checked={includeDemos}
              onChange={(e) => setIncludeDemos(e.target.checked)}
              className="rounded border-slate-300 text-[#EA580C] focus:ring-[#EA580C]"
            />
            <span>Show sample demo items</span>
          </label>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span className="tabular-nums">
            Showing <strong className="text-[#0F1A38]">{filteredListings.length}</strong>{' '}
            {filteredListings.length === 1 ? 'listing' : 'listings'}
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="font-semibold text-[#EA580C] hover:underline cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Listings Grid */}
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
      ) : filteredListings.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
          <p className="font-display text-base font-semibold text-[#0F1A38]">
            No matching exchange listings
          </p>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Try adjusting your filters or share a textbook, calculator, or kit you no longer need.
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
              className="px-4 py-2 text-xs font-semibold text-white bg-[#EA580C] hover:bg-amber-700 rounded-lg transition-colors cursor-pointer"
            >
              {hasActiveFilters ? 'Create Listing' : 'Post First Listing'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredListings.map((item) => {
            const branchMatch = isSeniorToJuniorRecommended(
              item,
              profile?.branch || profile?.department,
              profile?.semester,
            );
            return (
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
                    accent="orange"
                  />
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3 w-full">
                    <div className="space-y-1.5">
                      <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500">
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

                      <h3 className="font-display text-base font-semibold text-[#0F1A38] line-clamp-1">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>

                      {(item.targetBranch || item.targetSemester || item.subjectCode) && (
                        <p className="text-[11px] font-medium text-indigo-700 pt-0.5 truncate">
                          Book Chain: {[item.targetBranch, item.targetSemester, item.subjectCode]
                            .filter(Boolean)
                            .join(' · ')}
                          {branchMatch ? ' (Matches your profile)' : ''}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-[#0F1A38] tabular-nums">
                        {formatListingPrice(item)}
                      </span>
                      <StatusIndicator status={item.availability} type="listing" />
                    </div>
                  </div>
                </button>
              </article>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedListing && (
        <div
          onClick={() => {
            setActiveDetailId(null);
            setRequestFeedback(null);
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
                  <span className="font-semibold text-[#EA580C] capitalize">
                    {selectedListing.listingType}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedListing.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedListing.condition}</span>
                  {selectedListing.isDemo ? (
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
                  {selectedListing.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveDetailId(null);
                  setRequestFeedback(null);
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
                imageUrl={selectedListing.imageUrl}
                title={selectedListing.title}
                category={selectedListing.category}
                accent="orange"
                className="aspect-[16/9] rounded-xl"
              />

              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <span className="font-display text-xl font-bold text-[#0F1A38] tabular-nums">
                    {formatListingPrice(selectedListing)}
                  </span>
                  <StatusIndicator status={selectedListing.availability} type="listing" />
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {selectedListing.pickupLocation}
                </span>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-500">Description</h4>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {selectedListing.description}
                </p>
              </div>

              {(selectedListing.swapFor ||
                selectedListing.borrowDuration ||
                selectedListing.targetBranch ||
                selectedListing.subjectCode) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#F8FAFC] border border-slate-200 rounded-xl p-4 text-xs">
                  {selectedListing.swapFor && (
                    <div>
                      <span className="text-slate-500 block">Looking to swap for</span>
                      <span className="font-semibold text-[#0F1A38]">
                        {selectedListing.swapFor}
                      </span>
                    </div>
                  )}
                  {selectedListing.borrowDuration && (
                    <div>
                      <span className="text-slate-500 block">Borrow return window</span>
                      <span className="font-semibold text-[#0F1A38]">
                        {selectedListing.borrowDuration}
                      </span>
                    </div>
                  )}
                  {(selectedListing.targetBranch || selectedListing.targetSemester) && (
                    <div>
                      <span className="text-slate-500 block">Senior → Junior Target</span>
                      <span className="font-semibold text-[#0F1A38]">
                        {[selectedListing.targetBranch, selectedListing.targetSemester]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </div>
                  )}
                  {selectedListing.subjectCode && (
                    <div>
                      <span className="text-slate-500 block">Subject Code</span>
                      <span className="font-mono font-semibold text-[#0F1A38]">
                        {selectedListing.subjectCode}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Seller Info (No private phone/email exposed) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500">Shared by (Private contact protected)</p>
                  <p className="text-sm font-semibold text-[#0F1A38] mt-0.5">
                    {selectedListing.sellerName}
                    {selectedListing.sellerBranch ? ` · ${selectedListing.sellerBranch}` : ''}
                    {selectedListing.sellerSemester ? ` · ${selectedListing.sellerSemester}` : ''}
                  </p>
                </div>
                <div className="text-xs">
                  {selectedListing.sellerCollegeVerified ? (
                    <span className="inline-flex items-center gap-1 text-[#0D9488] font-medium">
                      <ShieldCheck className="w-4 h-4" />
                      College-Verified Student
                    </span>
                  ) : (
                    <span className="text-slate-500">Verified Member</span>
                  )}
                </div>
              </div>

              {/* Owner Controls vs Request Item */}
              {selectedListing.isDemo ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
                  <p className="font-semibold">Sample Demonstration Listing</p>
                  <p>
                    This listing is part of the campus preview dataset. Create a real listing in
                    ReLife Exchange to test live Firestore persistence, editing, and item requests.
                  </p>
                </div>
              ) : user && selectedListing.sellerId === user.uid ? (
                <div className="border-t border-slate-200 pt-4 space-y-3">
                  <h4 className="text-xs font-semibold text-slate-600">Manage Your Listing</h4>
                  <div className="flex flex-wrap items-center gap-2">
                    {!(
                      selectedListing.availability === 'completed' ||
                      selectedListing.availability === 'removed'
                    ) && (
                      <>
                        <button
                          type="button"
                          onClick={() => openEditComposer(selectedListing)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit Listing
                        </button>
                        {selectedListing.availability !== 'reserved' && (
                          <button
                            type="button"
                            onClick={() => handleAvailabilityChange(selectedListing, 'reserved')}
                            className="px-3 py-2 text-xs font-medium bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-lg hover:bg-indigo-100 cursor-pointer"
                          >
                            Mark Reserved
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleAvailabilityChange(selectedListing, 'completed')}
                          className="px-3 py-2 text-xs font-semibold bg-[#EA580C] text-white rounded-lg hover:bg-amber-700 cursor-pointer"
                        >
                          Mark Completed
                        </button>
                      </>
                    )}
                    {confirmDeleteId === selectedListing.id ? (
                      <div className="inline-flex items-center gap-2 ml-auto">
                        <button
                          type="button"
                          disabled={deleteBusy}
                          onClick={() => void handleDelete(selectedListing)}
                          className="px-3 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer disabled:opacity-60"
                        >
                          {deleteBusy ? 'Removing...' : 'Confirm Remove'}
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
                        onClick={() => setConfirmDeleteId(selectedListing.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 rounded-lg ml-auto cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ) : selectedListing.availability === 'completed' ||
                selectedListing.availability === 'removed' ? (
                <p className="text-xs text-slate-500 border-t border-slate-200 pt-4">
                  This listing is {selectedListing.availability} and no longer open for requests.
                </p>
              ) : (
                <form
                  onSubmit={handleRequestSubmit}
                  className="border-t border-slate-200 pt-5 space-y-3"
                >
                  <h4 className="font-display text-sm font-bold text-[#0F1A38]">
                    Request This Item
                  </h4>
                  {user && !user.emailVerified && (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                      Verify your email address first (from Dashboard or Profile) before requesting
                      exchange items.
                    </div>
                  )}
                  {requestFeedback && (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                      {requestFeedback}
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Proposed Campus Pickup Point
                    </label>
                    <select
                      value={requestPoint}
                      onChange={(e) => setRequestPoint(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#EA580C]"
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
                      Message to Student
                    </label>
                    <textarea
                      required
                      minLength={5}
                      rows={2}
                      value={requestMsg}
                      onChange={(e) => setRequestMsg(e.target.value)}
                      placeholder="Introduce your branch/semester and propose a campus pickup time..."
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#EA580C]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={requestBusy || !user?.emailVerified}
                    className="min-h-[40px] px-4 py-2 text-xs font-semibold text-white bg-[#EA580C] hover:bg-amber-700 rounded-lg transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    {requestBusy ? 'Sending Request...' : 'Send Item Request'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
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
                {editingListing ? 'Edit Exchange Listing' : 'Create ReLife Exchange Listing'}
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
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Listing Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {LISTING_TYPES.map((lt) => (
                    <button
                      key={lt.value}
                      type="button"
                      onClick={() => setListingType(lt.value)}
                      className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                        listingType === lt.value
                          ? 'border-[#EA580C] bg-amber-50/70 text-[#0F1A38]'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <span className="block text-xs font-semibold">{lt.label}</span>
                      <span className="block text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                        {lt.hint}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={120}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Casio FX-991EX Calculator or Sem 4 DBMS Textbook"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#EA580C]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExchangeCategory)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#EA580C]"
                  >
                    {EXCHANGE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Condition
                  </label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as ItemCondition)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#EA580C]"
                  >
                    {ITEM_CONDITIONS.map((cond) => (
                      <option key={cond} value={cond}>
                        {cond}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {listingType === 'sell' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100000}
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#EA580C]"
                  />
                </div>
              )}

              {listingType === 'swap' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Desired Item in Swap
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={swapFor}
                    onChange={(e) => setSwapFor(e.target.value)}
                    placeholder="e.g. Sem 5 Computer Networks book or breadboard wires"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#EA580C]"
                  />
                </div>
              )}

              {listingType === 'borrow' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Return-by Period / Duration
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={60}
                    value={borrowDuration}
                    onChange={(e) => setBorrowDuration(e.target.value)}
                    placeholder="e.g. Until end of Semester 4 exams"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#EA580C]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  required
                  minLength={10}
                  maxLength={1000}
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Share edition, included accessories, or wear details..."
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#EA580C]"
                />
              </div>

              {/* Senior -> Junior Book Chain Fields */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                <p className="text-xs font-semibold text-[#0F1A38]">
                  Senior → Junior Book Chain Tagging (Optional)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <select
                    value={targetBranch}
                    onChange={(e) => setTargetBranch(e.target.value)}
                    className="px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="">Target Branch</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <select
                    value={targetSemester}
                    onChange={(e) => setTargetSemester(e.target.value)}
                    className="px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="">Target Semester</option>
                    {SEMESTERS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    maxLength={40}
                    value={subjectCode}
                    onChange={(e) => setSubjectCode(e.target.value)}
                    placeholder="Subject Code (e.g. CS302)"
                    className="px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Campus Pickup Location
                  </label>
                  <select
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#EA580C]"
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
                    Item Photo (Optional)
                  </label>
                  <div className="flex flex-wrap items-center gap-3 pt-0.5">
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
                          alt="Uploaded listing preview"
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
                  className="min-h-[40px] px-5 py-2 text-xs font-semibold text-white bg-[#EA580C] hover:bg-amber-700 rounded-lg transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {submitting
                    ? 'Saving...'
                    : editingListing
                      ? 'Save Changes'
                      : 'Publish Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
