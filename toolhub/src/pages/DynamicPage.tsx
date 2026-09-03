import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { BlockRenderer } from "../blocks/BlockRenderer";
import { EmptyState, ErrorState, SkeletonCards } from "../components/ui";
import { trackView } from "../lib/api";
import { usePage, useSettings } from "../lib/queries";
import { useSeo } from "../lib/seo";
import { NotFound } from "./NotFound";

// Every public page is a list of CMS blocks, so the admin can restructure the
// site without a deploy.
export function DynamicPage({ slug: fixedSlug }: { slug?: string }) {
  const params = useParams();
  const slug = fixedSlug ?? params.slug ?? "home";
  const { data: page, isLoading, error } = usePage(slug);
  const { data: settings } = useSettings();

  const template = settings?.seo.titleTemplate ?? "%s — ToolHub";
  useSeo({
    title: page?.seoTitle || (page ? template.replace("%s", page.title) : settings?.seo.defaultTitle ?? "ToolHub"),
    description: page?.seoDescription || settings?.seo.defaultDescription,
    keywords: page?.seoKeywords,
    image: settings?.seo.ogImage
  });

  useEffect(() => {
    if (page) trackView(`/${slug === "home" ? "" : slug}`);
  }, [page, slug]);

  if (isLoading) {
    return (
      <div className="section container">
        <SkeletonCards count={6} />
      </div>
    );
  }
  if (error) {
    const status = (error as { status?: number }).status;
    if (status === 404) return <NotFound />;
    return <div className="section container"><ErrorState error={error} /></div>;
  }
  if (!page) return <NotFound />;
  if (!page.blocks.length) {
    return (
      <div className="section container">
        <EmptyState title={page.title} text="This page has no content blocks yet." />
      </div>
    );
  }

  return <BlockRenderer blocks={page.blocks} />;
}
