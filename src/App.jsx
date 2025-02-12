import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute, { AdminRoute } from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Public pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Features from './pages/Features';
import Pricing from './pages/Pricing';
import Enterprise from './pages/Enterprise';
import HowItWorks from './pages/HowItWorks';
import About from './pages/About';
import Careers from './pages/Careers';
import Blog from './pages/Blog';
import Press from './pages/Press';
import Help from './pages/Help';
import Contact from './pages/Contact';
import Trust from './pages/Trust';
import Report from './pages/Report';
import PartnerProgram from './pages/PartnerProgram';
import ApiDocs from './pages/ApiDocs';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Cookies from './pages/Cookies';

// Protected pages
import Settings from './pages/Settings';
import ClientDashboard from './pages/ClientDashboard';
import FreelancerDashboard from './pages/FreelancerDashboard';
import PostJob from './pages/PostJob';
import ActiveJobs from './pages/ActiveJobs';
import DirectMessages from './pages/DirectMessages';
import Notifications from './pages/Notifications';
import PaymentMethods from './pages/PaymentMethods';
import BrowseJobs from './pages/BrowseJobs';
import FreelancerProfile from './pages/FreelancerProfile';
import JobDetails from './pages/JobDetails';
import EditProfile from './pages/EditProfile';

// Admin pages
import AdminDashboard from './pages/AdminDashboard';
import AdminJobs from './pages/admin/AdminJobs';
import AdminDisputes from './pages/admin/AdminDisputes';
import AdminVerifyProfiles from './pages/admin/AdminVerifyProfiles';

// Wrapper component to handle location-based notifications
const AppRoutes = () => {
  const handleAccessDenied = (message, severity = 'error') => {
    toast[severity](message, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-gray-50">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/features" element={<Features />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/enterprise" element={<Enterprise />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/about" element={<About />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/press" element={<Press />} />
          <Route path="/help" element={<Help />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/trust" element={<Trust />} />
          <Route path="/report" element={<Report />} />
          <Route path="/partner-program" element={<PartnerProgram />} />
          <Route path="/api-docs" element={<ApiDocs />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/cookies" element={<Cookies />} />

          {/* Admin routes with enhanced protection */}
          <Route
            path="/admin/*"
            element={
              <AdminRoute 
                allowUnverified={false}
                onAccessDenied={handleAccessDenied}
              >
                <Routes>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="jobs" element={<AdminJobs />} />
                  <Route path="disputes" element={<AdminDisputes />} />
                  <Route path="verify-profiles" element={<AdminVerifyProfiles />} />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Routes>
              </AdminRoute>
            }
          />

          {/* Client routes */}
          <Route path="/client/*" element={
            <ProtectedRoute requiredRole="client" onAccessDenied={handleAccessDenied}>
              <Routes>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<ClientDashboard />} />
                <Route path="post-job" element={<PostJob />} />
                <Route path="active-jobs" element={<ActiveJobs />} />
                <Route path="browse-freelancers" element={<FreelancerProfile />} />
                <Route path="messages" element={<DirectMessages />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="payments" element={<PaymentMethods />} />
                <Route path="settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </ProtectedRoute>
          } />

          {/* Freelancer routes */}
          <Route path="/freelancer/*" element={
            <ProtectedRoute requiredRole="freelancer" onAccessDenied={handleAccessDenied}>
              <Routes>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<FreelancerDashboard />} />
                <Route path="browse-jobs" element={<BrowseJobs />} />
                <Route path="active-jobs" element={<ActiveJobs />} />
                <Route path="profile" element={<FreelancerProfile />} />
                <Route path="messages" element={<DirectMessages />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="payments" element={<PaymentMethods />} />
                <Route path="settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </ProtectedRoute>
          } />

          {/* Shared protected routes */}
          <Route path="/jobs/:id" element={
            <ProtectedRoute onAccessDenied={handleAccessDenied}>
              <JobDetails />
            </ProtectedRoute>
          } />
          <Route path="/edit-profile" element={
            <ProtectedRoute onAccessDenied={handleAccessDenied}>
              <EditProfile />
            </ProtectedRoute>
          } />

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppRoutes />
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
