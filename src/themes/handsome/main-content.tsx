export function MainContent({ children }: { children: React.ReactNode }) {
  return (
    <main className="handsome-main-content" id="main">
      {children}
    </main>
  );
}
