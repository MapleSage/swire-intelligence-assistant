import type { NextApiRequest, NextApiResponse } from "next";

interface BackendChatResponse {
  response: string;
  tools_used?: string[];
  intent?: string;
  confidence?: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { query } = req.body ?? {};
  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "query is required" });
  }

  const backendUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
  const host = req.headers.host;
  const proto = (req.headers["x-forwarded-proto"] as string) || "https";
  const selfBase = host ? `${proto}://${host}` : "";
  const localBase = `http://127.0.0.1:${process.env.WEBSITES_PORT || process.env.PORT || "3000"}`;

  const callLocalAzureKb = async () => {
    const candidates = [localBase, selfBase].filter(Boolean);
    let lastError = "No local API base URL available";

    for (const base of candidates) {
      try {
        const fallback = await fetch(`${base}/api/azure-kb-chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        const payload = await fallback.json();
        if (fallback.ok) {
          return payload;
        }
        lastError = payload?.message || payload?.error || `Fallback returned ${fallback.status}`;
      } catch (error) {
        lastError = error instanceof Error ? error.message : "Unknown fallback error";
      }
    }

    throw new Error(lastError);
  };

  try {
    if (!backendUrl) {
      const payload = await callLocalAzureKb();
      return res.status(200).json(payload);
    }

    const upstream = await fetch(`${backendUrl}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    const payload = (await upstream.json()) as BackendChatResponse | { detail?: string };

    if (!upstream.ok) {
      const detail = (payload as { detail?: string })?.detail || `Backend returned ${upstream.status}`;
      return res.status(upstream.status).json({ error: detail });
    }

    return res.status(200).json(payload);
  } catch (error) {
    // Fallback path: use local Azure KB API route directly when backend container is unavailable.
    try {
      const payload = await callLocalAzureKb();
      return res.status(200).json(payload);
    } catch {
      // Continue to final error below.
    }

    return res.status(502).json({
      error: "Backend unreachable",
      detail: error instanceof Error ? error.message : "Unknown proxy error",
    });
  }
}
