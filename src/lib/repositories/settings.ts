import { get } from "@/lib/db";

export const DEFAULT_SITE_SETTINGS = {
  siteName: "Next Typecho",
  siteDescription: "人生如逆旅，我亦是行人。",
  postsPerPage: 6,
  boxModel: true,
};

type SettingRow = {
  siteName: string;
  siteDescription: string;
  postsPerPage: number;
  boxModel: number;
};

export async function getSiteSettings() {
  const settings = get<SettingRow>(`
    SELECT site_name AS siteName, site_description AS siteDescription,
           posts_per_page AS postsPerPage, box_model AS boxModel
    FROM site_settings WHERE id = 1
  `);

  return settings ? { ...settings, boxModel: Boolean(settings.boxModel) } : DEFAULT_SITE_SETTINGS;
}
