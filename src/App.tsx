import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "@/pages/Index";
import About from "@/pages/About";
import Sections from "@/pages/Sections";
import Gallery from "@/pages/Gallery";
import News from "@/pages/News";
import Contact from "@/pages/Contact";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/admin/Login";
import DashboardLayout from "@/pages/admin/DashboardLayout";
import DashboardOverview from "@/pages/admin/DashboardOverview";
import ChildrenPage from "@/pages/admin/ChildrenPage";
import StaffPage from "@/pages/admin/StaffPage";
import ParentsPage from "@/pages/admin/ParentsPage";
import AttendancePage from "@/pages/admin/AttendancePage";
import DailyReportsPage from "@/pages/admin/DailyReportsPage";
import MessagesPage from "@/pages/admin/MessagesPage";
import SettingsPage from "@/pages/admin/SettingsPage";
import QRScanPage from "@/pages/admin/QRScanPage";
import ParentDashboard from "@/pages/parent/Dashboard";
import EducatorDashboardLayout from "@/pages/educator/EducatorDashboardLayout";
import EducatorGroupPage from "@/pages/educator/EducatorGroupPage";
import EducatorDailyReportsPage from "@/pages/educator/EducatorDailyReportsPage";
import EducatorAttendancePage from "@/pages/educator/EducatorAttendancePage";
import ForgotPassword from "@/pages/admin/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename="/">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/sections" element={<Sections />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/news" element={<News />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/parent/dashboard" element={<ParentDashboard />} />
            <Route path="/admin/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardOverview />} />
              <Route path="children" element={<ChildrenPage />} />
              <Route path="staff" element={<StaffPage />} />
              <Route path="parents" element={<ParentsPage />} />
              <Route path="attendance" element={<AttendancePage />} />
              <Route path="qr-scanner" element={<QRScanPage />} />
              <Route path="daily-reports" element={<DailyReportsPage />} />
              <Route path="messages" element={<MessagesPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            <Route path="/educator/dashboard" element={<EducatorDashboardLayout />}>
              <Route index element={<EducatorGroupPage />} />
              <Route path="attendance" element={<EducatorAttendancePage />} />
              <Route path="daily-reports" element={<EducatorDailyReportsPage />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
