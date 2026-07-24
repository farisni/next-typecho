const routes = [
  "/",
  "/start-page.html",
  "/posts/welcome-to-next-typecho",
  "/categories/development",
  "/tags/nextjs",
  "/install",
  "/login",
  "/admin",
  "/admin/posts",
  "/admin/posts/new",
  "/admin/profile",
  "/admin/categories",
  "/admin/tags",
  "/admin/themes",
  "/admin/themes/settings",
  "/admin/themes/editor",
  "/admin/settings",
];

for (const route of routes) {
  const response = await fetch(`http://localhost:3000${route}`);
  console.log(`${response.status} ${route}`);
  if (!response.ok) process.exitCode = 1;
}
