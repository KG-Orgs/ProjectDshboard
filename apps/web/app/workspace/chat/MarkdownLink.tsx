'use client';

import type { ReactNode } from 'react';
import { parseCitationHref } from '@contractor/shared';

/**
 * Link renderer for assistant markdown.
 *
 * Citation links (`#citation:<fileId>:<page>`, emitted by the answer formatter)
 * open the cited page in the document viewer through the workspace bridge rather
 * than navigating away. Everything else is treated as an ordinary external link.
 */
export function MarkdownLink({ href, children }: { href?: string; children?: ReactNode }) {
  const citation = parseCitationHref(href);

  if (citation) {
    return (
      <a
        href={href}
        className="citation-link"
        onClick={(event) => {
          event.preventDefault();
          void window.openPdfCitation?.({ fileId: citation.fileId, pageNumber: citation.page ?? 1 });
        }}
      >
        {children}
      </a>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>
      {children}
    </a>
  );
}

export default MarkdownLink;
