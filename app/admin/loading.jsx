// Admin route loading fallback shown while the dashboard's async data loads.
export default function AdminLoading() {
  return (
    <main className="admin-login">
      <section className="admin-login__panel">
        <p className="eyebrow">Admin</p>
        <h1>Loading…</h1>
        <p>Fetching your dashboard.</p>
      </section>
    </main>
  );
}
