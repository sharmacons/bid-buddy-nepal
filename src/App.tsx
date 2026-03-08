import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import CompanyProfile from "./pages/CompanyProfile";
import NewBid from "./pages/NewBid";
import BidDetail from "./pages/BidDetail";
import Templates from "./pages/Templates";
import BidTracker from "./pages/BidTracker";
import Documents from "./pages/Documents";
import BidAnalysis from "./pages/BidAnalysis";
import BoqWizard from "./pages/BoqWizard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/company" element={<CompanyProfile />} />
            <Route path="/bid/new" element={<NewBid />} />
            <Route path="/bid/:id" element={<BidDetail />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/tracker" element={<BidTracker />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/analyze" element={<BidAnalysis />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
