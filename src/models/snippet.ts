export interface Metadata {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  tags: string[];
  javaVersion: number;
  imports?: string[];
  related?: string[];
  dependency?: string;
}
export interface Snippet extends Metadata {
  code: string;
  blocks: string[];
  notes: string;
  raw: string;
  path: string;
}
export interface LibraryFile {
  path: string;
  content: string;
}
export interface LibraryResult {
  files: LibraryFile[];
  errors: string[];
  folder: string;
}
export interface Preferences {
  favorites: string[];
  recent: string[];
  theme: "dark" | "light" | "system";
  category: string;
  fontSize: number;
  navWidth: number;
  listWidth: number;
  collapsed: boolean;
}
export const defaultPreferences: Preferences = {
  favorites: [],
  recent: [],
  theme: "dark",
  category: "all",
  fontSize: 13,
  navWidth: 232,
  listWidth: 370,
  collapsed: false,
};
