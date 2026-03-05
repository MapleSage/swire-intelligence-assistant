import type { AppProps } from "next/app";
import FloatingChatBlob from "../components/FloatingChatBlob";
import "../styles/globals.css";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <FloatingChatBlob />
    </>
  );
}

export default MyApp;
