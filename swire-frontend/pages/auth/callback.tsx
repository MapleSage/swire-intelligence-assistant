import { useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { useRouter } from "next/router";

export default function AuthCallback() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Check if we have an error in the URL
    if (router.query.error) {
      console.error("Auth error:", router.query.error, router.query.error_description);
      // Redirect back to home page after a delay
      setTimeout(() => {
        router.push("/");
      }, 3000);
      return;
    }

    // If authenticated, redirect to home
    if (auth.isAuthenticated) {
      router.push("/");
    }
  }, [auth.isAuthenticated, router.query]);

  if (router.query.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-500 to-pink-600">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Authentication Error</h2>
          <p className="text-slate-700 mb-2">
            <strong>Error:</strong> {router.query.error}
          </p>
          <p className="text-slate-600 text-sm">
            {router.query.error_description}
          </p>
          <p className="text-slate-500 text-sm mt-4">
            Redirecting to home page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600">
      <div className="text-white text-xl">
        {auth.isLoading ? "Completing sign in..." : "Redirecting..."}
      </div>
    </div>
  );
}