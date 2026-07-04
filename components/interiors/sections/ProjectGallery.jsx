"use client";

import Reveal from "../../motion/Reveal";
import { Stagger, StaggerItem } from "../../motion/Stagger";
import BeforeAfter from "./BeforeAfter";
import styles from "../Interiors.module.css";

// The centerpiece: real projects, grouped room-by-room, with before/after
// pairs where the shoot captured them. Renders nothing until real project
// media is configured; no stock or generated placeholders.
export default function ProjectGallery({ tenant }) {
  const gallery = tenant?.interiors?.gallery || {};
  const projects = (gallery.projects || []).filter(
    (project) => (project.rooms || []).length || (project.beforeAfter || []).length
  );

  if (!projects.length) return null;

  return (
    <section className={`${styles.section} ${styles.gallerySection}`} id="gallery">
      <div className={styles.container}>
        <Reveal className={styles.sectionHead}>
          {gallery.eyebrow && <p className={styles.eyebrow}>{gallery.eyebrow}</p>}
          <h2 className={styles.h2}>{gallery.headline || "Recent projects."}</h2>
          {gallery.body && <p className={styles.sectionBody}>{gallery.body}</p>}
        </Reveal>

        {projects.map((project) => (
          <article className={styles.project} key={project.id || project.title}>
            <Reveal>
              <div className={styles.projectHead}>
                <h3 className={styles.projectTitle}>{project.title}</h3>
                {project.location && (
                  <span className={styles.projectLocation}>{project.location}</span>
                )}
              </div>
              {project.summary && <p className={styles.projectSummary}>{project.summary}</p>}
            </Reveal>

            {(project.rooms || []).length > 0 && (
              <Stagger className={styles.roomGrid} amount={0.08}>
                {project.rooms.map((room) => (
                  <StaggerItem as="figure" key={room.src} className={styles.roomFigure}>
                    <img src={room.src} alt={room.alt || ""} loading="lazy" />
                    {room.caption && (
                      <figcaption className={styles.roomCaption}>{room.caption}</figcaption>
                    )}
                  </StaggerItem>
                ))}
              </Stagger>
            )}

            {(project.beforeAfter || []).map((pair) => (
              <BeforeAfter key={pair.before?.src} pair={pair} />
            ))}
          </article>
        ))}
      </div>
    </section>
  );
}
