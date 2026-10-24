import React, { useState, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import NotificationDrawer from './components/NotificationDrawer';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { PageSkeleton } from './components/LoadingSkeleton';

// Code-split route-level pages with React.lazy
const LandingPage = lazy(() => import('./pages/LandingPage'));
const CataloguePage = lazy(() => import('./pages/CataloguePage'));
const OpportunityDetailPage = lazy(() => import('./pages/OpportunityDetailPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SavedPage = lazy(() => import('./pages/SavedPage'));
const RoadmapsPage = lazy(() => import('./pages/RoadmapsPage'));
const PeerMatchingPage = lazy(() => import('./pages/PeerMatchingPage'));
import AccessDeniedPage from './pages/AccessDeniedPage';
const AdminPage = lazy(() => import('./pages/AdminPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

export default function App() {
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  return (
    <ErrorBoundary>
      {/* Main Sticky Navbar with notification counter */}
      <Navbar
        onOpenNotifications={() => setNotificationDrawerOpen(true)}
        notificationCount={unreadNotificationCount}
      />

      {/* Slide-over Activity & Deadline Notifications Drawer */}
      <NotificationDrawer
        isOpen={notificationDrawerOpen}
        onClose={() => setNotificationDrawerOpen(false)}
        onNotificationCountChange={(count) => setUnreadNotificationCount(count)}
      />

      {/* Application Routing with Lazy Suspense Fallback */}
      <main id="main-content">
        <Suspense fallback={<PageSkeleton count={6} />}>
          <Routes>
            {/* Public Discovery Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/explore" element={<CataloguePage />} />
            
            {/* Opportunity Details (Primary and compatibility alias) */}
            <Route path="/opportunities/:id" element={<OpportunityDetailPage />} />
            <Route path="/opportunity/:id" element={<OpportunityDetailPage />} />

            {/* Authentication Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Student Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/saved"
              element={
                <ProtectedRoute>
                  <SavedPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/roadmaps"
              element={
                <ProtectedRoute>
                  <RoadmapsPage />
                </ProtectedRoute>
              }
            />
            
            {/* Peer Collaboration (/peers with backward-compatible redirect) */}
            <Route
              path="/peers"
              element={
                <ProtectedRoute>
                  <PeerMatchingPage />
                </ProtectedRoute>
              }
            />
            <Route path="/peer-matching" element={<Navigate to="/peers" replace />} />

            {/* Protected Curator Admin Route */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminPage />
                </ProtectedRoute>
              }
            />

            {/* Access Denied Route */}
            <Route path="/access-denied" element={<AccessDeniedPage />} />
            <Route path="/forbidden" element={<AccessDeniedPage />} />

            {/* Accessible 404 Fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>

      {/* Editorial Footer */}
      <Footer />
    </ErrorBoundary>
  );
}
