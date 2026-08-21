"use client";

import { useRef, useState } from "react";
import type { Project } from "../lib/project-store";

// Same-site links ("/lchaim") stay in the tab; only external ones open a
// new one, so an in-site project does not spawn a stray tab.
function isInternal(url: string) {
  return url.startsWith("/") && !url.startsWith("//");
}

function isAiProject(project: Project) {
  const text = `${project.name} ${project.category}`.toLowerCase();
  return project.access === "Private" || /\b(ai|agent|crm|intelligence|system|manager)\b/.test(text);
}

function ProjectVisual({ project }: { project: Project }) {
  const name = project.name.toLowerCase();

  if (name.includes("chaim")) {
    return (
      <div className="lchaim-preview" aria-label="L’Chaim, Choose Your Bottle">
        <strong>L’CHAIM</strong>
        <span>Choose Your Bottle</span>
      </div>
    );
  }

  if (name === "cartiro") {
    return (
      <div className="cartiro-preview">
        <img src="/cartiro-logo.jpg" alt="Cartiro" />
      </div>
    );
  }

  if (name.includes("tzadik")) {
    return (
      <div className="tzadikim-preview">
        <img src="/tzadikim-banner.webp" alt="Tzadikim Yahrtzeit candle symbol" />
      </div>
    );
  }

  if (name.includes("lender") && name.includes("radar")) {
    return (
      <div className="private-project-preview" aria-label="Lenders Radar project preview">
        <div className="radar-visual" aria-hidden="true"><i /><i /><i /><b>LR</b></div>
      </div>
    );
  }

  return (
    <div className={`generic-project-preview ${project.access.toLowerCase()}`} aria-hidden="true">
      <div className="generic-project-grid" />
      <strong>{project.mark || project.name.slice(0, 2).toUpperCase()}</strong>
      <span>{project.access === "Private" ? "Private system" : "Digital project"}</span>
    </div>
  );
}

export default function ProjectShowcase({ projects }: { projects: Project[] }) {
  const [activeId, setActiveId] = useState(projects[0]?.id ?? 0);
  const touchStart = useRef<number | null>(null);
  const tabTouch = useRef<{ x: number; y: number; id: number } | null>(null);
  const activeProject = projects.find((project) => project.id === activeId) ?? projects[0];

  function move(direction: -1 | 1) {
    if (!activeProject || projects.length < 2) return;
    const index = projects.findIndex((project) => project.id === activeProject.id);
    const nextIndex = (index + direction + projects.length) % projects.length;
    setActiveId(projects[nextIndex].id);
  }

  if (!projects.length || !activeProject) {
    return <div className="showcase-empty">Projects will appear here soon.</div>;
  }

  const activeIndex = projects.findIndex((project) => project.id === activeProject.id);
  const activeIsAi = isAiProject(activeProject);

  return (
    <div className="projects-showcase">
      <div className="showcase-frame">
        <nav className="project-selector" aria-label="Choose a project">
          <div className="project-selector-heading">
            <span>Explore the work</span>
            <strong>{projects.length} {projects.length === 1 ? "project" : "projects"}</strong>
          </div>
          <div className="project-selector-list" role="tablist" aria-orientation="vertical">
            {projects.map((project, index) => (
              <button
                type="button"
                role="tab"
                id={`project-tab-${project.id}`}
                aria-controls="project-spotlight"
                aria-selected={project.id === activeProject.id}
                className={project.id === activeProject.id ? "active" : ""}
                key={project.id}
                onClick={() => setActiveId(project.id)}
                onTouchStart={(event) => {
                  const touch = event.changedTouches[0];
                  tabTouch.current = touch ? { x: touch.clientX, y: touch.clientY, id: project.id } : null;
                }}
                onTouchEnd={(event) => {
                  // Activate straight from the touch sequence. Some mobile
                  // browsers never deliver the synthesized click here, so this
                  // does not depend on one arriving. Selecting is idempotent,
                  // so a click that does arrive changes nothing.
                  const start = tabTouch.current;
                  tabTouch.current = null;
                  if (!start || start.id !== project.id) return;
                  const touch = event.changedTouches[0];
                  if (!touch) return;
                  // A drag means the user was scrolling, not tapping.
                  if (Math.abs(touch.clientX - start.x) > 12 || Math.abs(touch.clientY - start.y) > 12) return;
                  setActiveId(project.id);
                }}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <span><strong>{project.name}</strong><small>{project.category}</small></span>
                <i aria-hidden="true">↗</i>
              </button>
            ))}
          </div>
        </nav>

        <article
          className="project-spotlight"
          id="project-spotlight"
          role="tabpanel"
          aria-labelledby={`project-tab-${activeProject.id}`}
          onTouchStart={(event) => { touchStart.current = event.changedTouches[0]?.clientX ?? null; }}
          onTouchEnd={(event) => {
            if (touchStart.current === null) return;
            const distance = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current;
            if (Math.abs(distance) > 55) move(distance > 0 ? -1 : 1);
            touchStart.current = null;
          }}
        >
          <div className={`spotlight-visual ${activeProject.access.toLowerCase()}`}>
            {activeProject.url && activeProject.access === "Public" ? (
              isInternal(activeProject.url) ? (
                <a className="button button-primary spotlight-open" href={activeProject.url}>
                  Open project <span aria-hidden="true">↗</span>
                </a>
              ) : (
                <a className="button button-primary spotlight-open" href={activeProject.url} target="_blank" rel="noreferrer">
                  Open project <span aria-hidden="true">↗</span>
                </a>
              )
            ) : activeProject.access === "Private" ? (
              <span className="spotlight-private">Private</span>
            ) : null}
            <ProjectVisual project={activeProject} />
          </div>

          <div className="spotlight-content">
            <div className="spotlight-number">Project {String(activeIndex + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}</div>
            <p className="spotlight-kicker">{activeIsAi ? "AI-powered system" : "Practical digital project"}</p>
            <h3>{activeProject.name}</h3>
            <p className="spotlight-description">{activeProject.description}</p>


            <div className="spotlight-actions">
              <div className="spotlight-arrows" aria-label="Browse projects">
                <button type="button" onClick={() => move(-1)} aria-label="Previous project">←</button>
                <button type="button" onClick={() => move(1)} aria-label="Next project">→</button>
              </div>
            </div>
          </div>
        </article>
      </div>
      <p className="showcase-swipe-note">Swipe to explore projects</p>
    </div>
  );
}
