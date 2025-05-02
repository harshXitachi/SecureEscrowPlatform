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
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "./contexts/auth-context";

// This component is only rendered when Auth is available
function ProtectedRoutes() {
  const { user } = useAuth();

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {user ? (
        <>
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/transactions" component={Transactions} />
          <Route path="/create-transaction" component={CreateTransaction} />
        </>
      ) : null}
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

// The authenticated part of the app that uses the auth context
function AuthenticatedApp() {
  const { user } = useAuth();
  
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
