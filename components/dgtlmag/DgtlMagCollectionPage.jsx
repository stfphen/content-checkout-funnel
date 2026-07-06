import Link from "next/link";
import { dgtlMagIssue, getCollection } from "../../lib/dgtlmag/content";
import styles from "./DgtlMag.module.css";

const COPY = {
  explore: {
    eyebrow: "Explore",
    title: "Browse the issue.",
    deck: "A simple feed of stories, profiles, and drops from the DGTLMag network."
  },
  directory: {
    eyebrow: "Directory",
    title: "Find people and brands in the network.",
    deck: "Creator pages, business profiles, media channels, venues, artists, and collaborators."
  },
  stories: {
    eyebrow: "Stories",
    title: "Read the editorial layer.",
    deck: "Short field notes and features that explain what is happening across the network."
  },
  profiles: {
    eyebrow: "Profiles",
    title: "Open a profile.",
    deck: "Every profile is a shareable media object for a person, business, social page, or brand."
  },
  drops: {
    eyebrow: "Drops",
    title: "Small openings and callouts.",
    deck: "Lightweight opportunities that can connect to deeper workflows when someone asks for more."
  },
  submit: {
    eyebrow: "Submit",
    title: "Suggest a profile, story, or collaboration.",
    deck: "A soft entry point for the network before a full funnel, intake, or admin review flow is added."
  }
};

function getItemMeta(item) {
  return item.readTime || item.location || item.label || item.section || item.type;
}

export default function DgtlMagCollectionPage({ type = "explore" }) {
  const copy = COPY[type] || COPY.explore;
  const items = getCollection(type);
  const isSubmit = type === "submit";

  return (
    <main className={styles.issuePage}>
      <header className={styles.topbar}>
        <Link className={styles.logoLockup} href="/">
          <span className={styles.logo}>DGTLMAG</span>
          <span className={styles.logoSubline}>Issue {dgtlMagIssue.number}</span>
        </Link>
        <nav className={styles.navLinks} aria-label="DGTLMag navigation">
          <Link href="/explore">Explore</Link>
          <Link href="/directory">Directory</Link>
          <Link href="/profiles">Profiles</Link>
          <Link href="/submit">Submit</Link>
        </nav>
      </header>

      <section className={styles.collectionHero}>
        <span className={styles.kicker}>{copy.eyebrow}</span>
        <h1 className={styles.collectionTitle}>{copy.title}</h1>
        <p className={styles.collectionDeck}>{copy.deck}</p>
        <div className={styles.sectionActions}>
          <Link className={styles.secondaryButton} href="/">Back to cover</Link>
          {!isSubmit ? <Link className={styles.primaryButton} href="/submit">Suggest a listing</Link> : null}
        </div>
      </section>

      {isSubmit ? (
        <section className={styles.submitPanel}>
          <span className={styles.kicker}>First-pass submission flow</span>
          <h2 className={styles.sectionTitle}>Keep this simple at launch.</h2>
          <p className={styles.sectionIntro}>
            The first version can be a clean intake CTA that routes to your admin review process later. For now, this page explains what can be submitted.
          </p>
          <ul className={styles.submitList}>
            <li><strong>Profile suggestion:</strong> creator, business, venue, brand, artist, media page, or community account.</li>
            <li><strong>Story suggestion:</strong> a feature, recap, field note, behind-the-scenes piece, or collaboration idea.</li>
            <li><strong>Drop suggestion:</strong> a limited callout, event, profile slot, campaign idea, or activation opportunity.</li>
          </ul>
        </section>
      ) : (
        <section className={styles.collectionGrid} aria-label={`${copy.eyebrow} list`}>
          {items.map((item) => (
            <Link className={styles.collectionCard} href={item.href} key={`${item.kind}-${item.slug}`}>
              <span className={styles.collectionCardTop}>
                <span className={styles.cardKind}>{item.section || item.type || item.kind}</span>
                <span className={styles.cardArrow}>→</span>
              </span>
              <span>
                <strong className={styles.cardTitle}>{item.title}</strong>
                <span className={styles.cardSummary}>{item.summary}</span>
              </span>
              <span className={styles.cardMeta}>{getItemMeta(item)}</span>
            </Link>
          ))}
        </section>
      )}

      <footer className={styles.footer}>Normal URLs keep the interface simple, shareable, and SEO-friendly.</footer>
    </main>
  );
}
