import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';

// Public Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Dashboards
import ClientDashboard from './pages/ClientDashboard';
import FreelancerDashboard from './pages/FreelancerDashboard';
import AdminDashboard from './pages/AdminDashboard';

// Admin Pages
import AdminDisputes from './pages/admin/AdminDisputes';
import AdminJobs from './pages/admin/AdminJobs';
import AdminReports from './pages/admin/AdminReports';
import AdminVerifyProfiles from './pages/admin/AdminVerifyProfiles';

// Job Related Pages
import BrowseJobs from './pages/BrowseJobs';
import ActiveJobs from './pages/ActiveJobs';
import JobDetails from './pages/JobDetails';
import PostJob from './pages/PostJob';
import JobAlerts from './pages/JobAlerts';

// User Account Pages
import EditProfile from './pages/EditProfile';
import DirectMessages from './pages/DirectMessages';
import DirectContracts from './pages/DirectContracts';
import CompanySettings from './pages/CompanySettings';
import PaymentMethods from './pages/PaymentMethods';
import TransactionHistory from './pages/TransactionHistory';
import Earnings from './pages/Earnings';
import FreelancerProfile from './pages/FreelancerProfile';

// Information & Support
import Blog from './pages/Blog';
import Features from './pages/Features';
import HowItWorks from './pages/HowItWorks';
import HowToFindWork from './pages/HowToFindWork';
import HowToHire from './pages/HowToHire';
import PaymentProtection from './pages/PaymentProtection';
import Pricing from './pages/Pricing';
import SuccessStories from './pages/SuccessStories';
import Support from './pages/Support';
import TalentMarketplace from './pages/TalentMarketplace';

// Additional Resources
import Enterprise from './pages/Enterprise';
import Learning from './pages/Learning';
import Community from './pages/Community';
import Trust from './pages/Trust';
import ApiDocs from './pages/ApiDocs';
import PartnerProgram from './pages/PartnerProgram';
import Newsletter from './pages/Newsletter';
import ContactSales from './pages/ContactSales';
import Demo from './pages/enterprise/Demo';
import Report from './pages/Report';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">
            <React.Suspense fallback={
              <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner />
              </div>
            }>
              <Routes>
                {/* Public Routes - Main */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* Public Routes - Information */}
                <Route path="/blog" element={<Blog />} />
                <Route path="/features" element={<Features />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/find-work" element={<HowToFindWork />} />
                <Route path="/hire" element={<HowToHire />} />
                <Route path="/payment-protection" element={<PaymentProtection />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/success-stories" element={<SuccessStories />} />
                <Route path="/support" element={<Support />} />
                <Route path="/talent" element={<TalentMarketplace />} />
                <Route path="/enterprise" element={<Enterprise />} />
                <Route path="/enterprise/demo" element={<Demo />} />
                <Route path="/contact-sales" element={<ContactSales />} />
                <Route path="/learning" element={<Learning />} />
                <Route path="/community" element={<Community />} />
                <Route path="/trust" element={<Trust />} />
                <Route path="/api" element={<ApiDocs />} />
                <Route path="/partners" element={<PartnerProgram />} />
                <Route path="/newsletter" element={<Newsletter />} />
                <Route path="/report" element={<Report />} />

                {/* Client Routes */}
                <Route
                  path="/client-dashboard/*"
                  element={
                    <ProtectedRoute allowedRoles={['client']}>
                      <ClientDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/company-settings"
                  element={
                    <ProtectedRoute allowedRoles={['client']}>
                      <CompanySettings />
                    </ProtectedRoute>
                  }
                />
                
                {/* Shared Job Routes */}
                <Route
                  path="/browse-jobs"
                  element={
                    <ProtectedRoute allowedRoles={['client', 'freelancer']}>
                      <BrowseJobs />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/jobs/*"
                  element={
                    <ProtectedRoute allowedRoles={['client', 'freelancer']}>
                      <ActiveJobs />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/jobs/:id"
                  element={
                    <ProtectedRoute allowedRoles={['client', 'freelancer']}>
                      <JobDetails />
                    </ProtectedRoute>
                  }
                />

                {/* Freelancer Routes */}
                <Route
                  path="/freelancer-dashboard/*"
                  element={
                    <ProtectedRoute allowedRoles={['freelancer']}>
                      <FreelancerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/freelancer/:id"
                  element={
                    <ProtectedRoute allowedRoles={['client', 'freelancer']}>
                      <FreelancerProfile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/contracts"
                  element={
                    <ProtectedRoute allowedRoles={['freelancer', 'client']}>
                      <DirectContracts />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/job-alerts"
                  element={
                    <ProtectedRoute allowedRoles={['freelancer']}>
                      <JobAlerts />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/earnings"
                  element={
                    <ProtectedRoute allowedRoles={['freelancer']}>
                      <Earnings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/post-job"
                  element={
                    <ProtectedRoute allowedRoles={['client']}>
                      <PostJob />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/disputes"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDisputes />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/jobs"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminJobs />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/reports"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminReports />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/verify-profiles"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminVerifyProfiles />
                    </ProtectedRoute>
                  }
                />

                {/* Shared Account Routes */}
                <Route
                  path="/edit-profile"
                  element={
                    <ProtectedRoute allowedRoles={['client', 'freelancer', 'admin']}>
                      <EditProfile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/messages"
                  element={
                    <ProtectedRoute allowedRoles={['client', 'freelancer']}>
                      <DirectMessages />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payment-methods"
                  element={
                    <ProtectedRoute allowedRoles={['client', 'freelancer']}>
                      <PaymentMethods />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/transactions"
                  element={
                    <ProtectedRoute allowedRoles={['client', 'freelancer']}>
                      <TransactionHistory />
                    </ProtectedRoute>
                  }
                />

                {/* Legacy URL Support */}
                <Route path="/active-jobs" element={<Navigate to="/jobs" replace />} />
                <Route path="/profile" element={<Navigate to="/edit-profile" replace />} />
                <Route path="/browse" element={<Navigate to="/browse-jobs" replace />} />
                <Route path="/docs" element={<Navigate to="/api" replace />} />
                <Route path="/security" element={<Navigate to="/trust" replace />} />

                {/* 404 Route */}
                <Route
                  path="*"
                  element={
                    <div className="min-h-screen flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                        <p className="text-gray-600">Page not found. Return to <a href="/" className="text-primary hover:underline">Home</a></p>
                      </div>
                    </div>
                  }
                />
              </Routes>
            </React.Suspense>
          </main>
          <Footer />
        </div>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </AuthProvider>
    </Router>
  );
}
