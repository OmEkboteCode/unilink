import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { clampString, LIMITS } from '../lib/validation';
import type {
  CampusEvent,
  EventCategory,
  EventStatus,
  ExchangeCategory,
  ExchangeListing,
  ItemCondition,
  ItemRequest,
  ListingAvailability,
  ListingType,
  LostFoundCategory,
  LostFoundReport,
  LostFoundStatus,
  ReportType,
  RequestStatus,
  SavedEvent,
  UserProfile,
} from '../types/unilink';

function toSeconds(ts: unknown): number {
  if (ts && typeof ts === 'object' && 'seconds' in ts && typeof (ts as { seconds: unknown }).seconds === 'number') {
    return (ts as { seconds: number }).seconds;
  }
  return Date.now() / 1000;
}

export function subscribeCampusReports(
  onData: (items: LostFoundReport[]) => void,
): Unsubscribe {
  const path = 'lostFoundReports';
  const q = query(
    collection(db, path),
    where('visibility', '==', 'campus'),
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const docs: LostFoundReport[] = snapshot.docs
        .map((d) => ({
          id: d.id,
          ...(d.data() as Omit<LostFoundReport, 'id'>),
          isDemo: false,
        }))
        .sort((a, b) => toSeconds(b.createdAt) - toSeconds(a.createdAt));
      onData(docs);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    },
  );
}

export function subscribeCampusListings(
  onData: (items: ExchangeListing[]) => void,
): Unsubscribe {
  const path = 'exchangeListings';
  const q = query(
    collection(db, path),
    where('visibility', '==', 'campus'),
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const docs: ExchangeListing[] = snapshot.docs
        .map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ExchangeListing, 'id'>),
          isDemo: false,
        }))
        .sort((a, b) => toSeconds(b.createdAt) - toSeconds(a.createdAt));
      onData(docs);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    },
  );
}

export function subscribeMyRequests(
  uid: string,
  onData: (items: ItemRequest[]) => void,
): Unsubscribe {
  const path = 'itemRequests';
  const qOutgoing = query(collection(db, path), where('requesterId', '==', uid));
  const qIncoming = query(collection(db, path), where('ownerId', '==', uid));

  let outgoing: ItemRequest[] = [];
  let incoming: ItemRequest[] = [];

  const emitMerged = () => {
    const mergedMap = new Map<string, ItemRequest>();
    for (const r of [...outgoing, ...incoming]) {
      mergedMap.set(r.id, r);
    }
    const merged = Array.from(mergedMap.values()).sort((a, b) => {
      const aSec = (a.createdAt as { seconds?: number } | undefined)?.seconds ?? 0;
      const bSec = (b.createdAt as { seconds?: number } | undefined)?.seconds ?? 0;
      return bSec - aSec;
    });
    onData(merged);
  };

  const unsubOut = onSnapshot(
    qOutgoing,
    (snap) => {
      outgoing = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ItemRequest, 'id'>),
      }));
      emitMerged();
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    },
  );

  const unsubIn = onSnapshot(
    qIncoming,
    (snap) => {
      incoming = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ItemRequest, 'id'>),
      }));
      emitMerged();
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    },
  );

  return () => {
    unsubOut();
    unsubIn();
  };
}

export async function createLostFoundReport(
  input: {
    type: ReportType;
    title: string;
    description: string;
    category: LostFoundCategory;
    imageUrl: string;
    location: string;
    eventDate: string;
    eventTime: string;
    verificationPrompt: string;
    handoverLocation: string;
  },
  profile: UserProfile,
): Promise<string> {
  const serverRes = await fetch('/api/validate/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!serverRes.ok) {
    const body = (await serverRes.json()) as { errors?: Record<string, string> };
    const firstErr = body.errors ? Object.values(body.errors)[0] : 'Validation failed.';
    throw new Error(firstErr);
  }

  const path = 'lostFoundReports';
  try {
    const docRef = await addDoc(collection(db, path), {
      type: input.type,
      title: clampString(input.title, LIMITS.reportTitle.max),
      description: clampString(input.description, LIMITS.description.max),
      category: input.category,
      imageUrl: clampString(input.imageUrl, LIMITS.photoUrl.max),
      location: clampString(input.location, LIMITS.location.max),
      eventDate: input.eventDate.trim().slice(0, 10),
      eventTime: clampString(input.eventTime, LIMITS.eventTime.max),
      status: 'open',
      verificationPrompt: clampString(input.verificationPrompt, LIMITS.verificationPrompt.max),
      handoverLocation: clampString(input.handoverLocation, LIMITS.handoverLocation.max),
      visibility: 'campus',
      reporterId: profile.uid,
      reporterName: clampString(profile.displayName || 'Student', LIMITS.displayName.max),
      reporterBranch: clampString(profile.branch || profile.department || '', LIMITS.branch.max),
      reporterSemester: clampString(profile.semester || '', LIMITS.semester.max),
      reporterCollegeVerified: Boolean(profile.collegeDomainVerified),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateLostFoundReportDetails(
  reportId: string,
  input: {
    title: string;
    description: string;
    category: LostFoundCategory;
    imageUrl: string;
    location: string;
    eventDate: string;
    eventTime: string;
    verificationPrompt: string;
    handoverLocation: string;
  },
  profile: UserProfile,
): Promise<void> {
  const path = `lostFoundReports/${reportId}`;
  try {
    await updateDoc(doc(db, 'lostFoundReports', reportId), {
      title: clampString(input.title, LIMITS.reportTitle.max),
      description: clampString(input.description, LIMITS.description.max),
      category: input.category,
      imageUrl: clampString(input.imageUrl, LIMITS.photoUrl.max),
      location: clampString(input.location, LIMITS.location.max),
      eventDate: input.eventDate.trim().slice(0, 10),
      eventTime: clampString(input.eventTime, LIMITS.eventTime.max),
      verificationPrompt: clampString(input.verificationPrompt, LIMITS.verificationPrompt.max),
      handoverLocation: clampString(input.handoverLocation, LIMITS.handoverLocation.max),
      reporterName: clampString(profile.displayName || 'Student', LIMITS.displayName.max),
      reporterBranch: clampString(profile.branch || profile.department || '', LIMITS.branch.max),
      reporterSemester: clampString(profile.semester || '', LIMITS.semester.max),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateLostFoundReportStatus(
  reportId: string,
  status: LostFoundStatus,
  handoverLocation?: string,
): Promise<void> {
  const path = `lostFoundReports/${reportId}`;
  try {
    const payload: Record<string, unknown> = {
      status,
      updatedAt: serverTimestamp(),
    };
    if (typeof handoverLocation === 'string') {
      payload.handoverLocation = clampString(handoverLocation, LIMITS.handoverLocation.max);
    }
    await updateDoc(doc(db, 'lostFoundReports', reportId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteLostFoundReport(reportId: string): Promise<void> {
  const path = `lostFoundReports/${reportId}`;
  try {
    await deleteDoc(doc(db, 'lostFoundReports', reportId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function createExchangeListing(
  input: {
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
  },
  profile: UserProfile,
): Promise<string> {
  const normalizedPrice = input.listingType === 'sell' ? Math.max(0, Number(input.price) || 0) : 0;
  const serverRes = await fetch('/api/validate/listing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...input, price: normalizedPrice }),
  });
  if (!serverRes.ok) {
    const body = (await serverRes.json()) as { errors?: Record<string, string> };
    const firstErr = body.errors ? Object.values(body.errors)[0] : 'Validation failed.';
    throw new Error(firstErr);
  }

  const path = 'exchangeListings';
  try {
    const docRef = await addDoc(collection(db, path), {
      title: clampString(input.title, LIMITS.listingTitle.max),
      description: clampString(input.description, LIMITS.description.max),
      listingType: input.listingType,
      category: input.category,
      condition: input.condition,
      price: normalizedPrice,
      swapFor: input.listingType === 'swap' ? clampString(input.swapFor, LIMITS.swapFor.max) : '',
      borrowDuration:
        input.listingType === 'borrow'
          ? clampString(input.borrowDuration, LIMITS.borrowDuration.max)
          : '',
      targetBranch: clampString(input.targetBranch, LIMITS.branch.max),
      targetSemester: clampString(input.targetSemester, LIMITS.semester.max),
      subjectCode: clampString(input.subjectCode, LIMITS.subjectCode.max),
      pickupLocation: clampString(input.pickupLocation, LIMITS.location.max),
      imageUrl: clampString(input.imageUrl, LIMITS.photoUrl.max),
      availability: 'available',
      visibility: 'campus',
      sellerId: profile.uid,
      sellerName: clampString(profile.displayName || 'Student', LIMITS.displayName.max),
      sellerBranch: clampString(profile.branch || profile.department || '', LIMITS.branch.max),
      sellerSemester: clampString(profile.semester || '', LIMITS.semester.max),
      sellerCollegeVerified: Boolean(profile.collegeDomainVerified),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateExchangeListingDetails(
  listingId: string,
  input: {
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
  },
  profile: UserProfile,
): Promise<void> {
  const normalizedPrice = input.listingType === 'sell' ? Math.max(0, Number(input.price) || 0) : 0;
  const path = `exchangeListings/${listingId}`;
  try {
    await updateDoc(doc(db, 'exchangeListings', listingId), {
      title: clampString(input.title, LIMITS.listingTitle.max),
      description: clampString(input.description, LIMITS.description.max),
      listingType: input.listingType,
      category: input.category,
      condition: input.condition,
      price: normalizedPrice,
      swapFor: input.listingType === 'swap' ? clampString(input.swapFor, LIMITS.swapFor.max) : '',
      borrowDuration:
        input.listingType === 'borrow'
          ? clampString(input.borrowDuration, LIMITS.borrowDuration.max)
          : '',
      targetBranch: clampString(input.targetBranch, LIMITS.branch.max),
      targetSemester: clampString(input.targetSemester, LIMITS.semester.max),
      subjectCode: clampString(input.subjectCode, LIMITS.subjectCode.max),
      pickupLocation: clampString(input.pickupLocation, LIMITS.location.max),
      imageUrl: clampString(input.imageUrl, LIMITS.photoUrl.max),
      sellerName: clampString(profile.displayName || 'Student', LIMITS.displayName.max),
      sellerBranch: clampString(profile.branch || profile.department || '', LIMITS.branch.max),
      sellerSemester: clampString(profile.semester || '', LIMITS.semester.max),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateExchangeListingAvailability(
  listingId: string,
  availability: ListingAvailability,
): Promise<void> {
  const path = `exchangeListings/${listingId}`;
  try {
    await updateDoc(doc(db, 'exchangeListings', listingId), {
      availability,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteExchangeListing(listingId: string): Promise<void> {
  const path = `exchangeListings/${listingId}`;
  try {
    await deleteDoc(doc(db, 'exchangeListings', listingId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function createItemRequest(
  input: {
    targetType: 'exchange' | 'lost_found';
    targetId: string;
    targetTitle: string;
    ownerId: string;
    ownerName: string;
    message: string;
    verificationAnswer: string;
    proposedHandoverPoint: string;
  },
  requester: UserProfile,
): Promise<string> {
  const path = 'itemRequests';
  try {
    const docRef = await addDoc(collection(db, path), {
      targetType: input.targetType,
      targetId: input.targetId,
      targetTitle: clampString(input.targetTitle, LIMITS.listingTitle.max),
      ownerId: input.ownerId,
      ownerName: clampString(input.ownerName, LIMITS.displayName.max),
      requesterId: requester.uid,
      requesterName: clampString(requester.displayName || 'Student', LIMITS.displayName.max),
      requesterBranch: clampString(requester.branch || requester.department || '', LIMITS.branch.max),
      requesterSemester: clampString(requester.semester || '', LIMITS.semester.max),
      requesterCollegeVerified: Boolean(requester.collegeDomainVerified),
      message: clampString(input.message, LIMITS.message.max),
      verificationAnswer: clampString(input.verificationAnswer, LIMITS.verificationAnswer.max),
      proposedHandoverPoint: clampString(input.proposedHandoverPoint, LIMITS.handoverLocation.max),
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateItemRequestStatus(
  requestId: string,
  status: RequestStatus,
): Promise<void> {
  const path = `itemRequests/${requestId}`;
  try {
    await updateDoc(doc(db, 'itemRequests', requestId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeCampusEvents(
  onData: (items: CampusEvent[]) => void,
): Unsubscribe {
  const path = 'campusEvents';
  const q = query(collection(db, path), where('visibility', '==', 'campus'));
  return onSnapshot(
    q,
    (snapshot) => {
      const docs: CampusEvent[] = snapshot.docs
        .map((d) => ({
          id: d.id,
          ...(d.data() as Omit<CampusEvent, 'id'>),
          isDemo: false,
        }))
        .sort((a, b) => a.eventDate.localeCompare(b.eventDate) || toSeconds(b.createdAt) - toSeconds(a.createdAt));
      onData(docs);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    },
  );
}

export async function createCampusEvent(
  input: {
    title: string;
    description: string;
    category: EventCategory;
    eventDate: string;
    eventTime: string;
    location: string;
    organizer: string;
    imageUrl: string;
  },
  profile: UserProfile,
): Promise<string> {
  const serverRes = await fetch('/api/validate/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!serverRes.ok) {
    const body = (await serverRes.json()) as { errors?: Record<string, string> };
    const firstErr = body.errors ? Object.values(body.errors)[0] : 'Validation failed.';
    throw new Error(firstErr);
  }

  const path = 'campusEvents';
  try {
    const docRef = await addDoc(collection(db, path), {
      title: clampString(input.title, LIMITS.eventTitle.max),
      description: clampString(input.description, LIMITS.description.max),
      category: input.category,
      eventDate: input.eventDate.trim().slice(0, 10),
      eventTime: clampString(input.eventTime, LIMITS.eventTime.max),
      location: clampString(input.location, LIMITS.location.max),
      organizer: clampString(input.organizer, LIMITS.organizer.max),
      imageUrl: clampString(input.imageUrl, LIMITS.photoUrl.max),
      status: 'upcoming',
      visibility: 'campus',
      creatorId: profile.uid,
      creatorName: clampString(profile.displayName || 'Student', LIMITS.displayName.max),
      creatorBranch: clampString(profile.branch || profile.department || '', LIMITS.branch.max),
      creatorSemester: clampString(profile.semester || '', LIMITS.semester.max),
      creatorCollegeVerified: Boolean(profile.collegeDomainVerified),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateCampusEventDetails(
  eventId: string,
  input: {
    title: string;
    description: string;
    category: EventCategory;
    eventDate: string;
    eventTime: string;
    location: string;
    organizer: string;
    imageUrl: string;
  },
  profile: UserProfile,
): Promise<void> {
  const serverRes = await fetch('/api/validate/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!serverRes.ok) {
    const body = (await serverRes.json()) as { errors?: Record<string, string> };
    const firstErr = body.errors ? Object.values(body.errors)[0] : 'Validation failed.';
    throw new Error(firstErr);
  }

  const path = `campusEvents/${eventId}`;
  try {
    await updateDoc(doc(db, 'campusEvents', eventId), {
      title: clampString(input.title, LIMITS.eventTitle.max),
      description: clampString(input.description, LIMITS.description.max),
      category: input.category,
      eventDate: input.eventDate.trim().slice(0, 10),
      eventTime: clampString(input.eventTime, LIMITS.eventTime.max),
      location: clampString(input.location, LIMITS.location.max),
      organizer: clampString(input.organizer, LIMITS.organizer.max),
      imageUrl: clampString(input.imageUrl, LIMITS.photoUrl.max),
      creatorName: clampString(profile.displayName || 'Student', LIMITS.displayName.max),
      creatorBranch: clampString(profile.branch || profile.department || '', LIMITS.branch.max),
      creatorSemester: clampString(profile.semester || '', LIMITS.semester.max),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateCampusEventStatus(
  eventId: string,
  status: EventStatus,
): Promise<void> {
  const path = `campusEvents/${eventId}`;
  try {
    await updateDoc(doc(db, 'campusEvents', eventId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCampusEvent(eventId: string): Promise<void> {
  const path = `campusEvents/${eventId}`;
  try {
    await deleteDoc(doc(db, 'campusEvents', eventId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeSavedEvents(
  uid: string,
  onData: (items: SavedEvent[]) => void,
): Unsubscribe {
  const path = `users/${uid}/savedEvents`;
  return onSnapshot(
    collection(db, 'users', uid, 'savedEvents'),
    (snapshot) => {
      const docs: SavedEvent[] = snapshot.docs
        .map((d) => ({
          id: d.id,
          ...(d.data() as Omit<SavedEvent, 'id'>),
        }))
        .sort((a, b) => a.eventDate.localeCompare(b.eventDate) || toSeconds(b.savedAt) - toSeconds(a.savedAt));
      onData(docs);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    },
  );
}

export async function saveEventInterest(uid: string, ev: CampusEvent): Promise<void> {
  const path = `users/${uid}/savedEvents/${ev.id}`;
  try {
    await setDoc(doc(db, 'users', uid, 'savedEvents', ev.id), {
      eventId: ev.id,
      userId: uid,
      title: clampString(ev.title, LIMITS.eventTitle.max),
      category: ev.category,
      eventDate: ev.eventDate.trim().slice(0, 10),
      eventTime: clampString(ev.eventTime, LIMITS.eventTime.max),
      location: clampString(ev.location, LIMITS.location.max),
      organizer: clampString(ev.organizer, LIMITS.organizer.max),
      imageUrl: clampString(ev.imageUrl || '', LIMITS.photoUrl.max),
      status: ev.status,
      isDemo: Boolean(ev.isDemo),
      savedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeSavedEvent(uid: string, eventId: string): Promise<void> {
  const path = `users/${uid}/savedEvents/${eventId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'savedEvents', eventId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
