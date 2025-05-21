import {
  isRouteErrorResponse,
  Links,
  Meta,
  Navigate,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import React from "react";
import ResponsiveNavigation from "./layout/ResponsiveNavigation";
import { sidebarItems, bottomBarItems } from "./layout/navigationItems";
import { AuthProvider, useAuth } from "./components/auth/AuthContext";

export function ProtectedAppLayout() {
  console.log('protexted')
  const { isAuthenticated, ready } = useAuth();
  const location = useLocation();

  const publicRoutes = ["/login", "/register"];
  const isPublic = publicRoutes.includes(location.pathname);

  if (!ready) return null; // wait for hydration

  if (!isAuthenticated && !isPublic) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="flex h-screen flex-col md:flex-row">
      <ResponsiveNavigation sidebarItems={sidebarItems} bottomBarItems={bottomBarItems} />
      <div className="flex-1 pb-16">
        <Outlet />
      </div>
    </div>
  );
}

// export default function App() {
//   console.log('app')
//   return (
//     <AuthProvider>
//       <ProtectedAppLayout />
//     </AuthProvider>
//   );
// }

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

// {/* <link rel="manifest" href="/manifest.json" /> */}
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
