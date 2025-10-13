import { AuthProvider } from "../lib/auth-context";
import type { AppProps } from "next/app";
import "../styles/globals.css";
import "../lib/amplify-config"; // Import to configure Amplify

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;