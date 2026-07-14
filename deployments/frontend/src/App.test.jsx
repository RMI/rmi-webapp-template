import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { useAuth0 } from "@auth0/auth0-react";
import { renderWithQueryClient } from "./test/utils";
import App from "./App";

describe("App", () => {
  beforeEach(() => {
    vi.mocked(useAuth0).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      error: null,
      user: { sub: "test-user-id", email: "test@example.com" },
      getAccessTokenSilently: vi.fn().mockResolvedValue("test-access-token"),
      loginWithRedirect: vi.fn(),
      logout: vi.fn(),
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    });
  });

  it("renders the app shell with a home link and logout", () => {
    renderWithQueryClient(<App />);
    expect(screen.getByRole("link", { name: /webapp/i })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("renders the Widgets card on the home route", () => {
    renderWithQueryClient(<App />);
    expect(
      screen.getByRole("heading", { name: "Widgets" }),
    ).toBeInTheDocument();
  });
});
