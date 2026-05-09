import { html, type TemplateResult } from 'lit';

import { LightElement } from '@app/element';
import { globalTranslations, getPreferredLanguage } from '@app/i18n';

import { Navigate } from './navigate';

/**
 * Metadata for a page (title, description, etc.).
 */
export interface PageMetadata {
  title?: string;
  description?: string;
  translations?: Record<'en' | 'ja', Record<string, string>>;
}

/**
 * Base class for page components.
 *
 * Provides:
 * - Automatic page metadata management (title, description, OG tags)
 * - Navigation helper method
 * - Light DOM rendering (no shadow DOM)
 * - Default host element classes (can be overridden)
 *
 * Usage:
 * ```ts
 * import pageMetadata from './page.json';
 *
 * export class MyPage extends PageElement {
 *   protected pageMetadata = pageMetadata;
 *
 *   // Optional: Override default classes
 *   protected static override hostClasses = ['block', 'w-full'];
 * }
 * ```
 */
export class PageElement extends LightElement {
  /**
   * CSS classes to apply to the host element.
   * Override in subclasses to customize default styling.
   */
  protected static override hostClasses: string[] = ['block', 'w-full', 'h-full'];

  /**
   * Page metadata (title, description, OG tags).
   * Import from page.json and assign in subclass.
   */
  protected pageMetadata?: PageMetadata;

  /**
   * Automatically set page metadata when component is connected to DOM.
   */
  public override connectedCallback(): void {
    super.connectedCallback();

    if (this.pageMetadata) {
      this.setPageMetadata(this.pageMetadata);
    }
  }

  /**
   * Set page metadata (title, description, OG tags).
   */
  protected setPageMetadata(metadata: PageMetadata): void {
    document.title = metadata.title ?? '';
    document.querySelector('meta[name="description"]')?.setAttribute('content', metadata.description ?? '');
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', metadata.title ?? '');
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', metadata.description ?? '');
  }

  /**
   * Translate a code to the user's language using page metadata translations.
   *
   * @param code - The translation code
   * @returns The translated string or the code if not found
   */
  protected trans(code: string): string {
    const lang = getPreferredLanguage();
    // 1. Page-specific translation
    const pageValue = this.pageMetadata?.translations?.[lang]?.[code];
    if (pageValue !== undefined) return pageValue;
    // 2. Global shared translation fallback
    const globalValue = globalTranslations[lang]?.[code];
    return globalValue ?? code;
  }

  /**
   * Navigate to the specified pathname.
   *
   * @param pathname - The path to navigate to
   * @param state - Optional state object to pass to history.pushState
   */
  protected async navigateTo(pathname: string, state?: unknown): Promise<void> {
    await Navigate.to(pathname, state);
  }

  protected override render(): TemplateResult {
    return html`<div class="h-full w-full">${this.renderContents()}</div>`;
  }

  protected renderContents(): TemplateResult {
    return html``;
  }
}
