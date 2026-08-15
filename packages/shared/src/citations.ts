/**
 * Citation deep-link contract, shared by the backend answer formatter (which
 * renders "View source" links in answer markdown) and the chat UI (which
 * intercepts those links and opens the document viewer at the cited page).
 *
 * The fragment form is deliberate: react-markdown's default URL sanitiser keeps
 * fragment hrefs (a custom scheme like `citation:` would be stripped), and a
 * click that JavaScript never handles stays inert instead of navigating the user
 * out of the workspace.
 *
 * Shape: `#citation:<fileId>` or `#citation:<fileId>:<page>`
 */

export const CITATION_HREF_PREFIX = "#citation:";

export interface CitationTarget {
  fileId: string;
  /** 1-based page number; omitted when the source has no reliable page. */
  page?: number;
}

/** Build the href the chat UI turns into a viewer jump. */
export function buildCitationHref(target: CitationTarget): string {
  const page =
    typeof target.page === "number" && Number.isInteger(target.page) && target.page > 0
      ? `:${target.page}`
      : "";
  return `${CITATION_HREF_PREFIX}${target.fileId}${page}`;
}

/** Parse a citation href, or return null when it is an ordinary link. */
export function parseCitationHref(href: string | undefined): CitationTarget | null {
  if (!href || !href.startsWith(CITATION_HREF_PREFIX)) {
    return null;
  }

  const [fileId, rawPage, ...rest] = href.slice(CITATION_HREF_PREFIX.length).split(":");
  if (!fileId || rest.length > 0) {
    return null;
  }

  if (rawPage === undefined) {
    return { fileId };
  }

  const page = Number.parseInt(rawPage, 10);
  if (!Number.isInteger(page) || page <= 0) {
    return null;
  }

  return { fileId, page };
}
