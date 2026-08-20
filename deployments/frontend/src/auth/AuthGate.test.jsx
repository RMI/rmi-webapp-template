import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { useAuth0 } from "@auth0/auth0-react";
import { auth0TestDefaults, renderWithQueryClient } from "../test/utils";
import {
  setConfigForTests,
  resetConfigForTests,
  getConfig,
} from "../config/env";
import AuthGate from "./AuthGate";

describe("AuthGate", () => {
  it("shows loading indicator while auth is loading", () => {
    vi.mocked(useAuth0).mockReturnValue({
      ...auth0TestDefaults,
      isLoading: true,
      isAuthenticated: false,
    });

    renderWithQueryClient(
      <AuthGate>
        <div>App Content</div>
      </AuthGate>,
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByText("App Content")).not.toBeInTheDocument();
  });

  it("shows error message when auth fails", () => {
    vi.mocked(useAuth0).mockReturnValue({
      ...auth0TestDefaults,
      isAuthenticated: false,
      error: new Error("Something went wrong"),
    });

    renderWithQueryClient(
      <AuthGate>
        <div>App Content</div>
      </AuthGate>,
    );

    expect(
      screen.getByText("Authentication error: Something went wrong"),
    ).toBeInTheDocument();
    expect(screen.queryByText("App Content")).not.toBeInTheDocument();
  });

  it("renders LoginPage when unauthenticated", () => {
    vi.mocked(useAuth0).mockReturnValue({
      ...auth0TestDefaults,
      isAuthenticated: false,
    });

    renderWithQueryClient(
      <AuthGate>
        <div>App Content</div>
      </AuthGate>,
    );

    expect(screen.getByRole("heading", { name: "Webapp" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
    expect(screen.queryByText("App Content")).not.toBeInTheDocument();
  });

  it("bypasses auth entirely when config.authDisabled is true", () => {
    const previous = getConfig();
    setConfigForTests({ ...previous, authDisabled: true });

    vi.mocked(useAuth0).mockReturnValue({
      ...auth0TestDefaults,
      isAuthenticated: false,
    });

    try {
      renderWithQueryClient(
        <AuthGate>
          <div>App Content</div>
        </AuthGate>,
      );

      expect(screen.getByText("App Content")).toBeInTheDocument();
    } finally {
      resetConfigForTests();
      setConfigForTests(previous);
    }
  });
});
