import { Auth0Provider } from '@auth0/auth0-react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';

interface Auth0ProviderWrapperProps {
  children: ReactNode;
}

function Auth0ProviderInner({ children }: Auth0ProviderWrapperProps) {
  const navigate = useNavigate();
  
  const domain = import.meta.env.VITE_AUTH0_DOMAIN;
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
  const redirectUri = typeof window !== 'undefined' ? `${window.location.origin}/admin` : '';

  if (!domain || !clientId) {
    console.warn('Auth0 configuration is missing. Auth0 features will not work.');
    return <>{children}</>;
  }

  const onRedirectCallback = (appState?: { returnTo?: string }) => {
    // Redirect back to admin route after login
    navigate(appState?.returnTo || '/admin', { replace: true });
  };

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: redirectUri,
        connection: 'google-oauth2', // Force Google login only
      }}
      onRedirectCallback={onRedirectCallback}
      cacheLocation="localstorage"
      useRefreshTokens={true}
    >
      {children}
    </Auth0Provider>
  );
}

export function Auth0ProviderWrapper({ children }: Auth0ProviderWrapperProps) {
  return <Auth0ProviderInner>{children}</Auth0ProviderInner>;
}

