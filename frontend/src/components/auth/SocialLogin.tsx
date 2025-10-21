import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import type { SocialProvider } from '../../types/auth';

const GOOGLE_CLIENT_SCRIPT_ID = 'google-oauth-client';
const FACEBOOK_SDK_SCRIPT_ID = 'facebook-jssdk';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: { client_id: string; callback: (response: { credential?: string }) => void; ux_mode?: 'popup' | 'redirect' }) => void;
          renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
          prompt: () => void;
        };
      };
    };
    FB?: {
      init: (options: { appId: string; cookie: boolean; xfbml: boolean; version: string }) => void;
      login: (
        callback: (response: { authResponse?: { accessToken: string }; status?: string }) => void,
        options?: { scope?: string }
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

interface SocialLoginProps {
  onSuccess: () => void;
  onError: (message: string) => void;
}

export default function SocialLogin({ onSuccess, onError }: SocialLoginProps) {
  const { t } = useTranslation();
  const { socialLogin } = useAuth();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [activeProvider, setActiveProvider] = useState<SocialProvider | null>(null);
  const [googleReady, setGoogleReady] = useState(false);
  const [facebookReady, setFacebookReady] = useState(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID;

  useEffect(() => {
    if (!googleClientId) {
      return;
    }

    const initializeGoogle = () => {
      if (!window.google?.accounts?.id) {
        onError(t('auth.socialLoadError'));
        return;
      }

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response: { credential?: string }) => {
          if (!response.credential) {
            onError(t('auth.socialCancelled'));
            return;
          }

          try {
            setActiveProvider('google');
            await socialLogin('google', response.credential);
            onSuccess();
          } catch (err: any) {
            const message = err?.response?.data?.error || t('auth.socialLoginError');
            onError(message);
          } finally {
            setActiveProvider(null);
          }
        },
        ux_mode: 'popup',
      });

      if (googleButtonRef.current) {
        googleButtonRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          width: 320,
          text: 'signin_with',
        });
      }

      setGoogleReady(true);
    };

    if (window.google?.accounts?.id) {
      initializeGoogle();
      return;
    }

    const existingScript = document.getElementById(GOOGLE_CLIENT_SCRIPT_ID);
    if (existingScript) {
      existingScript.addEventListener('load', initializeGoogle);
      return () => existingScript.removeEventListener('load', initializeGoogle);
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.id = GOOGLE_CLIENT_SCRIPT_ID;
    script.onload = initializeGoogle;
    script.onerror = () => onError(t('auth.socialLoadError'));
    document.head.appendChild(script);

    return () => {
      script.onload = null;
    };
  }, [googleClientId, onError, onSuccess, socialLogin, t]);

  useEffect(() => {
    if (!facebookAppId) {
      return;
    }

    const initializeFacebook = () => {
      if (!window.FB) {
        onError(t('auth.socialLoadError'));
        return;
      }

      window.FB.init({
        appId: facebookAppId,
        cookie: true,
        xfbml: false,
        version: 'v19.0',
      });

      setFacebookReady(true);
    };

    if (window.FB) {
      initializeFacebook();
      return;
    }

    window.fbAsyncInit = initializeFacebook;
    const existingScript = document.getElementById(FACEBOOK_SDK_SCRIPT_ID);
    if (existingScript) {
      return;
    }

    const script = document.createElement('script');
    script.id = FACEBOOK_SDK_SCRIPT_ID;
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    script.onerror = () => onError(t('auth.socialLoadError'));
    document.body.appendChild(script);
  }, [facebookAppId, onError, t]);

  const handleFacebookLogin = () => {
    if (!window.FB) {
      onError(t('auth.socialLoadError'));
      return;
    }

    window.FB.login(
      async (response) => {
        if (response.authResponse?.accessToken) {
          try {
            setActiveProvider('facebook');
            await socialLogin('facebook', response.authResponse.accessToken);
            onSuccess();
          } catch (err: any) {
            const message = err?.response?.data?.error || t('auth.socialLoginError');
            onError(message);
          } finally {
            setActiveProvider(null);
          }
        } else {
          onError(t('auth.socialCancelled'));
        }
      },
      { scope: 'email' }
    );
  };

  if (!googleClientId && !facebookAppId) {
    return null;
  }

  return (
    <div className="space-y-3">
      {googleClientId && (
        <div
          ref={googleButtonRef}
          className={`w-full flex justify-center ${activeProvider && activeProvider !== 'google' ? 'opacity-50 pointer-events-none' : ''}`}
          aria-disabled={!googleReady || !!activeProvider}
        />
      )}
      {facebookAppId && (
        <button
          type="button"
          onClick={handleFacebookLogin}
          disabled={!facebookReady || (activeProvider !== null && activeProvider !== 'facebook')}
          className="w-full flex items-center justify-center gap-3 rounded-md border border-blue-600 bg-blue-600 text-white px-4 py-2 text-sm font-medium transition disabled:opacity-60 disabled:cursor-not-allowed hover:bg-blue-700"
        >
          {activeProvider === 'facebook' ? t('common.loading') : t('auth.continueWithFacebook')}
        </button>
      )}
    </div>
  );
}
