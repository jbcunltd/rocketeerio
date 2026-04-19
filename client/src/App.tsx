import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import TrackingPixels from "@/components/TrackingPixels";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ActivePageProvider } from "./contexts/ActivePageContext";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Conversations from "./pages/Conversations";
import ConversationDetail from "./pages/ConversationDetail";
import Leads from "./pages/Leads";
import KnowledgeBase from "./pages/KnowledgeBase";
import FollowUps from "./pages/FollowUps";
import Settings from "./pages/Settings";
import Billing from "./pages/Billing";
import Analytics from "./pages/Analytics";
import Integrations from "./pages/Integrations";
import AgentInbox from "./pages/AgentInbox";
import Onboarding from "./pages/Onboarding";
import { Privacy } from "./pages/Privacy";
import { Terms } from "./pages/Terms";
import ConnectPages from "./pages/ConnectPages";
import FacebookLeadsNotConverting from "./pages/FacebookLeadsNotConverting";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/conversations" component={Conversations} />
      <Route path="/conversations/:id" component={ConversationDetail} />
      <Route path="/leads" component={Leads} />
      <Route path="/knowledge-base" component={KnowledgeBase} />
      <Route path="/follow-ups" component={FollowUps} />
      <Route path="/connect/pages" component={ConnectPages} />
      <Route path="/settings" component={Settings} />
      <Route path="/billing" component={Billing} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/integrations" component={Integrations} />
      <Route path="/agent-inbox" component={AgentInbox} />
      <Route path="/facebook-leads-not-converting" component={FacebookLeadsNotConverting} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <ActivePageProvider>
            <TrackingPixels />
            <Toaster />
            <Router />
          </ActivePageProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
