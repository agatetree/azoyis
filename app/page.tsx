import ContactForm from "./contact-form";
import ProjectShowcase from "./project-showcase";
import { fallbackProjects, listProjects } from "../lib/project-store";

export const dynamic = "force-dynamic";

async function homepageProjects() {
  try {
    return await listProjects({ publishedOnly: true });
  } catch {
    return fallbackProjects.filter((project) => project.status === "Published");
  }
}

export default async function Home() {
  const projects = await homepageProjects();
  return (
    <>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="AzoyIs home"><img src="/logo.png" alt="AzoyIs" /></a>
        <nav aria-label="Main navigation"><a href="#services">Build</a><a href="#work">Work</a><a href="#contact">Contact</a></nav>
      </header>
      <main id="top">
        <section className="hero shell" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">Creative AI tools, built around real work.</p>
            <h1 id="hero-title">Ideas turned into useful AI tools and systems.</h1>
            <p className="hero-text">AzoyIs is the home for practical AI tools, creative agent workflows, and focused digital solutions designed around real needs.</p>
            <div className="hero-actions">
              <a className="button button-primary" href="#work">See the work</a>
              <a className="text-link" href="#contact">Start a conversation <span aria-hidden="true">↗</span></a>
            </div>
          </div>
          <div className="brand-panel" aria-hidden="true">
            <video autoPlay muted playsInline preload="auto" poster="/admin-brand.jpg">
              <source src="/azoyis-logo-animation.mp4" type="video/mp4" />
              <img src="/admin-brand.jpg" alt="" />
            </video>
            <p>Design · Build · Improve</p>
          </div>
        </section>

        <section className="services-section" id="services" aria-labelledby="services-title">
          <div className="shell">
            <div className="services-intro">
              <div>
                <p className="eyebrow">What I build</p>
                <h2 id="services-title">Useful AI, shaped around the work.</h2>
              </div>
              <p>I look for the slow, repetitive, or confusing part of a process, then build a practical tool that makes it easier.</p>
            </div>

            <div className="services-grid">
              <article>
                <span>01</span>
                <h3>AI research and agents</h3>
                <p>Tools that gather information, compare results, organize findings, and help people reach better decisions faster.</p>
              </article>
              <article>
                <span>02</span>
                <h3>Workflow tools</h3>
                <p>Clear working systems that replace scattered steps, repeated work, and information that is difficult to track.</p>
              </article>
              <article>
                <span>03</span>
                <h3>Custom digital systems</h3>
                <p>Public tools and private systems designed around a specific need instead of forcing the work into a generic product.</p>
              </article>
            </div>

            <div className="approach-row" aria-label="How AzoyIs works">
              <p>How it works</p>
              <div><span>01</span><strong>Understand the real need</strong></div>
              <div><span>02</span><strong>Build the useful version</strong></div>
              <div><span>03</span><strong>Test and improve it</strong></div>
            </div>
          </div>
        </section>

        <section className="work-section" id="work" aria-labelledby="work-title">
          <div className="shell">
            <div className="section-heading">
              <div><p className="eyebrow">Selected projects</p><h2 id="work-title">Creative systems. Practical results.</h2></div>
              <p>Explore public tools and private AI systems built to solve specific, real-world problems.</p>
            </div>
            <ProjectShowcase projects={projects} />
          </div>
        </section>

        <section className="contact-section shell" id="contact" aria-labelledby="contact-title">
          <div className="contact-copy">
            <p className="eyebrow">Contact AzoyIs</p>
            <h2 id="contact-title">Have an idea worth building?</h2>
            <p>Share what you are working on, what is getting in the way, and what a useful solution would look like.</p>
            <div className="contact-note"><span aria-hidden="true">→</span><p>A short description is enough. We can figure out the details together.</p></div>
          </div>
          <ContactForm />
        </section>
      </main>
      <footer>
        <div className="shell footer-inner">
          <img src="/logo.png" alt="AzoyIs" />
          <p>Creative AI tools, built around real work.</p>
          <nav className="footer-links" aria-label="Footer navigation"><a href="#services">Build</a><a href="#work">Work</a><a href="#contact">Contact</a></nav>
        </div>
        <div className="shell footer-bottom"><span>© {new Date().getFullYear()} AzoyIs</span><a href="#top">Back to top ↑</a></div>
      </footer>
    </>
  );
}
