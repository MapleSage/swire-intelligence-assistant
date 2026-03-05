export interface DepartmentSection {
  id: string;
  title: string;
  content: string;
  image?: string;
}

export interface DepartmentRecord {
  slug: string;
  name: string;
  summary: string;
  heroImage: string;
  accent: string;
  sections: DepartmentSection[];
  updatedAt: string;
}
