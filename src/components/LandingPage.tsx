import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Lock,
  Recycle,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { DEMO_EVENTS, DEMO_LISTINGS, DEMO_REPORTS } from '../data/demoData';
import { ItemMedia, StatusIndicator, UniLinkLogo } from './BrandAndMedia';

export function LandingPage({
  isSignedIn,
  onGetStarted,
  onExploreWorkspace,
}: {
  isSignedIn: boolean;
  onGetStarted: () => void;
  onExploreWorkspace: (tab: 'dashboard' | 'find' | 'reuse' | 'events', itemId?: string) => void;
}) {
  const [previewTab, setPreviewTab] = useState<'find' | 'reuse' | 'events'>('find');

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-[#0F172A] flex flex-col">
      {/* 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <a href="#top" className="whitespace-nowrap shrink-0">
            <UniLinkLogo variant="dark" />
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a
              href="#pillars"
              className="hover:text-[#0F1A38] transition-colors whitespace-nowrap shrink-0"
            >
              Ecosystem
            </a>
            <a
              href="#preview"
              className="hover:text-[#0F1A38] transition-colors whitespace-nowrap shrink-0"
            >
              Campus Preview
            </a>
            <a
              href="#workflow"
              className="hover:text-[#0F1A38] transition-colors whitespace-nowrap shrink-0"
            >
              Verification
            </a>
            <a
              href="#trust"
              className="hover:text-[#0F1A38] transition-colors whitespace-nowrap shrink-0"
            >
              Privacy
            </a>
          </nav>

          <div className="shrink-0">
            {isSignedIn ? (
              <button
                type="button"
                onClick={() => onExploreWorkspace('dashboard')}
                className="px-4 py-2 text-sm font-semibold text-white bg-[#0F1A38] hover:bg-[#17254D] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Open Dashboard
              </button>
            ) : (
              <button
                type="button"
                onClick={onGetStarted}
                className="px-4 py-2 text-sm font-semibold text-white bg-[#0F1A38] hover:bg-[#17254D] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <main id="top" className="flex-1">
        {/* Hero Split */}
        <section className="bg-[#0F1A38] text-white border-b border-slate-800">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-14 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
              <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
                <p className="text-sm font-medium text-[#14B8A6] tracking-wide">
                  Campus Connection & Resource-Sharing Ecosystem
                </p>
                <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight leading-[1.12] text-balance">
                  Lost Things Found. Unused Things Reimagined. Students Connected.
                </h1>
                <p className="text-base text-slate-300 leading-relaxed max-w-xl">
                  UniLink replaces scattered campus group-chat posts with structured lost-and-found
                  verification, a student-to-student ReLife Exchange for books and lab kits, and
                  live campus event discovery.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={isSignedIn ? () => onExploreWorkspace('dashboard') : onGetStarted}
                    className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {isSignedIn ? 'Go to Student Dashboard' : 'Get Started with Campus Sign In'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <a
                    href="#preview"
                    className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-white/20 hover:bg-white/10 text-white text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    Explore Campus Board
                  </a>
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-300 pt-2">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#14B8A6]" />
                    Verified Gmail & campus accounts
                  </span>
                  <span aria-hidden="true" className="text-slate-600">
                    ·
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-[#F59E0B]" />
                    No public phone numbers
                  </span>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="h-full min-h-[260px] lg:min-h-[380px] rounded-2xl overflow-hidden border border-white/10 bg-[#17254D] relative">
                  <img
                    src="/src/assets/images/campus_hero_ecosystem_1794997072558.jpg"
                    alt="Engineering university campus courtyard and glass study pavilion"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#091128]/90 via-[#091128]/45 to-transparent p-5 sm:p-6">
                    <p className="text-xs font-medium text-slate-200">
                      Built for campus security desks, department book chains, and student hostels
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Three Outcomes Asymmetric Bento */}
        <section id="pillars" className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16">
          <div className="max-w-2xl mb-10 space-y-2">
            <p className="text-xs font-semibold text-slate-500">One link. Three outcomes.</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0F1A38] text-balance">
              Solving campus fragmentation in one dedicated workspace
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-6 bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm rounded-xl p-6 sm:p-7 flex flex-col justify-between space-y-6 transition-[border-color,box-shadow] duration-150">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-teal-50 text-[#0D9488] flex items-center justify-center">
                    <Search className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-[#0D9488]">Find</span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-display text-xl font-bold text-[#0F1A38]">
                    01. Smart Lost & Found
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Structured lost and found boards with photo uploads, campus location tagging,
                    hidden-detail ownership checks, and safe handover desks across blocks.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => (isSignedIn ? onExploreWorkspace('find') : onGetStarted())}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0D9488] hover:text-[#0F766E] whitespace-nowrap self-start cursor-pointer"
              >
                Browse Lost & Found
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="lg:col-span-6 bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm rounded-xl p-6 sm:p-7 flex flex-col justify-between space-y-6 transition-[border-color,box-shadow] duration-150">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-amber-50 text-[#EA580C] flex items-center justify-center">
                    <Recycle className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-[#EA580C]">Reuse</span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-display text-xl font-bold text-[#0F1A38]">
                    02. ReLife Exchange
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Donate, sell, swap, or borrow textbooks, scientific calculators, and Arduino kits.
                    Built around the senior-to-junior branch & semester book chain.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => (isSignedIn ? onExploreWorkspace('reuse') : onGetStarted())}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#EA580C] hover:text-amber-700 whitespace-nowrap self-start cursor-pointer"
              >
                Explore ReLife Exchange
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="lg:col-span-12 bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm rounded-xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-[border-color,box-shadow] duration-150">
              <div className="flex items-start gap-4 max-w-3xl">
                <div className="w-11 h-11 rounded-xl bg-rose-50 text-[#E11D48] flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-[#E11D48]">Connect</span>
                    <span aria-hidden="true">·</span>
                    <span>Workshops, Hackathons & Clubs</span>
                  </div>
                  <h3 className="font-display text-xl font-bold text-[#0F1A38]">
                    03. Campus Events & Clubs
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Publish and filter workshops, hackathons, club meetups, and department seminars
                    with organizer attribution and campus venue details in one feed.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => (isSignedIn ? onExploreWorkspace('events') : onGetStarted())}
                className="min-h-[42px] inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-50 text-sm font-semibold text-[#E11D48] hover:bg-rose-100 whitespace-nowrap shrink-0 self-start md:self-center cursor-pointer transition-colors"
              >
                Explore Campus Events
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Live Sample Campus Preview */}
        <section id="preview" className="bg-white border-y border-slate-200 py-16">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-slate-500">Sample Campus Preview</p>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0F1A38]">
                  See what students share on campus
                </h2>
              </div>

              <div className="inline-flex flex-wrap p-1 bg-slate-100 rounded-lg self-start">
                <button
                  type="button"
                  onClick={() => setPreviewTab('find')}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    previewTab === 'find'
                      ? 'bg-white text-[#0D9488] shadow-xs'
                      : 'text-slate-600 hover:text-[#0F1A38]'
                  }`}
                >
                  Find: Lost & Found
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('reuse')}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    previewTab === 'reuse'
                      ? 'bg-white text-[#EA580C] shadow-xs'
                      : 'text-slate-600 hover:text-[#0F1A38]'
                  }`}
                >
                  Reuse: ReLife Exchange
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('events')}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    previewTab === 'events'
                      ? 'bg-white text-[#E11D48] shadow-xs'
                      : 'text-slate-600 hover:text-[#0F1A38]'
                  }`}
                >
                  Connect: Campus Events
                </button>
              </div>
            </div>

            {previewTab === 'find' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {DEMO_REPORTS.slice(0, 4).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => (isSignedIn ? onExploreWorkspace('find', item.id) : onGetStarted())}
                    className="group text-left bg-[#F8FAFC] border border-slate-200 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 rounded-xl overflow-hidden flex flex-col transition-[transform,box-shadow,border-color] duration-150 cursor-pointer"
                  >
                    <ItemMedia
                      imageUrl={item.imageUrl}
                      title={item.title}
                      category={item.category}
                      accent="teal"
                    />
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3 w-full">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                          <span
                            className={`font-semibold ${
                              item.type === 'lost' ? 'text-rose-700' : 'text-[#0D9488]'
                            }`}
                          >
                            {item.type === 'lost' ? 'Lost Item' : 'Found Item'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">Sample Demo</span>
                        </div>
                        <h3 className="font-display text-sm font-semibold text-[#0F1A38] line-clamp-2">
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-600 line-clamp-2">{item.location}</p>
                      </div>
                      <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2">
                        <StatusIndicator status={item.status} type="report" />
                        <span className="text-xs font-mono tabular-nums text-slate-500">
                          {item.eventDate}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : previewTab === 'reuse' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {DEMO_LISTINGS.slice(0, 4).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => (isSignedIn ? onExploreWorkspace('reuse', item.id) : onGetStarted())}
                    className="group text-left bg-[#F8FAFC] border border-slate-200 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 rounded-xl overflow-hidden flex flex-col transition-[transform,box-shadow,border-color] duration-150 cursor-pointer"
                  >
                    <ItemMedia
                      imageUrl={item.imageUrl}
                      title={item.title}
                      category={item.category}
                      accent="orange"
                    />
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3 w-full">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-semibold text-[#EA580C] capitalize">
                            {item.listingType}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{item.condition}</span>
                          <span aria-hidden="true">·</span>
                          <span>Sample Demo</span>
                        </div>
                        <h3 className="font-display text-sm font-semibold text-[#0F1A38] line-clamp-2">
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-600 line-clamp-1">
                          {item.targetBranch || item.category}
                          {item.targetSemester ? ` · ${item.targetSemester}` : ''}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-[#0F1A38] tabular-nums">
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
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {DEMO_EVENTS.slice(0, 3).map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => (isSignedIn ? onExploreWorkspace('events', ev.id) : onGetStarted())}
                    className="group text-left bg-[#F8FAFC] border border-slate-200 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 rounded-xl overflow-hidden flex flex-col transition-[transform,box-shadow,border-color] duration-150 cursor-pointer"
                  >
                    <ItemMedia
                      imageUrl={ev.imageUrl}
                      title={ev.title}
                      category={ev.category}
                      accent="coral"
                    />
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3 w-full">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-semibold text-[#E11D48]">{ev.category}</span>
                          <span aria-hidden="true">·</span>
                          <span>Sample Demo</span>
                        </div>
                        <h3 className="font-display text-sm font-semibold text-[#0F1A38] line-clamp-2">
                          {ev.title}
                        </h3>
                        <p className="text-xs text-slate-600 line-clamp-1">
                          {ev.organizer} · {ev.location}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2">
                        <StatusIndicator status={ev.status} type="event" />
                        <span className="text-xs font-mono tabular-nums text-slate-500">
                          {ev.eventDate} · {ev.eventTime}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 4-Step Verification Workflow & Senior-Junior Book Chain */}
        <section id="workflow" className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#0D9488]">Safe Handover Protocol</p>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0F1A38]">
                  Verified ownership before handover
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    step: '01. Report',
                    desc: 'Snap a photo, tag the campus building, date, and time in seconds.',
                  },
                  {
                    step: '02. Match',
                    desc: 'Compare category, location, and keyword clues across lost and found boards.',
                  },
                  {
                    step: '03. Verify',
                    desc: 'Claimant answers a hidden-detail check so nobody can falsely claim an item.',
                  },
                  {
                    step: '04. Reunite',
                    desc: 'Confirm handover at a staffed campus desk like Main Security or Central Library.',
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="bg-white border border-slate-200 rounded-xl p-5 space-y-1.5"
                  >
                    <h3 className="font-display text-sm font-bold text-[#0F1A38]">{item.step}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 bg-[#0F1A38] text-white rounded-2xl p-7 space-y-5">
              <div className="w-11 h-11 rounded-xl bg-[#F59E0B]/15 text-[#F59E0B] flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h3 className="font-display text-xl font-bold">Senior → Junior Book Chain</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  At semester end, seniors list textbooks, lab manuals, and calculators tagged with
                  target branch and semester. Juniors filter directly to what their upcoming term
                  requires and pick up on campus.
                </p>
              </div>
              <ul className="space-y-2.5 text-sm text-slate-200 pt-1">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#14B8A6] shrink-0 mt-0.5" />
                  <span>Donate, sell affordably, swap, or lend with return dates</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#14B8A6] shrink-0 mt-0.5" />
                  <span>Zero delivery middlemen — pick up at campus counters</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Privacy by Design */}
        <section id="trust" className="bg-white border-t border-slate-200 py-14">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-2xl">
              <h2 className="font-display text-xl font-bold text-[#0F1A38]">
                Privacy by design for verified campuses
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                UniLink separates private student contact records from public campus listings.
                Phone numbers are never publicly exposed, allowed email domains are configurable
                server-side, and Firestore rules restrict every mutation to the record owner.
              </p>
            </div>
            <button
              type="button"
              onClick={isSignedIn ? () => onExploreWorkspace('dashboard') : onGetStarted}
              className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#0F1A38] hover:bg-[#17254D] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isSignedIn ? 'Open Workspace' : 'Sign In to Continue'}
            </button>
          </div>
        </section>
      </main>

      <footer className="bg-[#F6F8FB] border-t border-slate-200 py-6">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>UniLink · Campus Lost & Found, ReLife Exchange, and Events</span>
          <span>Innovative & Design Thinking Lab (IDTL) Project</span>
        </div>
      </footer>
    </div>
  );
}
