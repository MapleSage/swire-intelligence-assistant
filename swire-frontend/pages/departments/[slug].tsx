import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { DepartmentRecord, DepartmentSection } from "../../lib/department-types";

type DepartmentResponse = { department: DepartmentRecord };

const mkId = () => Math.random().toString(36).slice(2, 10);

type InsightCard = {
  title: string;
  url?: string;
  bullets: string[];
};

function truncateText(v: string, max = 220): string {
  if (v.length <= max) return v;
  return `${v.slice(0, max).trim()}...`;
}

function markdownPreview(markdown: string, max = 220): string {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/^#+\s+/gm, "")
    .replace(/[*_>-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return truncateText(plain, max);
}

function isTailSection(section: DepartmentSection): boolean {
  return /Extracted Department Insights|Operations Manual/i.test(section.title);
}

function parseInsights(content: string): InsightCard[] {
  const blocks = content
    .split(/\n(?=###\s+Source:)/g)
    .map((b) => b.trim())
    .filter((b) => b.startsWith("### Source:"));

  const cards: InsightCard[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    const head = lines[0] || "";
    const m = head.match(/^###\s+Source:\s+\[(.+?)\]\((https?:\/\/[^\s)]+)\)/i);
    const title = m?.[1] || head.replace(/^###\s+Source:\s*/i, "").trim();
    const url = m?.[2];
    const bullets = lines
      .filter((l) => l.startsWith("- "))
      .map((l) => l.replace(/^-+\s*/, "").trim())
      .map((l) => truncateText(l))
      .slice(0, 8);

    if (title && bullets.length) {
      cards.push({ title, url, bullets });
    }
  }

  return cards;
}

export default function DepartmentPage() {
  const router = useRouter();
  const slug = String(router.query.slug || "");

  const [department, setDepartment] = useState<DepartmentRecord | null>(null);
  const [allDepartments, setAllDepartments] = useState<DepartmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const load = async () => {
    if (!slug) return;
    setLoading(true);
    const [res, listRes] = await Promise.all([
      fetch(`/api/departments/${slug}`),
      fetch("/api/departments"),
    ]);
    if (res.ok) {
      const data = (await res.json()) as DepartmentResponse;
      setDepartment(data.department);
      setExpandedSections((prev) => {
        if (Object.keys(prev).length > 0) return prev;
        const initial: Record<string, boolean> = {};
        for (const s of data.department.sections) initial[s.id] = true;
        return initial;
      });
    }
    if (listRes.ok) {
      const list = await listRes.json();
      setAllDepartments(list.departments || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [slug]);

  const save = async () => {
    if (!department) return;
    await fetch(`/api/departments/${slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(department)
    });
    await load();
    setEditMode(false);
  };

  const updateSection = (sectionId: string, patch: Partial<DepartmentSection>) => {
    if (!department) return;
    setDepartment({
      ...department,
      sections: department.sections.map((s) => (s.id === sectionId ? { ...s, ...patch } : s))
    });
  };

  const addSection = () => {
    if (!department) return;
    setDepartment({
      ...department,
      sections: [
        ...department.sections,
        { id: mkId(), title: "New Section", content: "Add content here", image: department.heroImage }
      ]
    });
  };

  const removeSection = (id: string) => {
    if (!department) return;
    setDepartment({
      ...department,
      sections: department.sections.filter((s) => s.id !== id)
    });
  };

  const uploadManual = async (file: File) => {
    if (!slug) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("department", slug);
      form.append("file", file);
      const res = await fetch("/api/departments/upload", {
        method: "POST",
        body: form
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Upload failed");
      }
      await load();
    } catch (e: any) {
      alert(e?.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    if (!department) return;
    const next: Record<string, boolean> = {};
    for (const s of department.sections) next[s.id] = true;
    setExpandedSections(next);
  };

  const collapseAll = () => {
    setExpandedSections({});
  };

  if (loading) return <div className="p-8 text-app-muted">Loading department...</div>;
  if (!department) return <div className="p-8 text-app-muted">Department not found.</div>;

  const orderedSections = [
    ...department.sections.filter((s) => !isTailSection(s)),
    ...department.sections.filter((s) => isTailSection(s)),
  ];
  const twoColumnSections = orderedSections.slice(0, 5);
  const singleRowSections = orderedSections.slice(5);

  const renderSectionCard = (section: DepartmentSection) => (
    <article key={section.id} className="overflow-hidden rounded-xl border border-app-line bg-white">
      <div className={section.id.startsWith("kb-") ? "block" : "grid md:grid-cols-[280px_1fr]"}>
        {!section.id.startsWith("kb-") && (
          <img src={section.image || department.heroImage} alt={section.title} className="h-56 w-full object-cover" />
        )}
        <div className="p-5">
          {editMode ? (
            <>
              <input
                value={section.title}
                onChange={(e) => updateSection(section.id, { title: e.target.value })}
                className="mb-2 w-full rounded-md border border-app-line px-3 py-2 text-lg font-semibold"
              />
              <textarea
                value={section.content}
                onChange={(e) => updateSection(section.id, { content: e.target.value })}
                className="h-36 w-full rounded-md border border-app-line px-3 py-2"
              />
              <input
                value={section.image || ""}
                onChange={(e) => updateSection(section.id, { image: e.target.value })}
                className="mt-2 w-full rounded-md border border-app-line px-3 py-2 text-sm"
                placeholder="Image URL"
              />
              <button
                onClick={() => removeSection(section.id)}
                className="mt-2 text-xs font-semibold text-brand-red"
              >
                Remove section
              </button>
            </>
          ) : (
            <>
              <button
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-app-line bg-slate-50 px-3 py-2 text-left hover:bg-slate-100"
                onClick={() => toggleSection(section.id)}
              >
                <h4 className="text-xl font-semibold">{section.title}</h4>
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-app-line bg-white text-lg font-bold leading-none text-brand-red">
                  {expandedSections[section.id] ? "−" : "+"}
                </span>
              </button>
              {!expandedSections[section.id] && (
                <p className="mt-3 text-sm text-app-muted">
                  {markdownPreview(section.content)}
                </p>
              )}
              {expandedSections[section.id] && (
                /Extracted Department Insights/i.test(section.title) ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {parseInsights(section.content).map((card, i) => (
                      <article key={`${card.title}-${i}`} className="rounded-lg border border-app-line bg-slate-50 p-4">
                        <h5 className="text-base font-semibold text-app-ink">{card.title}</h5>
                        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-app-muted">
                          {card.bullets.map((b, bi) => (
                            <li key={bi}>{b}</li>
                          ))}
                        </ul>
                        {card.url && (
                          <a
                            href={card.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-block text-sm font-semibold text-brand-red hover:text-brand-red-dark"
                          >
                            Read source
                          </a>
                        )}
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="prose mt-2 max-w-none text-app-muted">
                    <ReactMarkdown
                      components={{
                        a: ({ ...props }) => <a {...props} target="_blank" rel="noreferrer" />,
                        pre: ({ children }) => <div className="rounded-lg border border-app-line bg-slate-50 p-3">{children}</div>,
                      }}
                    >
                      {section.content}
                    </ReactMarkdown>
                  </div>
                )
              )}
            </>
          )}
        </div>
      </div>
    </article>
  );

  return (
    <div className="min-h-screen bg-app-bg text-app-ink">
      <Head>
        <title>{department.name} | Swire Intelligence Assistant</title>
      </Head>

      <header className="sticky top-0 z-40 border-b border-app-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src="/swire-re/swire-sticky-logo.svg" alt="Swire" className="h-8" />
            <div>
              <p className="text-xs uppercase tracking-wider text-app-muted">Department Page</p>
              <h1 className="text-lg font-semibold">{department.name}</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <select
              className="rounded-md border border-app-line bg-white px-3 py-2 text-sm"
              value={slug}
              onChange={(e) => router.push(`/departments/${e.target.value}`)}
            >
              {allDepartments.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.name}
                </option>
              ))}
            </select>
            <Link href="/departments" className="rounded-md border border-app-line px-3 py-2 text-sm">All departments</Link>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="rounded-md border border-app-line px-3 py-2 text-sm font-semibold"
            >
              {uploading ? "Uploading..." : "Upload Manual"}
            </button>
            <button onClick={() => setEditMode((v) => !v)} className="rounded-md bg-app-ink px-3 py-2 text-sm font-semibold text-white">
              {editMode ? "Cancel" : "Edit"}
            </button>
            {editMode && (
              <button onClick={save} className="rounded-md bg-brand-red px-3 py-2 text-sm font-semibold text-white">Save</button>
            )}
          </div>
        </div>
      </header>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.md,.json,.csv,.jpg,.jpeg,.png"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) uploadManual(f);
        }}
      />

      <section className="relative h-[320px] overflow-hidden">
        <img src={department.heroImage} alt={department.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-6 pb-8 text-white">
          {editMode ? (
            <>
              <input
                value={department.name}
                onChange={(e) => setDepartment({ ...department, name: e.target.value })}
                className="mb-2 w-full max-w-xl rounded-md border border-white/30 bg-black/30 px-3 py-2 text-2xl font-bold"
              />
              <textarea
                value={department.summary}
                onChange={(e) => setDepartment({ ...department, summary: e.target.value })}
                className="h-20 w-full max-w-2xl rounded-md border border-white/30 bg-black/30 px-3 py-2"
              />
            </>
          ) : (
            <>
              <h2 className="text-4xl font-bold">{department.name}</h2>
              <p className="mt-2 max-w-2xl text-white/90">{department.summary}</p>
            </>
          )}
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-2xl font-semibold">Content Sections</h3>
          <div className="flex items-center gap-2">
            <button onClick={expandAll} className="rounded-md border border-app-line px-3 py-2 text-sm font-semibold">
              Expand all
            </button>
            <button onClick={collapseAll} className="rounded-md border border-app-line px-3 py-2 text-sm font-semibold">
              Collapse all
            </button>
            {editMode && (
              <button onClick={addSection} className="rounded-md bg-brand-red px-3 py-2 text-sm font-semibold text-white">
                Add section
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {twoColumnSections.map((section) => renderSectionCard(section))}
        </div>
        {singleRowSections.length > 0 && (
          <div className="mt-6 space-y-6">
            {singleRowSections.map((section) => renderSectionCard(section))}
          </div>
        )}
      </main>
    </div>
  );
}
