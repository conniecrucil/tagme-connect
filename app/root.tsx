import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { PostHogProvider } from 'posthog-js/react';
import { Header } from "./components/Header";
import type { Route } from "./+types/root";
import "./app.css";
import { Footer } from "./components/Footer";
import { Toaster } from "./components/ui/toaster";
import { Toaster as SonnerToaster } from "./components/ui/sonner";
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://7184a4ca4bd3c0d242e0297974ff3ce0@o258608.ingest.us.sentry.io/4510055747223552",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true
});

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
  { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge,chrome=1" />
        <meta httpEquiv="Accept-CH" content="Sec-CH-UA-Platform-Version, Sec-CH-UA-Model" />
        
        {/* SEO Meta Tags */}
        <meta name="description" content="Your brand in their pocket—always. TAG Me Cards revolutionize professional networking with innovative e-business cards." />
        <meta name="keywords" content="TAG Me Cards, professional networking, eco-friendly business cards, digital business cards, Vancouver Island" />
        
        {/* Open Graph Meta Tags */}
        <meta property="og:site_name" content="Tagme Connections" />
        <meta property="og:title" content="Tagme Connections" />
        <meta property="og:url" content="https://www.tagmeconnections.com" />
        <meta property="og:type" content="website" />
        <meta property="og:description" content="Your brand in their pocket—always. TAG Me Cards revolutionize professional networking with innovative e-business cards." />
        <meta property="og:image" content="http://static1.squarespace.com/static/68340898052bb567b904f750/t/68356368c27139486f753152/1748329320613/IMG-20241122-WA0020+%281%29.png?format=1500w" />
        <meta property="og:image:width" content="1078" />
        <meta property="og:image:height" content="1600" />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:title" content="Tagme Connections" />
        <meta name="twitter:image" content="http://static1.squarespace.com/static/68340898052bb567b904f750/t/68356368c27139486f753152/1748329320613/IMG-20241122-WA0020+%281%29.png?format=1500w" />
        <meta name="twitter:url" content="https://www.tagmeconnections.com" />
        <meta name="twitter:card" content="summary" />
        
        {/* Schema.org Meta Tags */}
        <meta itemProp="name" content="Tagme Connections" />
        <meta itemProp="url" content="https://www.tagmeconnections.com" />
        <meta itemProp="thumbnailUrl" content="http://static1.squarespace.com/static/68340898052bb567b904f750/t/68356368c27139486f753152/1748329320613/IMG-20241122-WA0020+%281%29.png?format=1500w" />
        <meta itemProp="image" content="http://static1.squarespace.com/static/68340898052bb567b904f750/t/68356368c27139486f753152/1748329320613/IMG-20241122-WA0020+%281%29.png?format=1500w" />
        
        <Meta />
        <Links />
      </head>
      <body>
        <PostHogProvider
          apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
          options={{
            api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
            defaults: '2025-05-24',
            capture_exceptions: true,
            debug: import.meta.env.MODE === "development",
          }}
        >
          <Header />
          {children}
          <ScrollRestoration />
          <Scripts />
          <Footer />
          <Toaster />
          <SonnerToaster
            position="top-right"
            expand={false}
            richColors
            closeButton
          />
        </PostHogProvider>
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
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