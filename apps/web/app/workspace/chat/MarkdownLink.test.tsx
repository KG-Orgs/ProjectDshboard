import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { buildCitationHref } from '@contractor/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MarkdownLink } from './MarkdownLink';

const FILE_ID = '11111111-1111-4111-8111-111111111111';

/**
 * The markdown shape the backend answer formatter emits: inline `[n]` markers
 * linked to the cited page, plus a compact source reference whose document title
 * links to that page too.
 */
const FORMATTED_ANSWER = [
  '### Approval Details',
  '',
  `* **Approval date:** March 19, 2025. [[1]](${buildCitationHref({ fileId: FILE_ID, page: 1 })})`,
  `* **Contract value:** $632,640. [[2]](${buildCitationHref({ fileId: FILE_ID, page: 4 })})`,
  '* **Supplier:** Could not be verified from the available source.',
  '',
  '**Sources:**',
  '',
  `* [1] [MTACD-MLJTC2-L-0024](${buildCitationHref({ fileId: FILE_ID, page: 1 })}), p. 1`,
  `* [2] [MTACD-MLJTC2-L-0024](${buildCitationHref({ fileId: FILE_ID, page: 4 })}), p. 4`,
].join('\n');

function renderAnswer(markdown: string) {
  return render(
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: MarkdownLink }}>
      {markdown}
    </ReactMarkdown>
  );
}

afterEach(() => {
  delete window.openPdfCitation;
  vi.restoreAllMocks();
});

describe('citation links in a formatted answer', () => {
  it('opens the cited page in the viewer when an inline marker is clicked', async () => {
    const openPdfCitation = vi.fn().mockResolvedValue(undefined);
    window.openPdfCitation = openPdfCitation;

    renderAnswer(FORMATTED_ANSWER);
    await userEvent.click(screen.getByRole('link', { name: '[1]' }));

    expect(openPdfCitation).toHaveBeenCalledWith({ fileId: FILE_ID, pageNumber: 1 });
  });

  it('opens the right page from each source title in the source reference', async () => {
    const openPdfCitation = vi.fn().mockResolvedValue(undefined);
    window.openPdfCitation = openPdfCitation;

    renderAnswer(FORMATTED_ANSWER);
    const sourceTitles = screen.getAllByRole('link', { name: 'MTACD-MLJTC2-L-0024' });
    expect(sourceTitles).toHaveLength(2);

    await userEvent.click(sourceTitles[1]);
    expect(openPdfCitation).toHaveBeenCalledWith({ fileId: FILE_ID, pageNumber: 4 });
  });

  it('survives markdown URL sanitisation, so the href is still a citation', () => {
    renderAnswer(FORMATTED_ANSWER);
    expect(screen.getByRole('link', { name: '[2]' })).toHaveAttribute(
      'href',
      `#citation:${FILE_ID}:4`
    );
  });

  it('does not navigate the workspace away', async () => {
    window.openPdfCitation = vi.fn().mockResolvedValue(undefined);
    renderAnswer(FORMATTED_ANSWER);

    const link = screen.getByRole('link', { name: '[1]' });
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(clickEvent);

    expect(clickEvent.defaultPrevented).toBe(true);
  });

  it('defaults to page 1 when the citation carries no page', async () => {
    const openPdfCitation = vi.fn().mockResolvedValue(undefined);
    window.openPdfCitation = openPdfCitation;

    renderAnswer(`See [[1]](${buildCitationHref({ fileId: FILE_ID })}).`);
    await userEvent.click(screen.getByRole('link', { name: '[1]' }));

    expect(openPdfCitation).toHaveBeenCalledWith({ fileId: FILE_ID, pageNumber: 1 });
  });

  it('is inert rather than broken when the viewer bridge is unavailable', async () => {
    renderAnswer(FORMATTED_ANSWER);
    await expect(userEvent.click(screen.getByRole('link', { name: '[1]' }))).resolves.toBeUndefined();
  });

  it('leaves ordinary links as external links', () => {
    renderAnswer('See [the spec](https://example.com/spec) for detail.');

    const link = screen.getByRole('link', { name: 'the spec' });
    expect(link).toHaveAttribute('href', 'https://example.com/spec');
    expect(link).toHaveAttribute('target', '_blank');
  });
});
