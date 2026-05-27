import data from "./guides.json";

export type Guide = {
  slug: string;
  title: string;
  subtitle: string;
  file: string;
};

export type GuideCategory = {
  id: string;
  label: string;
  description: string;
  colorVar: string;
  color?: string;
  guides: Guide[];
};

export type GuideCollection = {
  id: string;
  label: string;
  description: string;
  color: string;
  folder: string;
  indexFile: string;
};

export type GuideShowcase = {
  title: string;
  subtitle: string;
  file: string;
  pptxFile: string;
  mdFile: string;
};

export const categories: GuideCategory[] = data.categories as GuideCategory[];
export const collections: GuideCollection[] = (data.collections || []) as GuideCollection[];
export const showcase: GuideShowcase = data.showcase as GuideShowcase;

export const allGuides = categories.flatMap((c) =>
  c.guides.map((g) => ({ ...g, categoryId: c.id, categoryLabel: c.label, colorVar: c.colorVar })),
);

export function findGuide(slug: string) {
  return allGuides.find((g) => g.slug === slug);
}

export function findCategoryByGuide(slug: string) {
  return categories.find((c) => c.guides.some((g) => g.slug === slug));
}