import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useOIDCAuth } from '../../lib/oidc-auth';

export default function AuthCallback() {
  const router = useRouter();
  const auth = useOIDCAuth();

  useEffect(() => {
    if (auth.isAuthenticated) {
      router.push('/');
    }
  }, [auth.isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}