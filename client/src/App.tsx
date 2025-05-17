import { Switch, Route } from "wouter";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import ChatWidget from "@/components/chatbot/chat-widget";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import Transactions from "@/pages/transactions";
import CreateTransaction from "@/pages/create-transaction";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ContentPage from "@/pages/content-page";
import NotFound from "@/pages/not-found";
import AdminPage from "@/pages/admin";
import AdminUsersPage from "@/pages/admin/users";
import AdminContentPage from "@/pages/admin/content";
import AdminTransactionsPage from "@/pages/admin/transactions";
import AdminDisputesPage from "@/pages/admin/disputes";
import AdminEnhancedLogin from "@/pages/admin/new-login";
import AdminDashboard from "@/pages/admin/dashboard";
import AboutPage from "@/pages/company/about";
import CareersPage from "@/pages/company/careers";
import PartnersPage from "@/pages/company/partners";
import TermsPage from "@/pages/legal/terms";
import PrivacyPage from "@/pages/legal/privacy";
import FeaturesPage from "@/pages/product/features";
import PricingPage from "@/pages/product/pricing";
import IntegrationsPage from "@/pages/product/integrations";
import EnterprisePage from "@/pages/product/enterprise";
import SecurityPage from "@/pages/product/security";
import BuyerDashboard from "@/pages/dashboard/buyer-dashboard";
import SellerDashboard from "@/pages/dashboard/seller-dashboard";
import BrokerDashboard from "@/pages/dashboard/broker-dashboard";
import { AuthProvider, useAuth } from "./contexts/auth-context";

// This component is only rendered when Auth is available
function ProtectedRoutes() {
  const { user } = useAuth();

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/admin/login" component={AdminEnhancedLogin} />
      
      {/* User Dashboard and Transaction Routes */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/dashboard/buyer" component={BuyerDashboard} />
      <Route path="/dashboard/seller" component={SellerDashboard} />
      <Route path="/dashboard/broker" component={BrokerDashboard} />
      <Route path="/transactions" component={Transactions} />
      <Route path="/create-transaction" component={CreateTransaction} />
      
      {/* Product Pages */}
      <Route path="/product/features" component={FeaturesPage} />
      <Route path="/product/pricing" component={PricingPage} />
      <Route path="/product/integrations" component={IntegrationsPage} />
      <Route path="/product/enterprise" component={EnterprisePage} />
      <Route path="/product/security" component={SecurityPage} />
      
      {/* Company Pages */}
      <Route path="/company/about" component={AboutPage} />
      <Route path="/company/careers" component={CareersPage} />
      <Route path="/company/partners" component={PartnersPage} />
      
      {/* Legal Pages */}
      <Route path="/legal/terms" component={TermsPage} />
      <Route path="/legal/privacy" component={PrivacyPage} />
      
      {/* Admin Routes - these are still protected by role */}
      {user && user.role === "admin" && (
        <>
          <Route path="/admin" component={AdminPage} />
          <Route path="/admin/dashboard" component={AdminDashboard} />
          <Route path="/admin/users" component={AdminUsersPage} />
          <Route path="/admin/content" component={AdminContentPage} />
          <Route path="/admin/transactions" component={AdminTransactionsPage} />
          <Route path="/admin/disputes" component={AdminDisputesPage} />
        </>
      )}
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

// The authenticated part of the app that uses the auth context
function AuthenticatedApp() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <ProtectedRoutes />
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
}

// Main App wrapper
function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

export default App;
