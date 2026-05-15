import { signIn } from "./actions";
import styles from "./login.module.css";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className="eyebrow">Private admin</p>
        <h1 className="display">Sign in</h1>
        <form action={signIn}>
          <label>
            Email
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          {params.error ? <p role="alert">That sign-in did not work.</p> : null}
          <button type="submit">Enter admin</button>
        </form>
      </section>
    </main>
  );
}
