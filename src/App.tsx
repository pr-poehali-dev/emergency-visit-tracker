
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Index from "./pages/Index";
import InstallPWA from "./components/InstallPWA";
import ConnectionStatus from "@/components/ui/connection-status";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ConnectionStatus />
      <Index />
      <InstallPWA />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;