import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DepartmentRecord } from "../../lib/department-types";

type DepartmentsResponse = { departments: DepartmentRecord[] };

export default function DepartmentsPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [newName, setNewName] = useState("");
  const [newSummary, setNewSummary] = useState("");

  const load = async (search = "") => {
    setLoading(true);
    const res = await fetch(`/api/departments${search ? `?q=${encodeURIComponent(search)}` : ""}`);
    const data = (await res.json()) as DepartmentsResponse;
    setDepartments(data.departments || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const onSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await load(q);
  };

  const createDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newSummary.trim()) return;

    await fetch("/api/departments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, summary: newSummary })
    });

    setNewName("");
    setNewSummary("");
    await load(q);
  };

  const removeDepartment = async (slug: string) => {
    if (!confirm(`Delete department '${slug}'?`)) return;
    await fetch(`/api/departments/${slug}`, { method: "DELETE" });
    await load(q);
  };

  const syncManuals = async () => {
    setSyncing(true);
    await fetch("/api/departments/sync", { method: "POST" });
    await load(q);
    setSyncing(false);
  };

  return (
    <div className="min-h-screen bg-app-bg text-app-ink">
      <Head>
        <title>Departments | Swire Intelligence Assistant</title>
      </Head>

      <header className="border-b border-app-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <img src="/swire-re/swire-logo.svg" alt="Swire" className="h-8" />
            <span className="text-sm font-semibold tracking-wide text-app-muted">Department Hub</span>
          </Link>
          <Link href="/chat" className="rounded-md bg-brand-red px-4 py-2 text-sm font-semibold text-white hover:bg-brand-red-dark">
            Open Assistant
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 grid gap-6 lg:grid-cols-3">
          <form onSubmit={onSearch} className="rounded-xl border border-app-line bg-white p-5 lg:col-span-2">
            <h2 className="mb-3 text-lg font-semibold">Search Department Content</h2>
            <div className="flex gap-3">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search procedures, policies, or department names"
                className="w-full rounded-md border border-app-line px-3 py-2"
              />
              <button className="rounded-md bg-brand-red px-4 py-2 font-semibold text-white">Search</button>
            </div>
          </form>

          <form onSubmit={createDepartment} className="rounded-xl border border-app-line bg-white p-5">
            <h2 className="mb-3 text-lg font-semibold">Add Department</h2>
            <div className="space-y-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Department name"
                className="w-full rounded-md border border-app-line px-3 py-2"
              />
              <textarea
                value={newSummary}
                onChange={(e) => setNewSummary(e.target.value)}
                placeholder="Department summary"
                className="h-24 w-full rounded-md border border-app-line px-3 py-2"
              />
            </div>
            <button className="mt-3 w-full rounded-md bg-app-ink px-4 py-2 font-semibold text-white">Create</button>
          </form>
        </div>

        <div className="mb-6 flex items-center justify-between rounded-xl border border-app-line bg-white p-4">
          <p className="text-sm text-app-muted">
            Add a new page with <strong>Add Department</strong>. Upload manuals inside each department page using <strong>Upload Manual</strong>.
          </p>
          <button
            onClick={syncManuals}
            disabled={syncing}
            className="rounded-md bg-brand-red px-4 py-2 text-sm font-semibold text-white hover:bg-brand-red-dark disabled:opacity-60"
          >
            {syncing ? "Syncing..." : "Sync Manuals from KB"}
          </button>
        </div>

        {loading ? (
          <p className="text-app-muted">Loading departments...</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {departments.map((dept) => (
              <article key={dept.slug} className="overflow-hidden rounded-2xl border border-app-line bg-white shadow-sm">
                <img src={dept.heroImage} alt={dept.name} className="h-44 w-full object-cover" />
                <div className="p-5">
                  <h3 className="text-xl font-semibold">{dept.name}</h3>
                  <p className="mt-2 text-sm text-app-muted">{dept.summary}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-app-muted">
                    {dept.sections.length} sections available
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <Link href={`/departments/${dept.slug}`} className="text-sm font-semibold text-brand-red hover:text-brand-red-dark">
                      Open page
                    </Link>
                    <button onClick={() => removeDepartment(dept.slug)} className="text-xs font-semibold text-app-muted hover:text-brand-red">
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
