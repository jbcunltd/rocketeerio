import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";
import { useLocation } from "wouter";
import Landing from "./Landing";

/**
 * Home page: shows the Landing page for unauthenticated visitors.
 * After OAuth callback, the server redirects here ("/") so the cookie
 * is already committed. We detect the session and forward to /dashboard.
 */
export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && user) {
      setLocation("/dashboard");
    }
  }, [user, loading, setLocation]);

  // While checking auth, show nothing (avoids flash of landing page)
  if (loading) return null;

  // Authenticated users are redirected above; only show landing to guests
  if (user) return null;

  return <Landing />;
}
