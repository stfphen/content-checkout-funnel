"use client";

import { useState } from "react";
import Reveal from "../../motion/Reveal";
import { Stagger, StaggerItem } from "../../motion/Stagger";
import BeforeAfter from "./BeforeAfter";
import styles from "../Interiors.module.css";

// The centerpiece: real projects, grouped room-by-room, with before/after
// pairs where the shoot captured them. Each project is a drawer (native
// details/summary, keyboard accessible) so the page stays scannable; the
// first drawer ships open so the gallery still leads with photography.
// Renders nothing until real project media is configured; no stock or
// generated placeholders.

function ProjectDrawer({ project, defaultOpen }) {
  // Local state (not a bare `open` prop) so parent re-renders, e.g. package
  // selection elsewhere on the page, never snap a drawer back.
  const [open, setOpen] = useState(defaultOpen);
  const rooms = project.rooms || [];
  const pairs = project.beforeAfter || [];
  const photoCount = rooms.length + pairs.length * 2;
  const thumb = rooms[0]?.src || pairs[0]?.after?.src;

  return (
    <details
      className={styles.projectDrawer}
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className={styles.projectSummary2}>
        {thumb && <img className={styles.projectThumb} src={thumb} alt="" />}
        <span className={styles.projectMeta}>
          <span className={styles.projectTitle}>{project.title}</span>
          {project.location && (
            <span className={styles.projectLocation}>{project.location}</span>
          )}
        </span>
        <span className={styles.projectCount}>
          {photoCount} photo{photoCount === 1 ? "" : "s"}
          {pairs.length > 0 && " · before/after"}
        </span>
      </summary>

      <div className={styles.projectBody}>
        {project.summary && <p className={styles.projectSummary}>{project.summary}</p>}

        {rooms.length > 0 && (
          <Stagger className={styles.roomGrid} amount={0.08}>
            {rooms.map((room) => (
              <StaggerItem as="figure" key={room.src} className={styles.roomFigure}>
                <img src={room.src} alt={room.alt || ""} />
                {room.caption && (
                  <figcaption className={styles.roomCaption}>{room.caption}</figcaption>
                )}
              </StaggerItem>
            ))}
          </Stagger>
        )}

        {pairs.map((pair) => (
          <BeforeAfter key={pair.before?.src} pair={pair} />
        ))}
      </div>
    </details>
  );
}

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

        <Reveal className={styles.projectList} amount={0.05}>
          {projects.map((project, index) => (
            <ProjectDrawer
              key={project.id || project.title}
              project={project}
              defaultOpen={index === 0}
            />
          ))}
        </Reveal>
      </div>
    </section>
  );
}
