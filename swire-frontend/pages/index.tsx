import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";

const departmentTiles = [
  { name: "Blades", image: "/swire-re/blade-services.jpg", slug: "blades" },
  { name: "Pre-Assembly & Installation", image: "/swire-re/pre-assembly.jpg", slug: "pre-assembly-installation" },
  { name: "Service & Maintenance", image: "/swire-re/turbine-services.jpg", slug: "service-maintenance" },
  { name: "HR", image: "/swire-re/people-energy.jpg", slug: "hr" },
  { name: "About Swire Renewable", image: "/swire-re/marine-services.jpg", slug: "about-swire-renewable" },
  { name: "General Departments", image: "/swire-re/health-safety.jpg", slug: "general" }
];

export default function Home() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-app-bg text-app-ink">
      <Head>
        <title>Swire Intelligence Assistant</title>
      </Head>

      <header
        className={`fixed top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? "border-b border-app-line bg-white/95 backdrop-blur"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <img src="/swire-sticky-logo.svg" alt="Swire" className="h-8 w-8 rounded-sm bg-white/95 p-1" />
            <div className="leading-tight">
              <p className={`text-sm font-semibold uppercase tracking-wide ${scrolled ? "text-app-ink" : "text-white"}`}>
                Swire Renewable Energy
              </p>
              <p className={`text-xs font-semibold ${scrolled ? "text-app-muted" : "text-white/80"}`}>Intelligence Assistant</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/departments"
              className={`rounded-md px-4 py-2 text-sm font-semibold ${
                scrolled ? "border border-app-line text-app-ink bg-white" : "border border-white/40 text-white bg-black/20"
              }`}
            >
              Departments
            </Link>
            <Link href="/chat" className="rounded-md bg-brand-red px-4 py-2 text-sm font-semibold text-white hover:bg-brand-red-dark">Launch Assistant</Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden pt-0">
        <img src="/swire-re/people-energy.jpg" alt="Swire Renewable" className="h-[520px] w-full object-cover" />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 mx-auto flex max-w-7xl flex-col justify-center px-6 text-white">
          <p className="mb-4 inline-flex w-fit rounded-full bg-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-widest">Operations, HR, and Policy Intelligence</p>
          <h1 className="max-w-4xl text-4xl font-bold leading-tight md:text-6xl">One Swire knowledge layer for all departments.</h1>
          <p className="mt-5 max-w-2xl text-lg text-white/90">
            Unified access to department-specific manuals, procedures, and policy content with editable pages, search, and AI-assisted guidance.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/departments" className="rounded-md bg-brand-red px-6 py-3 font-semibold text-white hover:bg-brand-red-dark">Browse Departments</Link>
            <Link href="/chat" className="rounded-md border border-white/40 bg-white/10 px-6 py-3 font-semibold text-white hover:bg-white/20">Open Chat</Link>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-6 py-14">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold">Department Pages</h2>
            <p className="mt-2 text-app-muted">Each department has a customizable page with editable sections and searchable content.</p>
          </div>
          <Link href="/departments" className="text-sm font-semibold text-brand-red hover:text-brand-red-dark">Manage all</Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {departmentTiles.map((dept) => (
            <Link key={dept.slug} href={`/departments/${dept.slug}`} className="group overflow-hidden rounded-2xl border border-app-line bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <img src={dept.image} alt={dept.name} className="h-48 w-full object-cover transition duration-500 group-hover:scale-105" />
              <div className="p-5">
                <h3 className="text-lg font-semibold">{dept.name}</h3>
                <p className="mt-2 text-sm text-app-muted">Open page</p>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <footer className="border-t border-app-line bg-[#eef2f6]">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 md:grid-cols-4">
          <div>
            <img src="/swire-re/swire-logo.svg" alt="Swire" className="h-8" />
            <p className="mt-3 text-sm text-app-muted">
              Swire Renewable operations knowledge hub for manuals, policies, and department procedures.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-app-ink">Services</h4>
            <ul className="mt-3 space-y-2 text-sm text-app-muted">
              <li>Blade Services</li>
              <li>Pre-Assembly & Installation</li>
              <li>Service & Maintenance</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-app-ink">Navigation</h4>
            <ul className="mt-3 space-y-2 text-sm text-app-muted">
              <li><Link href="/departments">Department Hub</Link></li>
              <li><Link href="/chat">Assistant</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-app-ink">Contact</h4>
            <p className="mt-3 text-sm text-app-muted">commercial@swire-re.com</p>
            <p className="text-sm text-app-muted">+45 3360 1500</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
