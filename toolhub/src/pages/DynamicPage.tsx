import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { BlockRenderer } from "../blocks/BlockRenderer";
import { EmptyState, ErrorState, SkeletonCards } from "../components/ui";
import { trackView } from "../lib/api";
import { useCategories, usePage, useSettings } from "../lib/queries";
import { useSeo } from "../lib/seo";
import type { PageBlock } from "../lib/types";
import { NotFound } from "./NotFound";

// Every public page is a list of CMS blocks, so the admin can restructure the
// site without a deploy.
export function DynamicPage({ slug: fixedSlug }: { slug?: string }) {
  const params = useParams();
  const slug = fixedSlug ?? params.slug ?? "home";
  const { data: page, isLoading, error } = usePage(slug);
  const { data: settings } = useSettings();
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  const status = (error as { status?: number } | null)?.status;

  // A category created in the panel has no page of its own. Rather than a 404,
  // it gets the standard catalog layout; adding a page with the same slug in
  // the CMS takes over from here.
  const category = useMemo(() => {
    if (page || !categories) return undefined;
    for (const item of categories.items) {
      if (item.slug === slug) return item;
      const child = item.children.find((sub) => sub.slug === slug);
      if (child) return { ...child, description: "", seoTitle: "", seoDescription: "" };
    }
    return undefined;
  }, [page, categories, slug]);

  const fallbackBlocks: PageBlock[] = useMemo(
    () =>
      category
        ? [
            {
              type: "hero",
              visible: true,
              data: {
                eyebrow: "TOOL COLLECTION",
                title: category.name,
                subtitle: "description" in category ? category.description : "",
                variant: "compact"
              }
            },
            { type: "productGrid", visible: true, data: { category: category.slug, layout: "list", showFilters: true } }
          ]
        : [],
    [category]
  );

  const template = settings?.seo.titleTemplate ?? "%s — ToolHub";
  const title = page?.seoTitle
    || (page ? template.replace("%s", page.title) : "")
    || (category ? (("seoTitle" in category && category.seoTitle) || template.replace("%s", category.name)) : "")
    || settings?.seo.defaultTitle
    || "ToolHub";

  useSeo({
    title,
    description:
      page?.seoDescription
      || (category && "seoDescription" in category ? category.seoDescription : "")
      || (category && "description" in category ? category.description : "")
      || settings?.seo.defaultDescription,
    keywords: page?.seoKeywords,
    image: settings?.seo.ogImage
  });

  useEffect(() => {
    if (page || category) trackView(`/${slug === "home" ? "" : slug}`);
  }, [page, category, slug]);

  if (isLoading || (status === 404 && categoriesLoading)) {
    return (
      <div className="section container">
        <SkeletonCards count={6} />
      </div>
    );
  }

  if (error && status !== 404) {
    return <div className="section container"><ErrorState error={error} /></div>;
  }

  if (!page) {
    if (category) return <BlockRenderer blocks={fallbackBlocks} />;
    return <NotFound />;
  }

  if (!page.blocks.length) {
    return (
      <div className="section container">
        <EmptyState title={page.title} text="This page has no content blocks yet." />
      </div>
    );
  }

  return <BlockRenderer blocks={page.blocks} />;
}
