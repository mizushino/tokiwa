import type { Router } from '@lit-labs/router';
import { getAnalytics, logEvent } from 'firebase/analytics';
import { directive, Directive, PartType, type ElementPart, type PartInfo } from 'lit/directive.js';
import { LitShare } from 'lit-share';

/**
 * Navigate directive for handling client-side navigation.
 *
 * Provides both directive and programmatic API for navigation:
 * - Directive: html`<button ${navigate('/path/')}>Link</button>`
 * - Programmatic: await Navigate.to('/path/')
 */
export class Navigate extends Directive {
  private _pathname = '';
  private element?: Element;

  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (partInfo.type !== PartType.ELEMENT) {
      throw new Error('The `navigate` directive must be used in the element');
    }
  }

  public render(..._props: unknown[]): void {
    return;
  }

  public override update(part: ElementPart, props: unknown[]): void {
    if (props.length !== 1) {
      return;
    }

    this._pathname = props[0] as string;

    if (!this.element) {
      this.element = part.element;
      this.element.addEventListener('click', this.onClick);
    }
  }

  public disconnected(): void {
    this.element?.removeEventListener('click', this.onClick);
  }

  public reconnected(): void {
    this.element?.addEventListener('click', this.onClick);
  }

  protected onClick = (async () => {
    await Navigate.to(this._pathname);
  }).bind(this);

  /**
   * Navigate to the specified pathname.
   *
   * @param pathname - The path to navigate to (supports absolute, relative, hash, and external URLs)
   * @param state - Optional state object to pass to history.pushState
   */
  public static async to(pathname: string, state?: unknown): Promise<void> {
    if (pathname.startsWith('https://') || pathname.startsWith('http://')) {
      window.open(pathname, '_blank');
      return;
    }

    if (pathname[0] === '#') {
      if (location.hash !== pathname) {
        location.hash = pathname;
      } else {
        const target = document.querySelector(pathname) as HTMLElement;
        if (target) {
          window.scrollTo(0, target.offsetTop);
        }
      }
      return;
    }

    pathname = Navigate.resolveRelativePath(pathname);
    pathname = Navigate.normalizePathname(pathname);

    history.pushState(state, '', pathname);
    window.scrollTo({ top: 0, behavior: 'instant' });

    const router = LitShare.get('router') as Router;
    if (router) {
      await router.goto(pathname);
    }

    await Navigate.scrollToHashIfNeeded();

    try {
      const analytics = getAnalytics();
      logEvent(analytics, 'page_view', {
        page_path: pathname,
        page_title: document.title,
        page_location: window.location.href,
      });
    } catch (error) {
      // Silently fail if analytics is not available
      console.warn('Failed to track page view:', error);
    }
  }

  /**
   * Resolve relative paths (./path or ../path) to absolute paths.
   */
  private static resolveRelativePath(pathname: string): string {
    if (!pathname.startsWith('.')) {
      return pathname;
    }

    const CURRENT_DIR = './';
    const PARENT_DIR = '../';

    if (pathname.startsWith(CURRENT_DIR)) {
      pathname = pathname.substring(CURRENT_DIR.length);
    }

    const segments = location.pathname.split('/');
    segments.pop();

    while (segments.length > 0 && pathname.startsWith(PARENT_DIR)) {
      segments.pop();
      pathname = pathname.substring(PARENT_DIR.length);
    }

    return segments.join('/') + '/' + pathname;
  }

  /**
   * Normalize pathname by removing query parameters and hash, and ensuring trailing slash.
   */
  private static normalizePathname(pathname: string): string {
    const queryIndex = pathname.indexOf('?');
    const hashIndex = pathname.indexOf('#');

    let pathEnd = pathname.length;
    if (queryIndex !== -1 && hashIndex !== -1) {
      pathEnd = Math.min(queryIndex, hashIndex);
    } else if (queryIndex !== -1) {
      pathEnd = queryIndex;
    } else if (hashIndex !== -1) {
      pathEnd = hashIndex;
    }

    let path = pathname.slice(0, pathEnd);

    if (!path.endsWith('/')) {
      path = `${path}/`;
    }

    return path;
  }

  /**
   * Scroll to hash target after navigation if hash is present in URL.
   * Waits for next animation frame to ensure DOM is rendered.
   */
  private static async scrollToHashIfNeeded(): Promise<void> {
    if (!location.hash) {
      return;
    }

    await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
    const target = document.querySelector(location.hash) as HTMLElement;
    if (target) {
      window.scrollTo(0, target.offsetTop);
    }
  }
}

export const navigate = directive(Navigate);
