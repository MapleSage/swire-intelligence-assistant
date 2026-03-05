import { BlobServiceClient } from "@azure/storage-blob";
import { promises as fs } from "fs";
import path from "path";
import { DepartmentRecord, DepartmentSection } from "./department-types";

const BLOB_CONTAINER = process.env.AZURE_STORAGE_CONTAINER || "operations-manuals";
const BLOB_PATH = "department-content/departments.json";
const LOCAL_PATH = path.join(process.cwd(), ".data", "departments.json");
const KB_SECTION_PREFIX = "kb-";

const nowIso = () => new Date().toISOString();

const defaultDepartments: DepartmentRecord[] = [
  {
    slug: "blades",
    name: "Blades",
    summary: "Blade inspection, repair, logistics and lifecycle integrity procedures.",
    heroImage: "/swire-re/blade-services.jpg",
    accent: "#c8102e",
    updatedAt: nowIso(),
    sections: [
      {
        id: "blade-safety",
        title: "Safety Baseline",
        content: "Use blade handling SOPs, exclusion zones, and lifting plans before work starts.",
        image: "/swire-re/health-safety.jpg"
      },
      {
        id: "blade-repair",
        title: "Repair Workflow",
        content: "Capture defect, classify severity, assign method statement, execute QA sign-off.",
        image: "/swire-re/blade-services.jpg"
      }
    ]
  },
  {
    slug: "pre-assembly-installation",
    name: "Pre-Assembly & Installation",
    summary: "Lift planning, equipment readiness, and installation execution guidance.",
    heroImage: "/swire-re/pre-assembly.jpg",
    accent: "#9f1d2c",
    updatedAt: nowIso(),
    sections: [
      {
        id: "pre-check",
        title: "Pre-Assembly Checks",
        content: "Validate tooling, certifications, vessel readiness, and weather windows.",
        image: "/swire-re/pre-assembly.jpg"
      }
    ]
  },
  {
    slug: "service-maintenance",
    name: "Service & Maintenance",
    summary: "Planned and corrective maintenance standards across assets.",
    heroImage: "/swire-re/turbine-services.jpg",
    accent: "#821726",
    updatedAt: nowIso(),
    sections: [
      {
        id: "maintenance-window",
        title: "Maintenance Window Planning",
        content: "Prioritize turbine criticality, technician availability, and weather-safe execution.",
        image: "/swire-re/turbine-services.jpg"
      }
    ]
  },
  {
    slug: "hr",
    name: "HR",
    summary: "People policy, rostering, training compliance and onboarding.",
    heroImage: "/swire-re/people-energy.jpg",
    accent: "#6b1220",
    updatedAt: nowIso(),
    sections: [
      {
        id: "policy-index",
        title: "Policy Library",
        content: "Maintain latest HR policy versions and training matrix by role and site.",
        image: "/swire-re/people-energy.jpg"
      }
    ]
  },
  {
    slug: "about-swire-renewable",
    name: "About Swire Renewable",
    summary: "Corporate profile, values, capabilities and operating footprint.",
    heroImage: "/swire-re/marine-services.jpg",
    accent: "#4f0e18",
    updatedAt: nowIso(),
    sections: [
      {
        id: "company-overview",
        title: "Company Overview",
        content: "Swire Renewable provides end-to-end offshore and onshore renewable services.",
        image: "/swire-re/marine-services.jpg"
      }
    ]
  },
  {
    slug: "general",
    name: "General Departments",
    summary: "Cross-functional procedures shared by operations, finance and governance teams.",
    heroImage: "/swire-re/health-safety.jpg",
    accent: "#2f0a10",
    updatedAt: nowIso(),
    sections: [
      {
        id: "cross-functional",
        title: "Cross-Functional SOPs",
        content: "Store shared SOPs for permit-to-work, reporting and escalation channels.",
        image: "/swire-re/health-safety.jpg"
      }
    ]
  }
];

async function readFromBlob(): Promise<DepartmentRecord[] | null> {
  const conn = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!conn) return null;

  try {
    const svc = BlobServiceClient.fromConnectionString(conn);
    const container = svc.getContainerClient(BLOB_CONTAINER);
    const blob = container.getBlobClient(BLOB_PATH);
    if (!(await blob.exists())) return null;

    const dl = await blob.download();
    const body = await streamToString(dl.readableStreamBody);
    return JSON.parse(body) as DepartmentRecord[];
  } catch {
    return null;
  }
}

async function writeToBlob(data: DepartmentRecord[]): Promise<void> {
  const conn = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!conn) return;

  const svc = BlobServiceClient.fromConnectionString(conn);
  const container = svc.getContainerClient(BLOB_CONTAINER);
  await container.createIfNotExists();
  const blob = container.getBlockBlobClient(BLOB_PATH);
  const payload = JSON.stringify(data, null, 2);
  await blob.upload(payload, Buffer.byteLength(payload), {
    blobHTTPHeaders: { blobContentType: "application/json" }
  });
}

async function readLocal(): Promise<DepartmentRecord[] | null> {
  try {
    const raw = await fs.readFile(LOCAL_PATH, "utf-8");
    return JSON.parse(raw) as DepartmentRecord[];
  } catch {
    return null;
  }
}

async function writeLocal(data: DepartmentRecord[]): Promise<void> {
  await fs.mkdir(path.dirname(LOCAL_PATH), { recursive: true });
  await fs.writeFile(LOCAL_PATH, JSON.stringify(data, null, 2), "utf-8");
}

async function streamToString(stream: NodeJS.ReadableStream | null | undefined): Promise<string> {
  if (!stream) return "";
  return await new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (d) => chunks.push(Buffer.isBuffer(d) ? d : Buffer.from(d)));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    stream.on("error", reject);
  });
}

function kbDirForSlug(slug: string): string {
  const map: Record<string, string> = {
    "blades": "blades",
    "pre-assembly-installation": "pre_assembly_installation",
    "service-maintenance": "service_maintenance",
    "hr": "hr",
    "about-swire-renewable": "about_swire_renewable",
    "general": "general"
  };
  return map[slug] || slug.replace(/-/g, "_");
}

async function resolveEnterpriseDataRoot(): Promise<string | null> {
  const candidates = [
    process.env.DATA_PATH,
    path.resolve(process.cwd(), "..", "enterprise-data"),
    path.resolve(process.cwd(), "enterprise-data")
  ].filter(Boolean) as string[];

  for (const c of candidates) {
    try {
      const stat = await fs.stat(c);
      if (stat.isDirectory()) return c;
    } catch {
      // ignore
    }
  }
  return null;
}

async function loadKbSectionForDepartment(record: DepartmentRecord): Promise<DepartmentSection | null> {
  const root = await resolveEnterpriseDataRoot();
  if (!root) return null;

  const kbPath = path.join(root, kbDirForSlug(record.slug), "policy_kb_seed.md");

  try {
    const markdown = await fs.readFile(kbPath, "utf-8");
    if (!markdown.trim()) return null;
    return {
      id: `${KB_SECTION_PREFIX}${record.slug}-manual`,
      title: "Operations Manual & Policy Knowledge Pack",
      content: markdown,
      image: record.heroImage
    };
  } catch {
    return null;
  }
}

function slugify(v: string): string {
  return v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function normalizeMarkdown(markdown: string): string {
  const pre = markdown
    .replace(/\r\n/g, "\n")
    // Remove injected script fragments from scraped pages.
    .replace(/function\(w,d,s,l,i\)\{[^]*?\}\)\(window,document,'script','dataLayer','GTM-[^']+'\);?/gi, "")
    .replace(/googletagmanager\.com\/gtm\.js[^ \n]*/gi, "")
    .replace(/dataLayer[^ \n]*/gi, "")
    // Repair malformed one-line markdown where headings got flattened.
    .replace(/\s+##\s+/g, "\n\n## ")
    .replace(/\s+###\s+/g, "\n\n### ")
    // Repair collapsed checklist sections.
    .replace(/##\s+Internal Review Checklist\s*-\s*/gi, "## Internal Review Checklist\n- ")
    // Repair flattened bullet lists.
    .replace(/\s+-\s+(?=[A-Za-z(])/g, "\n- ")
    .replace(/\s+\*\s+(?=[A-Za-z(])/g, "\n* ");

  const lines = pre.split("\n");
  const cleaned = lines.map((line) =>
    line
      .replace(/\t/g, "  ")
      .replace(/^ {8}/, "")
      .replace(/^ {4}/, "")
  );
  return cleaned.join("\n").trim();
}

function linkifyPlainUrls(text: string): string {
  return text.replace(
    /(^|\s)(https?:\/\/[^\s)]+)(?=\s|$)/g,
    (_m, prefix, url) => {
      const clean = String(url).replace(/[.,;:!?]+$/, "");
      const tail = clean.split("/").filter(Boolean).pop() || clean;
      const label = tail
        .replace(/[-_]/g, " ")
        .slice(0, 72)
        .replace(/\s+/g, " ")
        .trim();
      return `${prefix}[${label || "source link"}](${clean})`;
    }
  );
}

function parseKbMarkdownToSections(record: DepartmentRecord, markdown: string): DepartmentSection[] {
  const normalized = normalizeMarkdown(markdown);
  const chunks = normalized
    .split(/\n(?=##\s+)/g)
    .map((c) => c.trim())
    .filter(Boolean);

  if (!chunks.length) {
    return [
      {
        id: `${KB_SECTION_PREFIX}${record.slug}-manual`,
        title: "Operations Manual",
        content: normalized,
        image: record.heroImage
      }
    ];
  }

  const sections: DepartmentSection[] = [];
  for (const chunk of chunks) {
    const chunkLines = chunk.split("\n");
    const firstLine = chunkLines[0].trim();
    const title = firstLine.replace(/^#{1,3}\s+/, "").trim() || "Operations Manual";
    const bodyRaw =
      firstLine.startsWith("#")
        ? chunkLines.slice(1).join("\n").trim()
        : chunk;
    const body = linkifyPlainUrls(bodyRaw)
      // Remove duplicate top heading if present in the first parsed section.
      .replace(/^#\s+.+\n+/m, "")
      .trim();
    sections.push({
      id: `${KB_SECTION_PREFIX}${record.slug}-${slugify(title)}`,
      title,
      content: body || chunk,
      image: record.heroImage
    });
  }

  return sections;
}

export async function syncDepartmentsWithKb(records: DepartmentRecord[]): Promise<DepartmentRecord[]> {
  let changed = false;
  const updated = [...records];

  for (let i = 0; i < updated.length; i += 1) {
    const record = updated[i];
    const kbSection = await loadKbSectionForDepartment(record);
    if (!kbSection) continue;

    const kbSections = parseKbMarkdownToSections(record, kbSection.content);
    const nonKbSections = record.sections.filter((s) => !s.id.startsWith(KB_SECTION_PREFIX));
    const nextSections = [...kbSections, ...nonKbSections];
    const sectionChanged = JSON.stringify(nextSections) !== JSON.stringify(record.sections);

    if (sectionChanged) {
      changed = true;
      updated[i] = {
        ...record,
        sections: nextSections,
        updatedAt: nowIso()
      };
    }
  }

  if (changed) {
    await persistDepartments(updated);
  }

  return updated;
}

export async function getDepartments(): Promise<DepartmentRecord[]> {
  const blob = await readFromBlob();
  if (blob && blob.length) return syncDepartmentsWithKb(blob);

  const local = await readLocal();
  if (local && local.length) return syncDepartmentsWithKb(local);

  await persistDepartments(defaultDepartments);
  return syncDepartmentsWithKb(defaultDepartments);
}

export async function persistDepartments(records: DepartmentRecord[]): Promise<void> {
  await writeLocal(records);
  await writeToBlob(records);
}
