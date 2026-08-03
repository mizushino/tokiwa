import { LitElement, css, html, type CSSResultGroup, type TemplateResult } from 'lit';

import { subscribePreferredLanguage, tGlobal } from '@app/i18n';
import { translateMessage } from '@app/i18n/messages';
import { tailwindCSS } from '@app/styles';

import { Navigate } from './navigate';

export interface PageMetadata {
  title?: string;
  description?: string;
  localizationId: string;
}

/**
 * Base class for page components.
 *
 * Provides:
 * - Automatic page metadata management (title, description, OG tags)
 * - Navigation helper method
 * - Shadow DOM rendering with shared Tailwind styles
 *
 * Usage:
 * ```ts
 * import pageMetadata from './page.json';
 *
 * export class MyPage extends PageElement {
 *   protected pageMetadata = pageMetadata;
 *
 * }
 * ```
 */
export class PageElement extends LitElement {
  static override styles: CSSResultGroup = [
    tailwindCSS,
    css`
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }
    `,
  ];

  protected pageMetadata?: PageMetadata;

  private unsubscribeLanguage?: () => void;

  public override connectedCallback(): void {
    super.connectedCallback();

    if (this.pageMetadata) {
      this.setPageMetadata(this.pageMetadata);
    }

    this.unsubscribeLanguage = subscribePreferredLanguage(() => {
      if (this.pageMetadata) {
        this.setPageMetadata(this.pageMetadata);
      }
      this.requestUpdate();
    });
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.unsubscribeLanguage?.();
    this.unsubscribeLanguage = undefined;
  }

  protected setPageMetadata(metadata: PageMetadata): void {
    const localized = (key: 'title' | 'description'): string =>
      translateMessage(`${metadata.localizationId}.${key}`) ?? metadata[key] ?? '';

    const title = localized('title');
    const description = localized('description');

    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
  }

  protected trans(code: string): string {
    const pageValue = this.pageMetadata ? translateMessage(`${this.pageMetadata.localizationId}.${code}`) : undefined;
    if (pageValue !== undefined) return pageValue;
    return tGlobal(code);
  }

  protected async navigateTo(pathname: string, state?: unknown): Promise<void> {
    await Navigate.to(pathname, state);
  }

  protected override render(): TemplateResult {
    return this.renderContents();
  }

  protected renderContents(): TemplateResult {
    return html``;
  }
}
