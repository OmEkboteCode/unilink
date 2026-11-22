import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppShell, type WorkspaceTab } from './components/AppShell';
import { AuthView } from './components/AuthView';
import { DashboardView } from './components/DashboardView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { EventsModule } from './components/EventsModule';
import { FindModule } from './components/FindModule';
import { LandingPage } from './components/LandingPage';
import { ProfileView } from './components/ProfileView';
import { ReuseModule } from './components/ReuseModule';
import {
  removeSavedEvent,
  saveEventInterest,
  subscribeCampusEvents,
  subscribeCampusListings,
  subscribeCampusReports,
  subscribeMyRequests,
  subscribeSavedEvents,
} from './services/firestoreService';
import type {
  CampusEvent,
  ExchangeListing,
  ItemRequest,
  LostFoundReport,
  ReportType,
  SavedEvent,
} from './types/unilink';

function UniLinkApp() {
  const { user, authReady } = useAuth();

  const [surface, setSurface] = useState<'landing' | 'auth' | 'workspace'>('landing');
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('dashboard');

  const [reports, setReports] = useState<LostFoundReport[]>([]);
  const [listings, setListings] = useState<ExchangeListing[]>([]);
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [savedEvents, setSavedEvents] = useState<SavedEvent[]>([]);
  const [requests, setRequests] = useState<ItemRequest[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  const [findComposerType, setFindComposerType] = useState<ReportType | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [reuseCreateTrigger, setReuseCreateTrigger] = useState(false);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [eventsCreateTrigger, setEventsCreateTrigger] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Automatically enter workspace once authenticated from auth screen
  useEffect(() => {
    if (authReady && user && surface === 'auth') {
      setSurface('workspace');
    }
  }, [authReady, user, surface]);

  // Attach Firestore listeners strictly after authReady && user
  useEffect(() => {
    if (!authReady || !user) {
      setReports([]);
      setListings([]);
      setEvents([]);
      setSavedEvents([]);
      setRequests([]);
      setDataLoading(false);
      return;
    }

    setDataLoading(true);
    let reportsLoaded = false;
    let listingsLoaded = false;
    let eventsLoaded = false;

    const markReady = () => {
      if (reportsLoaded && listingsLoaded && eventsLoaded) {
        setDataLoading(false);
      }
    };

    const unsubReports = subscribeCampusReports((items) => {
      setReports(items);
      reportsLoaded = true;
      markReady();
    });

    const unsubListings = subscribeCampusListings((items) => {
      setListings(items);
      listingsLoaded = true;
      markReady();
    });

    const unsubEvents = subscribeCampusEvents((items) => {
      setEvents(items);
      eventsLoaded = true;
      markReady();
    });

    const unsubRequests = subscribeMyRequests(user.uid, (items) => {
      setRequests(items);
    });

    const unsubSavedEvents = subscribeSavedEvents(user.uid, (items) => {
      setSavedEvents(items);
    });

    return () => {
      unsubReports();
      unsubListings();
      unsubEvents();
      unsubRequests();
      unsubSavedEvents();
    };
  }, [authReady, user]);

  const savedEventIds = React.useMemo(
    () => new Set(savedEvents.map((item) => item.eventId)),
    [savedEvents],
  );

  const handleToggleSaveEvent = async (ev: CampusEvent): Promise<boolean> => {
    if (!user || !user.emailVerified) {
      throw new Error('Verify your email address before saving events to your dashboard.');
    }
    if (savedEventIds.has(ev.id)) {
      await removeSavedEvent(user.uid, ev.id);
      return false;
    }
    await saveEventInterest(user.uid, ev);
    return true;
  };

  const handleRemoveSavedEvent = async (eventId: string): Promise<void> => {
    if (!user || !user.emailVerified) {
      throw new Error('Verify your email address before updating saved events.');
    }
    await removeSavedEvent(user.uid, eventId);
  };

  const handleQuickAction = (action: 'lost' | 'found' | 'listing' | 'event') => {
    if (!user) {
      setSurface('auth');
      return;
    }
    setSurface('workspace');
    if (action === 'listing') {
      setActiveTab('reuse');
      setReuseCreateTrigger(true);
    } else if (action === 'event') {
      setActiveTab('events');
      setEventsCreateTrigger(true);
    } else {
      setActiveTab('find');
      setFindComposerType(action);
    }
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#F6F8FB] flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 rounded-full border-2 border-[#0F1A38] border-t-transparent animate-spin mx-auto" />
          <p className="text-xs font-medium text-slate-500">Loading UniLink...</p>
        </div>
      </div>
    );
  }

  if (surface === 'landing') {
    return (
      <LandingPage
        isSignedIn={Boolean(user)}
        onGetStarted={() => setSurface(user ? 'workspace' : 'auth')}
        onExploreWorkspace={(tab, itemId) => {
          if (!user) {
            setSurface('auth');
            return;
          }
          if (tab === 'find') setSelectedReportId(itemId ?? null);
          if (tab === 'reuse') setSelectedListingId(itemId ?? null);
          if (tab === 'events') setSelectedEventId(itemId ?? null);
          setActiveTab(tab);
          setSurface('workspace');
        }}
      />
    );
  }

  if (surface === 'auth' || !user) {
    return (
      <AuthView
        onBack={() => setSurface('landing')}
        onSuccess={() => setSurface('workspace')}
      />
    );
  }

  return (
    <AppShell
      activeTab={activeTab}
      onSelectTab={(tab) => setActiveTab(tab)}
      onGoLanding={() => setSurface('landing')}
      onQuickAction={handleQuickAction}
    >
      {activeTab === 'dashboard' && (
        <DashboardView
          reports={reports}
          listings={listings}
          events={events}
          savedEvents={savedEvents}
          savedEventIds={savedEventIds}
          requests={requests}
          loading={dataLoading}
          onQuickAction={handleQuickAction}
          onRemoveSavedEvent={handleRemoveSavedEvent}
          onNavigateFind={(reportId) => {
            setSelectedReportId(reportId ?? null);
            setActiveTab('find');
          }}
          onNavigateReuse={(listingId) => {
            setSelectedListingId(listingId ?? null);
            setActiveTab('reuse');
          }}
          onNavigateEvents={(eventId) => {
            setSelectedEventId(eventId ?? null);
            setActiveTab('events');
          }}
          onNavigateProfile={() => setActiveTab('profile')}
        />
      )}

      {activeTab === 'find' && (
        <FindModule
          reports={reports}
          loading={dataLoading}
          initialComposerType={findComposerType}
          onClearComposerTrigger={() => setFindComposerType(null)}
          selectedReportId={selectedReportId}
          onSelectReportId={setSelectedReportId}
        />
      )}

      {activeTab === 'reuse' && (
        <ReuseModule
          listings={listings}
          loading={dataLoading}
          openCreateTrigger={reuseCreateTrigger}
          onClearCreateTrigger={() => setReuseCreateTrigger(false)}
          selectedListingId={selectedListingId}
          onSelectListingId={setSelectedListingId}
        />
      )}

      {activeTab === 'events' && (
        <EventsModule
          events={events}
          loading={dataLoading}
          savedEventIds={savedEventIds}
          onToggleSaveEvent={handleToggleSaveEvent}
          openCreateTrigger={eventsCreateTrigger}
          onClearCreateTrigger={() => setEventsCreateTrigger(false)}
          selectedEventId={selectedEventId}
          onSelectEventId={setSelectedEventId}
        />
      )}

      {activeTab === 'profile' && <ProfileView />}
    </AppShell>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <UniLinkApp />
      </AuthProvider>
    </ErrorBoundary>
  );
}
