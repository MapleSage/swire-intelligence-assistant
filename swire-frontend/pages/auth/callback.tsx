import { useEffect } from "react";
import { useRouter } from "next/router";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Amplify handles the callback automatically
    // Just redirect to home after a short delay
    const timer = setTimeout(() => {
      router.push("/");
    }, 1000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-gray-600 text-xl">Completing sign in...</div>
    </div>
  );
}