import { Link } from "react-router-dom";
import { useSeo } from "../lib/seo";

export function NotFound() {
  useSeo({ title: "Page not found — ToolHub", description: "This page does not exist.", noindex: true });
  return (
    <section className="section">
      <div className="narrow page-intro">
        <span className="eyebrow">404</span>
        <h1>This page went missing.</h1>
        <p>The page you are looking for was moved, renamed or never existed.</p>
        <div className="hero-actions center">
          <Link className="btn primary" to="/">Back to home</Link>
          <Link className="btn ghost" to="/faq">Read the FAQ</Link>
        </div>
      </div>
    </section>
  );
}
