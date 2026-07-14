import { useAuth0 } from "@auth0/auth0-react";
import LoginPage from "../components/LoginPage";
import { useConfig } from "../config/useConfig";

export default function AuthGate({ children }) {
  const config = useConfig();
  const { isLoading, isAuthenticated, error } = useAuth0();

  // When auth is disabled (matches backend AUTH_DISABLED=true), skip Auth0
  // entirely so the app boots without an Auth0 tenant configured.
  if (config.authDisabled) {
    return children;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <p className="text-lg text-ink-muted">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <p className="text-lg text-danger">
          Authentication error: {error.message}
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return children;
}
