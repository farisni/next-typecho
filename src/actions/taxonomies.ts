"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdministrator } from "@/lib/auth/session";
import { run, transaction } from "@/lib/db";

const taxonomySchema = z.object({
  name: z.string().trim().min(1).max(50),
  slug: z.string().trim().min(1).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});

const taxonomyIdsSchema = z.array(z.string().min(1).max(200)).min(1).max(100);

function parseTaxonomy(formData: FormData) {
  return taxonomySchema.parse({ name: formData.get("name"), slug: formData.get("slug") });
}

export async function createCategory(formData: FormData) {
  await requireAdministrator("/admin/categories");
  const input = parseTaxonomy(formData);
  const now = Date.now();
  run("INSERT INTO categories (id, name, slug, created_at, updated_at) VALUES (?, ?, ?, ?, ?)", randomUUID(), input.name, input.slug, now, now);
  revalidatePath("/admin/categories");
}

export async function deleteCategory(id: string) {
  await requireAdministrator("/admin/categories");
  run("DELETE FROM categories WHERE id = ?", id);
  revalidatePath("/admin/categories");
}

export async function bulkDeleteCategories(formData: FormData) {
  await requireAdministrator("/admin/categories");
  const ids = taxonomyIdsSchema.parse(formData.getAll("ids").map(String));
  transaction(() => {
    for (const id of ids) run("DELETE FROM categories WHERE id = ?", id);
  });
  revalidatePath("/admin/categories");
  revalidatePath("/admin/posts");
  revalidatePath("/");
}

export async function createTag(formData: FormData) {
  await requireAdministrator("/admin/tags");
  const input = parseTaxonomy(formData);
  const now = Date.now();
  run("INSERT INTO tags (id, name, slug, created_at, updated_at) VALUES (?, ?, ?, ?, ?)", randomUUID(), input.name, input.slug, now, now);
  revalidatePath("/admin/tags");
}

export async function deleteTag(id: string) {
  await requireAdministrator("/admin/tags");
  run("DELETE FROM tags WHERE id = ?", id);
  revalidatePath("/admin/tags");
}

export async function bulkDeleteTags(formData: FormData) {
  await requireAdministrator("/admin/tags");
  const ids = taxonomyIdsSchema.parse(formData.getAll("ids").map(String));
  transaction(() => {
    for (const id of ids) run("DELETE FROM tags WHERE id = ?", id);
  });
  revalidatePath("/admin/tags");
  revalidatePath("/admin/posts");
}
