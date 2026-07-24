export function formatPostDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  // Typecho 默认的 postDateFormat 是 Y-m-d。
  return `${year}-${month}-${day}`;
}