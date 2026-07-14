import { Routes, Route, Link } from "react-router-dom";
import EnvironmentBanner from "./components/EnvironmentBanner";
import HomePage from "./pages/HomePage";
import { LogoutButton } from "./components/LogoutButton";

function App() {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <EnvironmentBanner />

      <header className="border-b border-energy/60 bg-bluespruce">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="inline-flex min-w-0 items-baseline gap-2 rounded-sm text-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-energy/60 focus-visible:ring-offset-4 focus-visible:ring-offset-bluespruce"
          >
            <span className="text-lg font-semibold">Webapp</span>
          </Link>

          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
