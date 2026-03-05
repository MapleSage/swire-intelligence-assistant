import { useRouter } from "next/router";
import { MessageCircle, X } from "lucide-react";
import { useState } from "react";

export default function FloatingChatBlob() {
  const router = useRouter();
  const isChatPage = router.pathname === "/chat";
  const [open, setOpen] = useState(false);

  if (isChatPage) return null;

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[75] bg-black/25" onClick={() => setOpen(false)}>
          <aside
            className="absolute right-3 top-3 h-[calc(100vh-24px)] w-[min(460px,96vw)] overflow-hidden rounded-2xl border border-app-line bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-app-line px-4 py-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-[#0b4f9c]" />
                <p className="text-sm font-semibold text-app-ink">AI Assistant</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-app-muted hover:bg-slate-100 hover:text-app-ink"
                aria-label="Close assistant"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <iframe
              src="/chat"
              title="Swire AI Assistant"
              className="h-[calc(100%-53px)] w-full border-0"
            />
          </aside>
        </div>
      )}
      <button
        aria-label="Open Swire Assistant"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 left-5 z-[70] flex h-14 w-14 items-center justify-center rounded-full border border-white/50 bg-[#0b4f9c] text-white shadow-[0_8px_20px_rgba(16,24,32,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0a4384]"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    </>
  );
}
