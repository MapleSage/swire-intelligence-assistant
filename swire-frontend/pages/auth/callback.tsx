import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { code, error: authError } = router.query;
        
        if (authError) {
          setError(`Authentication failed: ${authError}`);
          setTimeout(() => router.push('/'), 3000);
          return;
        }
        
        if (code) {
          const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
          const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
          const redirectUri = `${window.location.origin}/auth/callback`;
          
          const tokenResponse = await fetch(`${domain}/oauth2/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              client_id: clientId!,
              code: code as string,
              redirect_uri: redirectUri,
            }),
          });
          
          const tokens = await tokenResponse.json();
          
          if (tokenResponse.ok) {
            localStorage.setItem('auth_tokens', JSON.stringify(tokens));
            router.push('/');
          } else {
            setError('Token exchange failed');
            setTimeout(() => router.push('/'), 3000);
          }
        } else {
          setError('No authorization code received');
          setTimeout(() => router.push('/'), 3000);
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setError('Authentication processing failed');
        setTimeout(() => router.push('/'), 3000);
      }
    };

    if (router.isReady) {
      handleCallback();
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <>
            <div className="text-red-600 mb-4">⚠️</div>
            <p className="text-red-600 mb-2">{error}</p>
            <p className="text-gray-500 text-sm">Redirecting...</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Processing authentication...</p>
          </>
        )}
      </div>
    </div>
  );
}