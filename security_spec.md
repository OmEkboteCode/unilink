# UniLink AI Firestore Security Specification

## 1. Data Invariants
1. **Owner-Isolated Profiles (`/users/{userId}`)**: A student profile contains PII (`email`). Only the authenticated user whose `uid == userId` and `email_verified == true` may read (`get`) or write (`create`, `update`) their own document. Blanket `list` is denied.
2. **Campus Board Visibility & No PII (`/lostFoundReports/{reportId}`, `/exchangeListings/{listingId}`)**: Publicly browsable campus reports and exchange listings must have `visibility == 'campus'` and must never store email addresses or phone numbers. Only the verified creator (`reporterId == request.auth.uid` / `sellerId == request.auth.uid`) may create, update, or delete their own records.
3. **Parent-Verified Requests (`/itemRequests/{requestId}`)**: An item request or lost/found claim cannot exist unless the referenced parent document in `/exchangeListings/{targetId}` or `/lostFoundReports/{targetId}` exists and `ownerId` matches the parent document's `sellerId` or `reporterId`. A user cannot request their own item (`requesterId != ownerId`). Only the `requesterId` or `ownerId` may read (`get` / `list`) a request.
4. **Temporal & Identity Immutability**: `createdAt` must equal `request.time` on creation and never change on update. `updatedAt` must equal `request.time` on both create and update. `uid`, `reporterId`, `sellerId`, `requesterId`, and `ownerId` are immutable once created.
5. **Terminal State Locking**: Once a `lostFoundReports` record reaches `'reunited'` or `'closed'`, an `exchangeListings` record reaches `'completed'` or `'removed'`, or an `itemRequests` record reaches `'declined'`, `'completed'`, or `'cancelled'`, subsequent updates are blocked.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Identity Spoofing on Report**: Creating a `lostFoundReports` doc with `reporterId: "other-uid"` -> `PERMISSION_DENIED`.
2. **Unverified Email Write**: Creating a listing with `request.auth.token.email_verified == false` -> `PERMISSION_DENIED`.
3. **PII Blanket Read**: Calling `get(/users/otherUserId)` or `list(/users)` -> `PERMISSION_DENIED`.
4. **Shadow / Ghost Field Injection**: Creating or updating a listing with an extra key `isAdminApproved: true` -> `PERMISSION_DENIED`.
5. **Client Timestamp Backdating**: Creating a report with `createdAt` set to yesterday instead of `request.time` -> `PERMISSION_DENIED`.
6. **ID Poisoning**: Creating `/lostFoundReports/<1500-char-id>` or invalid characters -> `PERMISSION_DENIED`.
7. **Value Poisoning on Update**: Updating `price` on an exchange listing to a string `"free"` or `-50` -> `PERMISSION_DENIED`.
8. **Cross-Owner Mutation**: User B attempting to update or close User A's report -> `PERMISSION_DENIED`.
9. **Terminal State Resurrection**: Attempting to change a `'reunited'` report back to `'open'` -> `PERMISSION_DENIED`.
10. **Orphaned / Self-Targeted ItemRequest**: Creating an `itemRequests` doc referencing a nonexistent `targetId`, mismatched `ownerId`, or `requesterId == ownerId` -> `PERMISSION_DENIED`.
11. **Request Hijacking**: Requester attempting to update `itemRequests.status` to `'accepted'` (only `ownerId` may accept/decline/complete) -> `PERMISSION_DENIED`.
12. **Unauthorized Request Scraping**: User C calling `list(/itemRequests)` without matching `requesterId == C` or `ownerId == C` -> `PERMISSION_DENIED`.
