import type { NextApiRequest, NextApiResponse } from "next";
import { getDepartments, persistDepartments } from "../../../lib/departments-store";
import { DepartmentRecord } from "../../../lib/department-types";

const slugify = (v: string) =>
  v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const q = String(req.query.q || "").toLowerCase();
    const departments = await getDepartments();
    const filtered = q
      ? departments.filter((d) => {
          const text = `${d.name} ${d.summary} ${d.sections
            .map((s) => `${s.title} ${s.content}`)
            .join(" ")}`.toLowerCase();
          return text.includes(q);
        })
      : departments;
    return res.status(200).json({ departments: filtered });
  }

  if (req.method === "POST") {
    const body = req.body as Partial<DepartmentRecord>;
    if (!body.name || !body.summary) {
      return res.status(400).json({ error: "name and summary are required" });
    }

    const departments = await getDepartments();
    const slug = body.slug ? slugify(body.slug) : slugify(body.name);

    if (departments.some((d) => d.slug === slug)) {
      return res.status(409).json({ error: "department slug already exists" });
    }

    const next: DepartmentRecord = {
      slug,
      name: body.name,
      summary: body.summary,
      heroImage: body.heroImage || "/swire-re/people-energy.jpg",
      accent: body.accent || "#c8102e",
      sections: body.sections || [],
      updatedAt: new Date().toISOString()
    };

    departments.push(next);
    await persistDepartments(departments);
    return res.status(201).json({ department: next });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: "Method not allowed" });
}
