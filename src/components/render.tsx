import { html } from 'hono/html';

export function document(page: any) {
  return html`<!DOCTYPE html>${page}`;
}

export function RawHtml({ html: value }: { html: string }) {
  return <span dangerouslySetInnerHTML={{ __html: value }} />;
}
