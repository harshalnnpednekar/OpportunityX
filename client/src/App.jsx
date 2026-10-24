import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import DemoBanner from './components/DemoBanner';
import NotificationDrawer from './components/NotificationDrawer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import CataloguePage from './pages/CataloguePage';
import OpportunityDetailPage from './pages/OpportunityDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import SavedPage from './pages/SavedPage';
import RoadmapsPage from './pages/RoadmapsPage';
import PeerMatchingPage from './pages/PeerMatchingPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);

  return (
    <>
      {/* Top Demo Simulation Banner */}
      <DemoBanner />

      {/* Main Sticky Navbar */}
      <Navbar onOpenNotifications={() => setNotificationDrawerOpen(true)} />

      {/* Slide-over Deadline Notifications Drawer */}
      <NotificationDrawer
        isOpen={notificationDrawerOpen}
        onClose={() => setNotificationDrawerOpen(false)}
      />

      {/* Application Routing */}
      <main id="main-content">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/explore" element={<CataloguePage />} />
          <Route path="/opportunity/:id" element={<OpportunityDetailPage />} />
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
          <Route
            path="/peer-matching"
            element={
              <ProtectedRoute>
                <PeerMatchingPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Curator Admin Route */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback to explore */}
          <Route path="*" element={<CataloguePage />} />
        </Routes>
      </main>

      {/* Editorial Footer */}
      <Footer />
    </>
  );
}
