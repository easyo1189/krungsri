import { AuthProvider } from "@/hooks/use-auth";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ToastProvider } from "@/components/ui/toast";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import LoanPage from "@/pages/loan-page";
import ChatPage from "@/pages/chat-page";
import ProfilePage from "@/pages/profile-page";
import WithdrawalPage from "@/pages/withdrawal-page";
import TestToastPage from "@/pages/test-toast";
import TestToastNewPage from "@/pages/test-toast-new";
import AdminDashboardPage from "@/pages/admin/dashboard-page";
import AdminChatPage from "@/pages/admin/chat-page";
import AdminSettingsPage from "@/pages/admin/settings-page";
import AdminManagementPage from "@/pages/admin/admin-management-page";
import EasyPage from "@/pages/easy-page";
// เอาการนำเข้าหน้า users-list และ user-view ออกแล้ว
import { ProtectedRoute, AdminRoute } from "@/lib/protected-route";
import { ChatProvider } from "@/context/chat-context";
import { useBrandSettings } from "@/lib/useBrandSettings";

function Router() {
  const [location] = useLocation();
  const isAdminPage = location.startsWith("/admin");

  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/loan" component={LoanPage} />
      <ProtectedRoute path="/chat" component={ChatPage} />
      <ProtectedRoute path="/chat/:userId" component={ChatPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/withdrawal" component={WithdrawalPage} />
      <Route path="/test-toast" component={TestToastPage} />
      <Route path="/test-toast-new" component={TestToastNewPage} />
      <AdminRoute path="/easy" component={EasyPage} />
      <AdminRoute path="/admin" component={AdminDashboardPage} />
      <AdminRoute path="/admin/dashboard" component={AdminDashboardPage} />
      <AdminRoute path="/admin/chat" component={AdminChatPage} />
      <AdminRoute path="/admin/settings" component={AdminSettingsPage} />
      <AdminRoute path="/admin/management" component={AdminManagementPage} />
      {/* เส้นทางไปยังหน้า users-list และ user-view ถูกลบออกแล้ว */}
      <Route component={NotFound} />
    </Switch>
  );
}

function BrandSettingsLoader() {
  // Use the useBrandSettings hook to load and apply brand settings
  useBrandSettings();
  return null;
}

function App() {
  const [location] = useLocation();
  // ตรวจสอบทั้งหน้า /admin และหน้า /easy
  const isAdminPage = location.startsWith("/admin") || location === "/easy";
  
  // Different wrapper for admin pages vs regular pages
  const containerClass = isAdminPage 
    ? "w-full min-h-screen" // Full width for admin
    : "max-w-md mx-auto bg-white shadow-lg min-h-screen"; // Limited width for users
  
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <ChatProvider>
            {/* BrandSettingsLoader will apply CSS variables without rendering anything */}
            <BrandSettingsLoader />
            <div className={containerClass}>
              <Router />
            </div>
            <Toaster />
          </ChatProvider>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
