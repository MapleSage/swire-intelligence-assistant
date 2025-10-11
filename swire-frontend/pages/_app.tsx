import type { AppProps } from "next/app";
import Head from "next/head";
import { OIDCAuthProvider } from "../lib/oidc-auth";
import "../styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>SageGreen Intelligence - AI Assistant</title>
        <link rel="icon" href="/Sage_Favicon.png" />
        <link rel="apple-touch-icon" href="/SageGreen-1.png" />
      </Head>
      <OIDCAuthProvider>
        <Component {...pageProps} />
      </OIDCAuthProvider>
    </>
  );
}