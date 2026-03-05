import type { NextApiRequest, NextApiResponse } from "next";
import { getDepartments, syncDepartmentsWithKb } from "../../../lib/departments-store";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const departments = await getDepartments();
  const synced = await syncDepartmentsWithKb(departments);
  return res.status(200).json({ ok: true, departments: synced, count: synced.length });
}
