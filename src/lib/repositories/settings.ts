import { get } from "@/lib/db";

export const DEFAULT_SITE_SETTINGS = {
  siteName: "Next Typecho",
  siteDescription: "人生如逆旅，我亦是行人。",
  postsPerPage: 6,
};

type SettingRow = {
  siteName: string;
  siteDescription: string;
  postsPerPage: number;
};

export async function getSiteSettings() {
  return (
    get<SettingRow>(`
      SELECT site_name AS siteName, site_description AS siteDescription,
             posts_per_page AS postsPerPage
      FROM site_settings WHERE id = 1
    `) ?? DEFAULT_SITE_SETTINGS
  );
}
