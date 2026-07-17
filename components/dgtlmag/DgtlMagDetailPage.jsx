import Link from "next/link";
import { notFound } from "next/navigation";
import { getContentItem, getExploreItems } from "../../lib/dgtlmag/content";
import styles from "./DgtlMag.module.css";

function detailLabel(type) {
  if (type === "stories") return "Story";
  if (type === "profiles") return "Profile";
  if (type === "drops") return "Drop";
  return "DGTLMag";
}

export default function DgtlMagDetailPage({ type, slug }) {
  const item = getContentItem(type, slug);
  if (!item) notFound();

  const related = getExploreItems()
    .filter((relatedItem) => relatedItem.slug !== item.slug)
    .slice(0, 3);

  return (
    <main className={styles.issuePage}>
      <header className={styles.topbar}>
        <Link className={styles.logoLockup} href="/">
          <span className={styles.logo}>DGTLMAG</span>
          <span className={styles.logoSubline}>{detailLabel(type)}</span>
        </Link>
        <nav className={styles.navLinks} aria-label="DGTLMag navigation">
          <Link href="/explore">Explore</Link>
          <Link href="/directory">Directory</Link>
          <Link href="/profiles">Profiles</Link>
          <Link href="/submit">Submit</Link>
        </nav>
      </header>

      <section className={styles.detailHero}>
        <div>
          <span className={styles.kicker}>{item.section || item.type || detailLabel(type)}</span>
          <h1 className={styles.detailTitle}>{item.title}</h1>
          <p className={styles.detailDeck}>{item.summary}</p>
          <div className={styles.sectionActions}>
            <Link className={styles.secondaryButton} href={`/${type}`}>Back to {type}</Link>
            <Link className={styles.primaryButton} href="/submit">Suggest something</Link>
          </div>
        </div>
        <aside className={styles.detailRail}>
          <span className={styles.pageMarker}>DGTLMag page</span>
          <h2 className={styles.cardTitle}>{item.label || item.type || item.section || "Network"}</h2>
          <p className={styles.cardSummary}>{item.location || item.readTime || "Shareable public page"}</p>
          {item.tags?.length ? (
            <div className={styles.tags}>{item.tags.map((tag) => <span className={styles.detailTag} key={tag}>{tag}</span>)}</div>
          ) : null}
        </aside>
      </section>

      <article className={styles.detailBody}>
        {item.body?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        {item.takeaways?.length ? (
          <ul className={styles.takeaways}>
            {item.takeaways.map((takeaway) => <li key={takeaway}>{takeaway}</li>)}
          </ul>
        ) : null}
      </article>

      <section className={styles.relatedRail} aria-label="Related pages">
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.kicker}>Keep exploring</span>
            <h2 className={styles.sectionTitle}>Related pages</h2>
          </div>
        </div>
        <div className={styles.relatedGrid}>
          {related.map((relatedItem) => (
            <Link className={styles.relatedCard} href={relatedItem.href} key={`${relatedItem.kind}-${relatedItem.slug}`}>
              <span className={styles.cardKind}>{relatedItem.section || relatedItem.type || relatedItem.kind}</span>
              <strong className={styles.cardTitle}>{relatedItem.title}</strong>
              <span className={styles.cardSummary}>{relatedItem.summary}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
