import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile as updateFirebaseAuthProfile,
  type User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import { CAMPUS_DROP_POINTS, clampString, isAllowedCollegeEmail, LIMITS } from '../lib/validation';
import type { CampusConfig, DomainCheckResult, UserProfile } from '../types/unilink';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  authReady: boolean;
  profileLoading: boolean;
  campusConfig: CampusConfig;
  domainCheck: DomainCheckResult | null;
  authError: string | null;
  clearAuthError: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (input: {
    email: string;
    password: string;
    displayName: string;
    department: string;
    branch: string;
    semester: string;
  }) => Promise<{ verificationSent: boolean }>;
  resendVerificationEmail: () => Promise<void>;
  logout: () => Promise<void>;
  saveProfile: (updates: {
    displayName: string;
    department: string;
    branch: string;
    semester: string;
    photoUrl: string;
    bio: string;
  }) => Promise<void>;
  refreshAuthSession: () => Promise<void>;
}

const DEFAULT_CAMPUS_CONFIG: CampusConfig = {
  allowedCollegeDomains: ['gmail.com', 'ac.in', 'edu'],
  strictCollegeDomainOnly: false,
  campusDropPoints: CAMPUS_DROP_POINTS,
  firebaseStorageConfigured: true,
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [campusConfig, setCampusConfig] = useState<CampusConfig>(DEFAULT_CAMPUS_CONFIG);
  const campusConfigRef = useRef<CampusConfig>(DEFAULT_CAMPUS_CONFIG);
  const [domainCheck, setDomainCheck] = useState<DomainCheckResult | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  useEffect(() => {
    fetch('/api/campus-config')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: CampusConfig | null) => {
        if (data && Array.isArray(data.allowedCollegeDomains)) {
          campusConfigRef.current = data;
          setCampusConfig(data);
        }
      })
      .catch(() => {
        // Keep defaults if config fetch fails transiently
      });
  }, []);

  const verifyUserDomain = useCallback(
    async (email: string | null | undefined, config: CampusConfig): Promise<DomainCheckResult | null> => {
      if (!email) return null;
      try {
        const res = await fetch('/api/auth/check-domain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        if (res.ok) {
          return (await res.json()) as DomainCheckResult;
        }
      } catch {
        // Fallback to deterministic client check mirroring server policy
      }
      const domain = email.split('@')[1]?.toLowerCase() || '';
      const allowed = isAllowedCollegeEmail(email, config.allowedCollegeDomains);
      return {
        email,
        domain,
        isAllowedCollegeDomain: allowed,
        strictMode: config.strictCollegeDomainOnly,
        reason: allowed
          ? `Matches configured email domains (${config.allowedCollegeDomains.join(', ')})`
          : `Domain "${domain}" is outside configured allowed domains (${config.allowedCollegeDomains.join(', ')})`,
      };
    },
    [],
  );

  const syncUserProfile = useCallback(
    async (firebaseUser: User, domainStatus: DomainCheckResult | null) => {
      setProfileLoading(true);
      const userPath = `users/${firebaseUser.uid}`;
      const userRef = doc(db, 'users', firebaseUser.uid);
      const collegeVerified = Boolean(
        firebaseUser.emailVerified &&
          domainStatus?.isAllowedCollegeDomain &&
          domainStatus.domain !== 'gmail.com',
      );

      try {
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const existingData = snap.data() as UserProfile;
          if (
            existingData.emailVerified !== firebaseUser.emailVerified ||
            existingData.collegeDomainVerified !== collegeVerified
          ) {
            if (firebaseUser.emailVerified) {
              await updateDoc(userRef, {
                emailVerified: firebaseUser.emailVerified,
                collegeDomainVerified: collegeVerified,
                updatedAt: serverTimestamp(),
              });
            }
          }
          setProfile({
            ...existingData,
            emailVerified: firebaseUser.emailVerified,
            collegeDomainVerified: collegeVerified,
          });
        } else if (firebaseUser.emailVerified) {
          const fallbackName =
            firebaseUser.displayName?.trim() ||
            firebaseUser.email?.split('@')[0] ||
            'Campus Student';
          const newProfile: Omit<UserProfile, 'createdAt' | 'updatedAt'> & {
            createdAt: ReturnType<typeof serverTimestamp>;
            updatedAt: ReturnType<typeof serverTimestamp>;
          } = {
            uid: firebaseUser.uid,
            displayName: clampString(fallbackName, LIMITS.displayName.max),
            email: clampString(firebaseUser.email || '', LIMITS.email.max),
            emailVerified: firebaseUser.emailVerified,
            collegeDomainVerified: collegeVerified,
            department: '',
            branch: '',
            semester: '',
            photoUrl: clampString(firebaseUser.photoURL || '', LIMITS.photoUrl.max),
            bio: '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(userRef, newProfile);
          setProfile({
            ...newProfile,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        } else {
          setProfile({
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || 'Unverified Student',
            email: firebaseUser.email || '',
            emailVerified: false,
            collegeDomainVerified: false,
            department: '',
            branch: '',
            semester: '',
            photoUrl: firebaseUser.photoURL || '',
            bio: '',
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, userPath);
      } finally {
        setProfileLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const checked = await verifyUserDomain(currentUser.email, campusConfigRef.current);
        setDomainCheck(checked);
        try {
          await syncUserProfile(currentUser, checked);
        } catch (err) {
          console.error(err);
        }
      } else {
        setProfile(null);
        setDomainCheck(null);
      }
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, [syncUserProfile, verifyUserDomain]);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (campusConfig.strictCollegeDomainOnly && cred.user.email) {
        const check = await verifyUserDomain(cred.user.email, campusConfig);
        if (check && !check.isAllowedCollegeDomain) {
          await signOut(auth);
          setAuthError(
            `Campus policy restricts access to verified emails from: ${campusConfig.allowedCollegeDomains.join(', ')}.`,
          );
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Google sign-in failed.';
      if (msg.includes('popup-closed-by-user')) {
        setAuthError('Sign-in popup was closed before completing.');
      } else {
        setAuthError(msg);
      }
      throw error;
    }
  }, [campusConfig, verifyUserDomain]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      setAuthError(null);
      try {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        if (campusConfig.strictCollegeDomainOnly && cred.user.email) {
          const check = await verifyUserDomain(cred.user.email, campusConfig);
          if (check && !check.isAllowedCollegeDomain) {
            await signOut(auth);
            throw new Error(
              `Campus policy restricts access to: ${campusConfig.allowedCollegeDomains.join(', ')}.`,
            );
          }
        }
      } catch (error) {
        const code = (error as { code?: string })?.code || '';
        if (code === 'auth/operation-not-allowed') {
          const msg =
            'Email/Password login is not enabled in Firebase Console yet. Enable it under Authentication → Sign-in method, or use Google Sign-In.';
          setAuthError(msg);
          throw new Error(msg);
        }
        const msg = error instanceof Error ? error.message : 'Email sign-in failed.';
        setAuthError(msg);
        throw error;
      }
    },
    [campusConfig, verifyUserDomain],
  );

  const registerWithEmail = useCallback(
    async (input: {
      email: string;
      password: string;
      displayName: string;
      department: string;
      branch: string;
      semester: string;
    }) => {
      setAuthError(null);
      const email = input.email.trim();
      const check = await verifyUserDomain(email, campusConfig);
      if (campusConfig.strictCollegeDomainOnly && check && !check.isAllowedCollegeDomain) {
        const msg = `Only allowed email domains (${campusConfig.allowedCollegeDomains.join(', ')}) can register under strict domain mode.`;
        setAuthError(msg);
        throw new Error(msg);
      }

      try {
        const cred = await createUserWithEmailAndPassword(auth, email, input.password);
        await updateFirebaseAuthProfile(cred.user, {
          displayName: clampString(input.displayName, LIMITS.displayName.max),
        });
        await sendEmailVerification(cred.user);
        setProfile({
          uid: cred.user.uid,
          displayName: clampString(input.displayName, LIMITS.displayName.max),
          email,
          emailVerified: false,
          collegeDomainVerified: false,
          department: clampString(input.department, LIMITS.department.max),
          branch: clampString(input.branch, LIMITS.branch.max),
          semester: clampString(input.semester, LIMITS.semester.max),
          photoUrl: '',
          bio: '',
        });
        return { verificationSent: true };
      } catch (error) {
        const code = (error as { code?: string })?.code || '';
        if (code === 'auth/operation-not-allowed') {
          const msg =
            'Email/Password registration is not enabled in Firebase Console yet. Enable it under Authentication → Sign-in method, or sign in with Google.';
          setAuthError(msg);
          throw new Error(msg);
        }
        const msg = error instanceof Error ? error.message : 'Registration failed.';
        setAuthError(msg);
        throw error;
      }
    },
    [campusConfig, verifyUserDomain],
  );

  const resendVerificationEmail = useCallback(async () => {
    if (!auth.currentUser) return;
    await sendEmailVerification(auth.currentUser);
  }, []);

  const refreshAuthSession = useCallback(async () => {
    if (!auth.currentUser) return;
    await auth.currentUser.reload();
    const refreshed = auth.currentUser;
    setUser(refreshed);
    const checked = await verifyUserDomain(refreshed.email, campusConfig);
    setDomainCheck(checked);
    await syncUserProfile(refreshed, checked);
  }, [campusConfig, syncUserProfile, verifyUserDomain]);

  const logout = useCallback(async () => {
    setAuthError(null);
    await signOut(auth);
    setProfile(null);
  }, []);

  const saveProfile = useCallback(
    async (updates: {
      displayName: string;
      department: string;
      branch: string;
      semester: string;
      photoUrl: string;
      bio: string;
    }) => {
      if (!auth.currentUser) throw new Error('You must be signed in to update your profile.');
      if (!auth.currentUser.emailVerified) {
        throw new Error('Please verify your email address before saving your profile.');
      }

      const uid = auth.currentUser.uid;
      const userPath = `users/${uid}`;
      const userRef = doc(db, 'users', uid);
      const collegeVerified = Boolean(
        auth.currentUser.emailVerified &&
          domainCheck?.isAllowedCollegeDomain &&
          domainCheck.domain !== 'gmail.com',
      );

      const cleanPayload = {
        displayName: clampString(updates.displayName, LIMITS.displayName.max),
        department: clampString(updates.department, LIMITS.department.max),
        branch: clampString(updates.branch, LIMITS.branch.max),
        semester: clampString(updates.semester, LIMITS.semester.max),
        photoUrl: clampString(updates.photoUrl, LIMITS.photoUrl.max),
        bio: clampString(updates.bio, LIMITS.bio.max),
        emailVerified: auth.currentUser.emailVerified,
        collegeDomainVerified: collegeVerified,
        updatedAt: serverTimestamp(),
      };

      try {
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          await updateDoc(userRef, cleanPayload);
        } else {
          await setDoc(userRef, {
            uid,
            email: clampString(auth.currentUser.email || '', LIMITS.email.max),
            ...cleanPayload,
            createdAt: serverTimestamp(),
          });
        }
        setProfile((prev) => ({
          uid,
          email: auth.currentUser?.email || prev?.email || '',
          createdAt: prev?.createdAt,
          ...cleanPayload,
        }));
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, userPath);
      }
    },
    [domainCheck],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        authReady,
        profileLoading,
        campusConfig,
        domainCheck,
        authError,
        clearAuthError,
        signInWithGoogle,
        signInWithEmail,
        registerWithEmail,
        resendVerificationEmail,
        logout,
        saveProfile,
        refreshAuthSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
