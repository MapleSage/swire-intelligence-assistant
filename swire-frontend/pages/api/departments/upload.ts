import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import { promises as fs } from "fs";
import path from "path";
import { getDepartments, persistDepartments } from "../../../lib/departments-store";
import type { DepartmentRecord } from "../../../lib/department-types";

export const config = {
  api: {
    bodyParser: false,
  },
};

function sanitizeFileName(v: string): string {
  return v.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function slugify(v: string): string {
  return v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function resolveEnterpriseDataRoot(): Promise<string> {
  const candidates = [
    process.env.DATA_PATH,
    path.resolve(process.cwd(), "..", "enterprise-data"),
    path.resolve(process.cwd(), "enterprise-data"),
  ].filter(Boolean) as string[];

  for (const c of candidates) {
    try {
      const stat = await fs.stat(c);
      if (stat.isDirectory()) return c;
    } catch {
      // continue
    }
  }

  const fallback = path.resolve(process.cwd(), "..", "enterprise-data");
  await fs.mkdir(fallback, { recursive: true });
  return fallback;
}

async function extractWithDocIntel(buffer: Buffer, fileType: string): Promise<string | null> {
  const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT || process.env.AZURE_COGNITIVE_ENDPOINT;
  const key = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY || process.env.AZURE_COGNITIVE_KEY;
  if (!endpoint || !key) return null;

  const analyzeUrl = `${endpoint.replace(/\/$/, "")}/documentintelligence/documentModels/prebuilt-layout:analyze?api-version=2024-11-30`;
  const post = await fetch(analyzeUrl, {
    method: "POST",
    headers: {
      "Content-Type": fileType || "application/octet-stream",
      "Ocp-Apim-Subscription-Key": key,
    },
    body: new Uint8Array(buffer),
  });

  if (!post.ok) return null;
  const operationLocation = post.headers.get("operation-location");
  if (!operationLocation) return null;

  for (let i = 0; i < 20; i += 1) {
    await new Promise((r) => setTimeout(r, 1200));
    const poll = await fetch(operationLocation, {
      headers: { "Ocp-Apim-Subscription-Key": key },
    });
    if (!poll.ok) break;
    const json = await poll.json();

    if (json.status === "succeeded") {
      const content = json.analyzeResult?.content;
      if (typeof content === "string" && content.trim()) return content.trim();
      return null;
    }

    if (json.status === "failed") return null;
  }

  return null;
}

function extractPlainText(buffer: Buffer, mimetype?: string): string {
  if (mimetype?.includes("json")) {
    try {
      return JSON.stringify(JSON.parse(buffer.toString("utf-8")), null, 2);
    } catch {
      return buffer.toString("utf-8");
    }
  }
  return buffer.toString("utf-8");
}

function deptDirFromSlug(slug: string): string {
  const map: Record<string, string> = {
    blades: "blades",
    "pre-assembly-installation": "pre_assembly_installation",
    "service-maintenance": "service_maintenance",
    hr: "hr",
    "about-swire-renewable": "about_swire_renewable",
    general: "general",
  };
  return map[slug] || slug.replace(/-/g, "_");
}

async function indexToSearch(documentId: string, title: string, content: string, department: string) {
  const endpoint = process.env.AZURE_SEARCH_ENDPOINT;
  const indexName = process.env.AZURE_SEARCH_INDEX;
  const key = process.env.AZURE_SEARCH_KEY;
  if (!endpoint || !indexName || !key) return;

  await fetch(`${endpoint.replace(/\/$/, "")}/indexes/${indexName}/docs/index?api-version=2023-11-01`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": key,
    },
    body: JSON.stringify({
      value: [
        {
          "@search.action": "mergeOrUpload",
          id: documentId,
          title,
          content,
          department,
          category: department,
          source: `department-upload:${department}`,
          chunk: 0,
          last_modified: new Date().toISOString(),
        },
      ],
    }),
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = formidable({
    uploadDir: "/tmp",
    keepExtensions: true,
    maxFileSize: 50 * 1024 * 1024,
  });

  try {
    const [fields, files] = await form.parse(req);
    const departmentSlug = String(Array.isArray(fields.department) ? fields.department[0] : fields.department || "");
    if (!departmentSlug) {
      return res.status(400).json({ error: "department is required" });
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file) {
      return res.status(400).json({ error: "file is required" });
    }

    const departments = await getDepartments();
    const idx = departments.findIndex((d) => d.slug === departmentSlug);
    if (idx < 0) return res.status(404).json({ error: "department not found" });

    const fileBuffer = await fs.readFile(file.filepath);
    const mimetype = file.mimetype || "application/octet-stream";

    const extractedViaAi = await extractWithDocIntel(fileBuffer, mimetype);
    const extracted = (extractedViaAi || extractPlainText(fileBuffer, mimetype)).trim();

    await fs.unlink(file.filepath).catch(() => undefined);

    if (!extracted) {
      return res.status(422).json({ error: "No extractable text found in document" });
    }

    const originalName = file.originalFilename || "uploaded-document";
    const safeName = sanitizeFileName(originalName);
    const sectionId = `upload-${Date.now()}`;
    const sectionTitle = `Uploaded Manual: ${originalName}`;

    const markdown = `## ${sectionTitle}\n\n**Source file:** ${originalName}\n\n${extracted}`;

    const root = await resolveEnterpriseDataRoot();
    const deptDir = path.join(root, deptDirFromSlug(departmentSlug), "uploads");
    await fs.mkdir(deptDir, { recursive: true });
    const savePath = path.join(deptDir, `${Date.now()}-${safeName}.md`);
    await fs.writeFile(savePath, markdown, "utf-8");

    const current = departments[idx] as DepartmentRecord;
    departments[idx] = {
      ...current,
      sections: [
        {
          id: sectionId,
          title: sectionTitle,
          content: markdown,
          image: current.heroImage,
        },
        ...current.sections,
      ],
      updatedAt: new Date().toISOString(),
    };

    await persistDepartments(departments);

    const searchDocId = `upload-${departmentSlug}-${Date.now()}-${slugify(originalName)}`;
    await indexToSearch(searchDocId, sectionTitle, extracted.slice(0, 30000), departmentSlug);

    return res.status(200).json({
      ok: true,
      message: "Document extracted and added to department + KB",
      sectionId,
      savedPath: savePath,
      indexedDocumentId: searchDocId,
      extractedChars: extracted.length,
    });
  } catch (error: any) {
    console.error("department upload error", error);
    return res.status(500).json({ error: "Upload/extraction failed", detail: error?.message || "unknown" });
  }
}
