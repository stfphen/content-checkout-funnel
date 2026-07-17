"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  dgtlMagContents,
  dgtlMagDrops,
  dgtlMagIssue,
  dgtlMagProfiles,
  getExploreItems
} from "../../lib/dgtlmag/content";
import styles from "./DgtlMag.module.css";

const FILTERS = ["All", "Stories", "Profiles", "Drops"];

function itemMatchesFilter(item, filter) {
  if (filter === "All") return true;
  if (filter === "Stories") return item.kind === "story";
  if (filter === "Profiles") return item.kind === "profile";
  if (filter === "Drops") return item.kind === "drop";
  return true;
}

export default function DgtlMagHome() {
  const contentsRef = useRef(null);
  const [filter, setFilter] = useState("All");
  const [opened, setOpened] = useState(false);
  const items = useMemo(() => getExploreItems().filter((item) => itemMatchesFilter(item, filter)), [filter]);

  function openIssue() {
    setOpened(true);
    window.requestAnimationFrame(() => {
      contentsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <main className={styles.issuePage}>
      <header className={styles.topbar}>
        <Link className={styles.logoLockup} href="/" aria-label="DGTLMag home">
          <span className={styles.logo}>DGTLMAG</span>
          <span className={styles.logoSubline}>Open Network</span>
        </Link>
        <nav className={styles.navLinks} aria-label="DGTLMag navigation">
          <Link href="/explore">Explore</Link>
          <Link href="/directory">Directory</Link>
          <Link href="/profiles">Profiles</Link>
          <Link href="/submit">Submit</Link>
        </nav>
      </header>

      <section className={styles.coverWrap} aria-labelledby="cover-title">
        <div className={styles.coverCopy}>
          <span className={styles.kicker}>{dgtlMagIssue.eyebrow} / Issue {dgtlMagIssue.number}</span>
          <h1 className={styles.masthead}>DGTL</h1>
          <h2 id="cover-title" className={styles.coverTitle}>{dgtlMagIssue.title}</h2>
          <p className={styles.coverDeck}>{dgtlMagIssue.deck}</p>
          <div className={styles.coverActions}>
            <button className={styles.primaryButton} type="button" onClick={openIssue}>Open Issue</button>
            <Link className={styles.secondaryButton} href="/explore">Browse Explore</Link>
          </div>
          <ul className={styles.coverLines} aria-label="Inside this issue">
            {dgtlMagIssue.coverLines.map((line) => <li key={line}>{line}</li>)}
          </ul>
        </div>

        <aside className={styles.coverCard} aria-label="Magazine cover preview">
          <div className={styles.coverCardHeader}>
            <span className={styles.issueNumber}>No. {dgtlMagIssue.number}</span>
            <span className={styles.issueNumber}>{dgtlMagIssue.season}</span>
          </div>
          <div className={styles.coverCardTitle}>A front page for the network.</div>
          <div className={styles.coverCardArt} aria-hidden="true" />
          <div className={styles.coverCardFooter}>
            <span className={styles.issueNumber}>Stories</span>
            <span className={styles.issueNumber}>Profiles</span>
            <span className={styles.issueNumber}>Drops</span>
          </div>
        </aside>
      </section>

      <section ref={contentsRef} className={styles.section} id="contents" aria-labelledby="contents-title">
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.kicker}>{opened ? "Issue opened" : "Start here"}</span>
            <h2 id="contents-title" className={styles.sectionTitle}>Table of contents</h2>
          </div>
          <p className={styles.sectionIntro}>Pick a section, browse like a magazine, then open normal pages when something interests you.</p>
        </div>
        <div className={styles.contentsGrid}>
          {dgtlMagContents.map((item) => (
            <Link className={styles.contentLink} href={item.href} key={item.href}>
              <span className={styles.contentNumber}>{item.number}</span>
              <span>
                <strong className={styles.contentTitle}>{item.title}</strong>
                <span className={styles.contentText}>{item.description}</span>
              </span>
              <span className={styles.contentArrow}>→</span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="explore-title">
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.kicker}>Explore feed</span>
            <h2 id="explore-title" className={styles.sectionTitle}>Browse the issue.</h2>
          </div>
          <Link className={styles.smallLink} href="/explore">View all</Link>
        </div>
        <div className={styles.feedControls} aria-label="Filter explore feed">
          {FILTERS.map((option) => (
            <button
              className={`${styles.filterButton} ${filter === option ? styles.filterButtonActive : ""}`}
              type="button"
              onClick={() => setFilter(option)}
              key={option}
            >
              {option}
            </button>
          ))}
        </div>
        <div className={styles.cardGrid}>
          {items.slice(0, 6).map((item, index) => (
            <Link className={`${styles.storyCard} ${index === 0 ? styles.storyCardFeatured : ""}`} href={item.href} key={`${item.kind}-${item.slug}`}>
              <span className={styles.cardTop}>
                <span className={styles.cardKind}>{item.eyebrow}</span>
                <span className={styles.cardArrow}>→</span>
              </span>
              <span>
                <strong className={styles.cardTitle}>{item.title}</strong>
                <span className={styles.cardSummary}>{item.summary}</span>
              </span>
              <span className={styles.cardMeta}>{item.readTime || item.location || item.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="directory-title">
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.kicker}>Directory preview</span>
            <h2 id="directory-title" className={styles.sectionTitle}>People, pages, businesses, and brands.</h2>
          </div>
          <Link className={styles.smallLink} href="/directory">Open directory</Link>
        </div>
        <div className={styles.directoryGrid}>
          {dgtlMagProfiles.map((profile) => (
            <Link className={styles.directoryCard} href={profile.href} key={profile.slug}>
              <span className={styles.directoryTop}>
                <span className={styles.directoryAvatar}>{profile.title.slice(0, 2).toUpperCase()}</span>
                <span className={styles.profileType}>{profile.type}</span>
              </span>
              <span>
                <strong className={styles.directoryTitle}>{profile.title}</strong>
                <span className={styles.directorySummary}>{profile.summary}</span>
              </span>
              <span className={styles.tags}>{profile.tags.map((tag) => <span className={styles.tag} key={tag}>{tag}</span>)}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="drops-title">
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.kicker}>Drops</span>
            <h2 id="drops-title" className={styles.sectionTitle}>Small openings and callouts.</h2>
          </div>
          <Link className={styles.smallLink} href="/drops">View drops</Link>
        </div>
        <div className={styles.dropGrid}>
          {dgtlMagDrops.map((drop) => (
            <Link className={styles.dropCard} href={drop.href} key={drop.slug}>
              <span className={styles.dropTop}>
                <span className={styles.dropLabel}>{drop.section}</span>
                <span className={styles.cardArrow}>→</span>
              </span>
              <span>
                <strong className={styles.dropTitle}>{drop.title}</strong>
                <span className={styles.dropSummary}>{drop.summary}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>DGTLMag is the public discovery layer. Checkout funnels and backend automations stay behind the scenes.</footer>
    </main>
  );
}
