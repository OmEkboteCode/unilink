export type ReportType = 'lost' | 'found';

export type LostFoundCategory =
  | 'ID & Cards'
  | 'Electronics'
  | 'Books & Notes'
  | 'Keys & Wallets'
  | 'Accessories'
  | 'Lab Gear'
  | 'Other';

export type LostFoundStatus =
  | 'open'
  | 'claim_pending'
  | 'verified'
  | 'reunited'
  | 'closed';

export type ListingType = 'donate' | 'sell' | 'swap' | 'borrow';

export type ExchangeCategory =
  | 'Books & Notes'
  | 'Calculators'
  | 'Lab Kits'
  | 'Electronics'
  | 'Hostel & Gear'
  | 'Other';

export type ItemCondition = 'Like New' | 'Good' | 'Fair' | 'Well Used';

export type ListingAvailability =
  | 'available'
  | 'requested'
  | 'reserved'
  | 'completed'
  | 'removed';

export type RequestStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'completed'
  | 'cancelled';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  emailVerified: boolean;
  collegeDomainVerified: boolean;
  department: string;
  branch: string;
  semester: string;
  photoUrl: string;
  bio: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface LostFoundReport {
  id: string;
  type: ReportType;
  title: string;
  description: string;
  category: LostFoundCategory;
  imageUrl: string;
  location: string;
  eventDate: string;
  eventTime: string;
  status: LostFoundStatus;
  verificationPrompt: string;
  handoverLocation: string;
  visibility: 'campus' | 'archived';
  reporterId: string;
  reporterName: string;
  reporterBranch: string;
  reporterSemester: string;
  reporterCollegeVerified: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
  isDemo?: boolean;
}

export interface ExchangeListing {
  id: string;
  title: string;
  description: string;
  listingType: ListingType;
  category: ExchangeCategory;
  condition: ItemCondition;
  price: number;
  swapFor: string;
  borrowDuration: string;
  targetBranch: string;
  targetSemester: string;
  subjectCode: string;
  pickupLocation: string;
  imageUrl: string;
  availability: ListingAvailability;
  visibility: 'campus' | 'archived';
  sellerId: string;
  sellerName: string;
  sellerBranch: string;
  sellerSemester: string;
  sellerCollegeVerified: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
  isDemo?: boolean;
}

export interface ItemRequest {
  id: string;
  targetType: 'exchange' | 'lost_found';
  targetId: string;
  targetTitle: string;
  ownerId: string;
  ownerName: string;
  requesterId: string;
  requesterName: string;
  requesterBranch: string;
  requesterSemester: string;
  requesterCollegeVerified: boolean;
  message: string;
  verificationAnswer: string;
  proposedHandoverPoint: string;
  status: RequestStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CampusConfig {
  allowedCollegeDomains: string[];
  strictCollegeDomainOnly: boolean;
  campusDropPoints: string[];
  firebaseStorageConfigured: boolean;
}

export interface DomainCheckResult {
  email: string;
  domain: string;
  isAllowedCollegeDomain: boolean;
  strictMode: boolean;
  reason: string;
}

export type EventCategory =
  | 'Tech & Hackathons'
  | 'Workshops & Seminars'
  | 'Cultural & Fests'
  | 'Clubs & Meetups'
  | 'Sports & Wellness'
  | 'Placement & Career'
  | 'Other';

export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export interface CampusEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  eventDate: string;
  eventTime: string;
  location: string;
  organizer: string;
  imageUrl: string;
  status: EventStatus;
  visibility: 'campus' | 'archived';
  creatorId: string;
  creatorName: string;
  creatorBranch: string;
  creatorSemester: string;
  creatorCollegeVerified: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
  isDemo?: boolean;
}

export interface SavedEvent {
  id: string;
  eventId: string;
  userId: string;
  title: string;
  category: EventCategory;
  eventDate: string;
  eventTime: string;
  location: string;
  organizer: string;
  imageUrl: string;
  status: EventStatus;
  isDemo: boolean;
  savedAt?: unknown;
}
