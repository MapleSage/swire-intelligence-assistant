import type { NextApiRequest, NextApiResponse } from "next";
import { getDepartments, persistDepartments } from "../../../../lib/departments-store";
import { DepartmentRecord } from "../../../../lib/department-types";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const slug = String(req.query.slug || "");
  const departments = await getDepartments();
  const index = departments.findIndex((d) => d.slug === slug);

  if (index < 0) {
    return res.status(404).json({ error: "department not found" });
  }

  if (req.method === "GET") {
    return res.status(200).json({ department: departments[index] });
  }

  if (req.method === "PUT") {
    const patch = req.body as Partial<DepartmentRecord>;
    const current = departments[index];

    const updated: DepartmentRecord = {
      ...current,
      ...patch,
      slug: current.slug,
      sections: patch.sections || current.sections,
      updatedAt: new Date().toISOString()
    };

    departments[index] = updated;
    await persistDepartments(departments);
    return res.status(200).json({ department: updated });
  }

  if (req.method === "DELETE") {
    departments.splice(index, 1);
    await persistDepartments(departments);
    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
  return res.status(405).json({ error: "Method not allowed" });
}
