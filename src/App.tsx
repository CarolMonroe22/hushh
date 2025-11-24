import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Account from "./pages/Account";
import Admin from "./pages/Admin";
import Premium from "./pages/Premium";
import Community from "./pages/Community";
import UserProfile from "./pages/UserProfile";
import NotFound from "./pages/NotFound";
import EnvBanner from "@/components/EnvBanner";
import useConnectivity from "@/hooks/useConnectivity";

const queryClient = new QueryClient();

const ConnectivityWrapper = ({ children }: { children: React.ReactNode }) => {
  useConnectivity();
  return <>{children}</>;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ConnectivityWrapper>
          <Toaster />
          <Sonner />
          <EnvBanner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/account" element={<Account />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/premium" element={<Premium />} />
              <Route path="/community" element={<Community />} />
              <Route path="/profile/:userId" element={<UserProfile />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ConnectivityWrapper>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
