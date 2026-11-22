import type {
  EventCategory,
  ExchangeCategory,
  ExchangeListing,
  ItemCondition,
  ListingType,
  LostFoundCategory,
  LostFoundReport,
} from '../types/unilink';

export const ID_REGEX = /^[a-zA-Z0-9_-]+$/;
export const DATE_REGEX = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;

export const LOST_FOUND_CATEGORIES: LostFoundCategory[] = [
  'ID & Cards',
  'Electronics',
  'Books & Notes',
  'Keys & Wallets',
  'Accessories',
  'Lab Gear',
  'Other',
];

export const EXCHANGE_CATEGORIES: ExchangeCategory[] = [
  'Books & Notes',
  'Calculators',
  'Lab Kits',
  'Electronics',
  'Hostel & Gear',
  'Other',
];

export const ITEM_CONDITIONS: ItemCondition[] = [
  'Like New',
  'Good',
  'Fair',
  'Well Used',
];

export const LISTING_TYPES: { value: ListingType; label: string; hint: string }[] = [
  { value: 'donate', label: 'Donate', hint: 'Free for juniors in need' },
  { value: 'sell', label: 'Sell', hint: 'Affordable pre-loved gear' },
  { value: 'swap', label: 'Swap', hint: 'Trade one item for another' },
  { value: 'borrow', label: 'Borrow', hint: 'Temporary loan with return date' },
];

export const CAMPUS_LOCATIONS = [
  'Central Library',
  'Main Block Atrium',
  'CSE & IT Labs',
  'ECE & Robotics Block',
  'Mechanical Workshop',
  'Student Canteen',
  'Sports Complex',
  'Main Gate Security Desk',
  'Hostel Block A/B',
  'Auditorium Lobby',
];

export const CAMPUS_DROP_POINTS = [
  'Main Block Security Desk',
  'Central Library Help Counter',
  'Student Activity Center',
  'ECE Block Reception',
  'Hostel Warden Office',
];

export const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Information Science & Engineering',
  'Electronics & Communication',
  'Electrical & Electronics',
  'Mechanical Engineering',
  'Civil Engineering',
  'Artificial Intelligence & ML',
  'Biotechnology',
];

export const SEMESTERS = [
  'Sem 1',
  'Sem 2',
  'Sem 3',
  'Sem 4',
  'Sem 5',
  'Sem 6',
  'Sem 7',
  'Sem 8',
];

export const EVENT_CATEGORIES: EventCategory[] = [
  'Tech & Hackathons',
  'Workshops & Seminars',
  'Cultural & Fests',
  'Clubs & Meetups',
  'Sports & Wellness',
  'Placement & Career',
  'Other',
];

// Blueprint-synchronized volumetric limits
export const LIMITS = {
  displayName: { min: 2, max: 80 },
  email: { min: 3, max: 160 },
  department: { max: 80 },
  branch: { max: 80 },
  semester: { max: 30 },
  photoUrl: { max: 500 },
  bio: { max: 300 },
  reportTitle: { min: 3, max: 100 },
  listingTitle: { min: 3, max: 120 },
  eventTitle: { min: 3, max: 120 },
  organizer: { min: 2, max: 100 },
  description: { min: 10, max: 1000 },
  location: { min: 2, max: 120 },
  eventTime: { min: 2, max: 20 },
  verificationPrompt: { max: 200 },
  handoverLocation: { max: 120 },
  swapFor: { max: 120 },
  borrowDuration: { max: 60 },
  subjectCode: { max: 40 },
  message: { min: 5, max: 500 },
  verificationAnswer: { max: 300 },
  priceMax: 100000,
} as const;

export function clampString(value: string, max: number): string {
  return value.trim().slice(0, max);
}

export function isAllowedCollegeEmail(email: string, allowedDomains: string[]): boolean {
  const normalized = email.trim().toLowerCase();
  const atIndex = normalized.lastIndexOf('@');
  if (atIndex < 1) return false;
  const domain = normalized.slice(atIndex + 1);
  if (!domain) return false;

  return allowedDomains.some((entry) => {
    const clean = entry.trim().toLowerCase().replace(/^@/, '');
    if (!clean) return false;
    return domain === clean || domain.endsWith(`.${clean}`);
  });
}

export interface ValidationErrorMap {
  [field: string]: string;
}

export function validateProfileInput(input: {
  displayName: string;
  department: string;
  branch: string;
  semester: string;
  photoUrl: string;
  bio: string;
}): ValidationErrorMap {
  const errors: ValidationErrorMap = {};
  const name = input.displayName.trim();
  if (name.length < LIMITS.displayName.min || name.length > LIMITS.displayName.max) {
    errors.displayName = `Full name must be ${LIMITS.displayName.min}–${LIMITS.displayName.max} characters.`;
  }
  if (input.department.trim().length > LIMITS.department.max) {
    errors.department = `Department must be under ${LIMITS.department.max} characters.`;
  }
  if (input.branch.trim().length > LIMITS.branch.max) {
    errors.branch = `Branch must be under ${LIMITS.branch.max} characters.`;
  }
  if (input.semester.trim().length > LIMITS.semester.max) {
    errors.semester = `Semester must be under ${LIMITS.semester.max} characters.`;
  }
  if (input.photoUrl.trim().length > LIMITS.photoUrl.max) {
    errors.photoUrl = `Photo URL must be under ${LIMITS.photoUrl.max} characters.`;
  }
  if (input.bio.trim().length > LIMITS.bio.max) {
    errors.bio = `Bio must be under ${LIMITS.bio.max} characters.`;
  }
  return errors;
}

export function validateLostFoundInput(input: {
  title: string;
  description: string;
  category: string;
  location: string;
  eventDate: string;
  eventTime: string;
  verificationPrompt: string;
  handoverLocation: string;
  imageUrl: string;
}): ValidationErrorMap {
  const errors: ValidationErrorMap = {};
  const title = input.title.trim();
  const description = input.description.trim();
  const location = input.location.trim();

  if (title.length < LIMITS.reportTitle.min || title.length > LIMITS.reportTitle.max) {
    errors.title = `Item title must be ${LIMITS.reportTitle.min}–${LIMITS.reportTitle.max} characters.`;
  }
  if (description.length < LIMITS.description.min || description.length > LIMITS.description.max) {
    errors.description = `Description must be ${LIMITS.description.min}–${LIMITS.description.max} characters.`;
  }
  if (!LOST_FOUND_CATEGORIES.includes(input.category as LostFoundCategory)) {
    errors.category = 'Please choose a valid item category.';
  }
  if (location.length < LIMITS.location.min || location.length > LIMITS.location.max) {
    errors.location = `Location must be ${LIMITS.location.min}–${LIMITS.location.max} characters.`;
  }
  if (!DATE_REGEX.test(input.eventDate.trim())) {
    errors.eventDate = 'Date must follow YYYY-MM-DD format.';
  }
  if (input.eventTime.trim().length < LIMITS.eventTime.min || input.eventTime.trim().length > LIMITS.eventTime.max) {
    errors.eventTime = 'Please specify an approximate time.';
  }
  if (input.verificationPrompt.trim().length > LIMITS.verificationPrompt.max) {
    errors.verificationPrompt = `Verification question must be under ${LIMITS.verificationPrompt.max} characters.`;
  }
  if (input.handoverLocation.trim().length > LIMITS.handoverLocation.max) {
    errors.handoverLocation = `Handover point must be under ${LIMITS.handoverLocation.max} characters.`;
  }
  if (input.imageUrl.trim().length > LIMITS.photoUrl.max) {
    errors.imageUrl = `Image URL must be under ${LIMITS.photoUrl.max} characters.`;
  }
  return errors;
}

export function validateListingInput(input: {
  title: string;
  description: string;
  listingType: ListingType;
  category: string;
  condition: string;
  price: number;
  swapFor: string;
  borrowDuration: string;
  pickupLocation: string;
  imageUrl: string;
}): ValidationErrorMap {
  const errors: ValidationErrorMap = {};
  if (input.title.trim().length < LIMITS.listingTitle.min || input.title.trim().length > LIMITS.listingTitle.max) {
    errors.title = `Title must be ${LIMITS.listingTitle.min}–${LIMITS.listingTitle.max} characters.`;
  }
  if (input.description.trim().length < LIMITS.description.min || input.description.trim().length > LIMITS.description.max) {
    errors.description = `Description must be ${LIMITS.description.min}–${LIMITS.description.max} characters.`;
  }
  if (!EXCHANGE_CATEGORIES.includes(input.category as ExchangeCategory)) {
    errors.category = 'Select a valid exchange category.';
  }
  if (!ITEM_CONDITIONS.includes(input.condition as ItemCondition)) {
    errors.condition = 'Select a valid condition.';
  }
  if (input.listingType === 'sell') {
    if (!Number.isFinite(input.price) || input.price < 0 || input.price > LIMITS.priceMax) {
      errors.price = `Price must be between 0 and ${LIMITS.priceMax}.`;
    }
  }
  if (input.listingType === 'swap' && input.swapFor.trim().length < 2) {
    errors.swapFor = 'Specify what item you would like to swap for.';
  }
  if (input.listingType === 'borrow' && input.borrowDuration.trim().length < 2) {
    errors.borrowDuration = 'Specify the borrow duration or return-by period.';
  }
  if (input.pickupLocation.trim().length < LIMITS.location.min || input.pickupLocation.trim().length > LIMITS.location.max) {
    errors.pickupLocation = `Pickup location must be ${LIMITS.location.min}–${LIMITS.location.max} characters.`;
  }
  if (input.imageUrl.trim().length > LIMITS.photoUrl.max) {
    errors.imageUrl = `Image URL must be under ${LIMITS.photoUrl.max} characters.`;
  }
  return errors;
}

export interface PotentialMatchCandidate {
  report: LostFoundReport;
  matchScore: number;
  reasons: string[];
}

/**
 * Deterministic keyword, category, and location heuristic for potential-match suggestions.
 * Clearly presented in UI as basic attribute matching (prepared for future AI semantic matching).
 */
export function findPotentialMatches(
  target: LostFoundReport,
  candidates: LostFoundReport[],
): PotentialMatchCandidate[] {
  const oppositeType = target.type === 'lost' ? 'found' : 'lost';
  const stopWords = new Set(['with', 'from', 'near', 'the', 'and', 'for', 'this', 'that', 'have', 'lost', 'found', 'item']);
  const targetTokens = new Set(
    `${target.title} ${target.description}`
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !stopWords.has(w)),
  );

  return candidates
    .filter(
      (c) =>
        c.id !== target.id &&
        c.type === oppositeType &&
        c.status !== 'reunited' &&
        c.status !== 'closed',
    )
    .map((candidate) => {
      let score = 0;
      const reasons: string[] = [];

      if (candidate.category === target.category) {
        score += 40;
        reasons.push(`Same category (${candidate.category})`);
      }

      const candLoc = candidate.location.toLowerCase();
      const targLoc = target.location.toLowerCase();
      if (candLoc === targLoc || candLoc.includes(targLoc) || targLoc.includes(candLoc)) {
        score += 30;
        reasons.push(`Matching location (${candidate.location})`);
      }

      const candidateTokens = `${candidate.title} ${candidate.description}`
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length >= 3 && !stopWords.has(w));
      const sharedKeywords = Array.from(new Set(candidateTokens.filter((w) => targetTokens.has(w))));
      if (sharedKeywords.length > 0) {
        score += Math.min(30, sharedKeywords.length * 12);
        reasons.push(`Shared keywords: ${sharedKeywords.slice(0, 3).join(', ')}`);
      }

      return { report: candidate, matchScore: score, reasons };
    })
    .filter((m) => m.matchScore >= 40)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);
}

export function isSeniorToJuniorRecommended(
  listing: ExchangeListing,
  userBranch?: string,
  userSemester?: string,
): boolean {
  if (!listing.targetBranch && !listing.targetSemester) return false;
  const branchMatch =
    Boolean(userBranch) &&
    Boolean(listing.targetBranch) &&
    listing.targetBranch.toLowerCase().includes(userBranch!.toLowerCase());
  const semMatch =
    Boolean(userSemester) &&
    Boolean(listing.targetSemester) &&
    listing.targetSemester.toLowerCase() === userSemester!.toLowerCase();
  return branchMatch || semMatch;
}

export function validateEventInput(input: {
  title: string;
  description: string;
  category: string;
  eventDate: string;
  eventTime: string;
  location: string;
  organizer: string;
  imageUrl: string;
}): ValidationErrorMap {
  const errors: ValidationErrorMap = {};
  const title = input.title.trim();
  const description = input.description.trim();
  const location = input.location.trim();
  const organizer = input.organizer.trim();

  if (title.length < LIMITS.eventTitle.min || title.length > LIMITS.eventTitle.max) {
    errors.title = `Event title must be ${LIMITS.eventTitle.min}–${LIMITS.eventTitle.max} characters.`;
  }
  if (description.length < LIMITS.description.min || description.length > LIMITS.description.max) {
    errors.description = `Description must be ${LIMITS.description.min}–${LIMITS.description.max} characters.`;
  }
  if (!EVENT_CATEGORIES.includes(input.category as EventCategory)) {
    errors.category = 'Select a valid event category.';
  }
  if (!DATE_REGEX.test(input.eventDate.trim())) {
    errors.eventDate = 'Date must follow YYYY-MM-DD format.';
  }
  if (input.eventTime.trim().length < LIMITS.eventTime.min || input.eventTime.trim().length > LIMITS.eventTime.max) {
    errors.eventTime = 'Please specify the event time.';
  }
  if (location.length < LIMITS.location.min || location.length > LIMITS.location.max) {
    errors.location = `Location must be ${LIMITS.location.min}–${LIMITS.location.max} characters.`;
  }
  if (organizer.length < LIMITS.organizer.min || organizer.length > LIMITS.organizer.max) {
    errors.organizer = `Organizer must be ${LIMITS.organizer.min}–${LIMITS.organizer.max} characters.`;
  }
  if (input.imageUrl.trim().length > LIMITS.photoUrl.max) {
    errors.imageUrl = `Image URL must be under ${LIMITS.photoUrl.max} characters.`;
  }
  return errors;
}

