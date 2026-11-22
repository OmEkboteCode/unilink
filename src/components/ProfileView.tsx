import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { uploadCampusItemImage } from '../lib/mediaUpload';
import { DEPARTMENTS, SEMESTERS, validateProfileInput } from '../lib/validation';
import type { DomainCheckResult } from '../types/unilink';
import { UserAvatar } from './BrandAndMedia';

export function ProfileView() {
  const { user, profile, campusConfig, domainCheck, saveProfile, logout } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [department, setDepartment] = useState(profile?.department || DEPARTMENTS[0]);
  const [branch, setBranch] = useState(profile?.branch || '');
  const [semester, setSemester] = useState(profile?.semester || SEMESTERS[0]);
  const [photoUrl, setPhotoUrl] = useState(profile?.photoUrl || '');
  const [bio, setBio] = useState(profile?.bio || '');

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Live Domain Policy Tester state
  const [testEmail, setTestEmail] = useState('student@gmail.com');
  const [testResult, setTestResult] = useState<DomainCheckResult | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [testingDomain, setTestingDomain] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setDepartment(profile.department || DEPARTMENTS[0]);
      setBranch(profile.branch || '');
      setSemester(profile.semester || SEMESTERS[0]);
      setPhotoUrl(profile.photoUrl || '');
      setBio(profile.bio || '');
    }
  }, [profile]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    setErrorMsg(null);
    try {
      const res = await uploadCampusItemImage(file, 'avatars');
      setPhotoUrl(res.url);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to upload profile photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const errors = validateProfileInput({
      displayName,
      department,
      branch,
      semester,
      photoUrl,
      bio,
    });
    const first = Object.values(errors)[0];
    if (first) {
      setErrorMsg(first);
      return;
    }

    setSaving(true);
    try {
      await saveProfile({
        displayName,
        department,
        branch,
        semester,
        photoUrl,
        bio,
      });
      setSuccessMsg('Student profile saved to Firestore.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestingDomain(true);
    setTestError(null);
    setTestResult(null);
    try {
      const res = await fetch('/api/auth/check-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail.trim() }),
      });
      const data = (await res.json()) as DomainCheckResult & { error?: string };
      if (!res.ok) {
        setTestError(data.error || 'Could not validate email domain.');
        return;
      }
      setTestResult(data);
    } catch {
      setTestError('Network error while checking domain policy.');
    } finally {
      setTestingDomain(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="font-display text-2xl font-bold text-[#0F1A38]">
          Student Profile & Campus Trust
        </h2>
        <p className="text-sm text-slate-600 mt-0.5">
          Manage your academic profile and inspect your email verification status.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile Form */}
        <form
          onSubmit={handleSave}
          className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5"
        >
          <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
            <UserAvatar
              photoUrl={photoUrl}
              name={displayName || undefined}
              email={user?.email}
              size="lg"
              variant="dark"
            />
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-[#0F1A38]">
                {displayName || 'Student Profile'}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  {uploadingPhoto ? 'Uploading...' : 'Change Photo'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
                {photoUrl && (
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              minLength={2}
              maxLength={80}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0D9488]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Account Email (Private — never shown on public boards)
            </label>
            <input
              type="email"
              disabled
              value={user?.email || profile?.email || ''}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#0D9488]"
              >
                <option value="">Select department</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Semester
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#0D9488]"
              >
                <option value="">Select semester</option>
                {SEMESTERS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Branch Short Label
            </label>
            <input
              type="text"
              maxLength={80}
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="e.g. CSE, ECE, AI & ML"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0D9488]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Academic Bio / Interests (Optional)
            </label>
            <textarea
              rows={2}
              maxLength={300}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Share subjects, lab interests, or preferred campus study zones..."
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0D9488]"
            />
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => void logout()}
              className="px-4 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
            >
              Sign Out
            </button>
            <button
              type="submit"
              disabled={saving || uploadingPhoto}
              className="min-h-[40px] px-5 py-2 text-xs font-semibold text-white bg-[#0F1A38] hover:bg-[#17254D] rounded-lg transition-colors disabled:opacity-60 cursor-pointer"
            >
              {saving ? 'Saving Profile...' : 'Save Profile'}
            </button>
          </div>
        </form>

        {/* Verification & Domain Policy Card */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="font-display text-base font-bold text-[#0F1A38]">
              Verification Status
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <span className="text-slate-600">Firebase Email Verification</span>
                {user?.emailVerified ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Pending Verification
                  </span>
                )}
              </div>

              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <span className="text-slate-600">Account Domain Policy</span>
                {domainCheck?.isAllowedCollegeDomain && user?.emailVerified ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-[#0D9488]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Supported ({domainCheck.domain})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    {user?.emailVerified ? 'Outside Allowlist' : 'Pending Verification'}
                  </span>
                )}
              </div>

              <p className="text-slate-600 leading-relaxed">
                {domainCheck?.reason ||
                  'Signed-in account domain is checked against server-configured email policies.'}
              </p>
            </div>
          </div>

          <div className="bg-[#0F1A38] text-white rounded-xl p-5 space-y-4">
            <div className="space-y-1">
              <h3 className="font-display text-sm font-bold">
                Configurable Email Domain Policy
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Supported domains (including <code className="font-mono text-[#14B8A6]">gmail.com</code>)
                are configured server-side via{' '}
                <code className="font-mono text-[#14B8A6]">ALLOWED_COLLEGE_DOMAINS</code> and{' '}
                <code className="font-mono text-[#14B8A6]">STRICT_COLLEGE_DOMAIN_ONLY</code> in{' '}
                <code className="font-mono">.env</code>.
              </p>
              <p className="text-xs text-slate-300 pt-1">
                Active allowlist:{' '}
                <span className="font-mono text-white">
                  {campusConfig.allowedCollegeDomains.join(', ')}
                </span>
              </p>
            </div>

            <form onSubmit={handleTestDomain} className="space-y-2.5 pt-2 border-t border-white/10">
              <label className="block text-xs font-medium text-slate-200">
                Test Email Against Allowed Policy
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="flex-1 min-w-0 px-3 py-1.5 text-xs rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:border-[#14B8A6]"
                />
                <button
                  type="submit"
                  disabled={testingDomain}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white whitespace-nowrap cursor-pointer"
                >
                  Check
                </button>
              </div>
              {testError && (
                <p className="text-[11px] leading-relaxed text-rose-300">{testError}</p>
              )}
              {testResult && (
                <p
                  className={`text-[11px] leading-relaxed ${
                    testResult.isAllowedCollegeDomain ? 'text-[#14B8A6]' : 'text-amber-300'
                  }`}
                >
                  {testResult.reason}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
