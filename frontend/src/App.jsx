import { Routes, Route } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import ContactUsPage from "./pages/ContactUsPage";

import TeamPage from "./pages/TeamPage";
import Events from "./pages/Events"
import SponsorshipPage from "./pages/SponserUsPage"

/* ===== ADMIN AUTH ===== */
import AdminLogin from "./pages/admin/AdminLogin";
import ForgotPassword from "./pages/admin/ForgotPassword";
import ResetPassword from "./pages/admin/ResetPassword";
import AdminGuard from "./auth/AdminGuard";

/* ===== ADMIN LAYOUT & PAGES ===== */
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProfile from "./pages/admin/AdminProfile";
import ChangePassword from "./pages/admin/ChangePassword";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";
import AdminContactMessages from "./pages/admin/AdminContactMessages";
import AdminTeamPage from "./pages/admin/AdminTeamPage";
import AdminProjectsPage from "./pages/admin/AdminProjectsPage";
import AdminGalleryPage from "./pages/admin/AdminGalleryPage";
import AdminAnnouncementsPage from "./pages/admin/AdminAnnouncementsPage";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminEventForm from "./pages/admin/AdminEventForm";
import AdminRolesPage from "./pages/admin/AdminRolesPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminTaxonomyPage from "./pages/admin/AdminTaxonomyPage"; // NEW
import AdminSponsorshipMessages from "./pages/admin/AdminSponsorship"

/* ===== PUBLIC DETAILS ===== */
import AnnouncementsPage from "./pages/AnnouncementsPage"
import AnnouncementDetailPage from "./pages/AnnouncementDetailPage"

// ERROR PAGES
import Error404 from "./pages/Error404";
import Error403 from "./pages/Error403";
import Error500 from "./pages/Error500";
import Offline from "./pages/Offline"

function App() {
  return (
    <Routes>
      {/* ===== PUBLIC ROUTES ===== */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/events" element={<Events />} />
      <Route path="/team" element={<TeamPage />} />
      <Route path="/contactUs" element={<ContactUsPage />} />
      <Route path="/announcements" element={<AnnouncementsPage />} />
      <Route path="/announcements/:id" element={<AnnouncementDetailPage />} />
      <Route path="/sponsorship" element={<SponsorshipPage />} />

      {/* ===== AUTH ROUTES ===== */}
      <Route path="/login" element={<AdminLogin />} />
      <Route path="/admin/forgot-password" element={<ForgotPassword />} />
      <Route path="/admin/reset-password/:token" element={<ResetPassword />} />

      {/* ===== ADMIN DASHBOARD (PROTECTED LAYOUT) ===== */}
      <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="profile" element={<AdminProfile />} />

        <Route path="users" element={<AdminUsersPage />} />
        <Route path="taxonomy" element={<AdminTaxonomyPage />} /> {/* NEW */}
        <Route path="roles" element={<AdminRolesPage />} />
        <Route path="team" element={<AdminTeamPage />} />

        <Route path="projects" element={<AdminProjectsPage />} />
        <Route path="events" element={<AdminEvents />} />
        <Route path="events/new" element={<AdminEventForm />} />
        <Route path="events/:id" element={<AdminEventForm />} />

        <Route path="gallery" element={<AdminGalleryPage />} />
        <Route path="announcements" element={<AdminAnnouncementsPage />} />

        <Route path="sponsorship" element={<AdminSponsorshipMessages />} />
        <Route path="contactMessages" element={<AdminContactMessages />} />

        <Route path="change-password" element={<ChangePassword />} />
        <Route path="audit-logs" element={<AdminAuditLogs />} />
      </Route>

      {/* Error Pages */}
      <Route path="/403" element={<Error403 />} />
      <Route path="/500" element={<Error500 />} />
      <Route path="/offline" element={<Offline />} />
      <Route path="*" element={<Error404 />} />

    </Routes>
  );
}

export default App;
