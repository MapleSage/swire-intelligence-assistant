import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const { code, error: authError, error_description } = router.query;

      // Handle error from Cognito
      if (authError) {
        console.error("Auth error:", authError, error_description);
        setError(`${authError}: ${error_description}`);
        setTimeout(() => {
          router.push("/");
        }, 3000);
        return;
      }

      // Handle successful authorization code
      if (code) {
        try {
          // Exchange code for tokens
          const response = await fetch('/api/auth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error("Token exchange failed:", errorData);
            setError(errorData.details?.error_description || "Failed to get tokens");
            setTimeout(() => router.push("/"), 3000);
            return;
          }

          const data = await response.json();

          if (data.access_token && data.id_token) {
            // Store tokens
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('id_token', data.id_token);
            if (data.refresh_token) {
              localStorage.setItem('refresh_token', data.refresh_token);
            }

            console.log("Successfully authenticated, redirecting to home");
            // Redirect to home
            router.push("/");
          } else {
            setError("Invalid token response");
            setTimeout(() => router.push("/"), 3000);
          }
        } catch (err) {
          console.error("Token exchange error:", err);
          setError("Failed to exchange authorization code");
          setTimeout(() => router.push("/"), 3000);
        }
      }
    };

    if (router.isReady) {
      handleCallback();
    }
  }, [router.isReady, router.query]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md border border-gray-200">
          <h2 className="text-xl font-bold text-red-600 mb-4">Authentication Error</h2>
          <p className="text-gray-700 mb-2">{error}</p>
          <p className="text-gray-500 text-sm mt-4">Redirecting to login page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-gray-600 text-xl">Completing sign in...</div>
    </div>
  );
}