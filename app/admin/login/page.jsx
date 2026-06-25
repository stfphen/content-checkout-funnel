export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const error = params?.error;

  return (
    <main className="admin-login">
      <section className="admin-login__panel">
        <p className="eyebrow">Admin</p>
        <h1>Content Funnel Control</h1>
        <p>Sign in to manage domains, offers, leads, contractors, and outreach drafts.</p>
        <form action="/api/admin/login" method="post" className="admin-form">
          <label>
            Email
            <input name="email" type="email" placeholder="you@example.com" autoComplete="email" required />
          </label>
          <label>
            Password
            <input name="password" type="password" required />
          </label>
          <button className="button button--primary" type="submit">Sign In</button>
          {error ? <p className="admin-error">Invalid admin credentials.</p> : null}
        </form>
      </section>
    </main>
  );
}
