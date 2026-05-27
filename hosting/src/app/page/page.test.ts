import type { Router } from '@lit-labs/router';
import { css, html, type CSSResultGroup, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { PartType, type ElementPart, type PartInfo } from 'lit/directive.js';
import { LitShare } from 'lit-share';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearPreferredLanguageCache, setPreferredLanguage } from '@app/i18n';

import { Navigate } from './navigate';
import { PageElement, type PageMetadata } from './page-element';

vi.mock('firebase/analytics', () => ({
  getAnalytics: vi.fn(() => ({ app: { name: 'test-app' } })),
  logEvent: vi.fn(),
}));

@customElement('test-page')
class TestPage extends PageElement {
  protected pageMetadata: PageMetadata = {
    title: 'Test Page',
    description: 'Test Description',
  };

  protected override render(): TemplateResult {
    return html`<div>Test Content</div>`;
  }
}

@customElement('test-page-custom')
class TestPageCustom extends PageElement {
  static override styles: CSSResultGroup = [
    PageElement.styles,
    css`
      :host {
        display: flex;
        align-items: center;
      }
    `,
  ];

  protected override render(): TemplateResult {
    return html`<div>Custom Layout</div>`;
  }
}

@customElement('test-page-translated')
class TestPageTranslated extends PageElement {
  protected pageMetadata: PageMetadata = {
    translations: {
      en: { greeting: 'Hello' },
      ja: { greeting: 'こんにちは' },
    },
  };

  public exposeTrans(code: string): string {
    return this.trans(code);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'test-page': TestPage;
    'test-page-custom': TestPageCustom;
    'test-page-translated': TestPageTranslated;
  }
}

describe('Page', () => {
  let container: HTMLElement;
  let mockRouter: Router;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    mockRouter = {
      goto: vi.fn().mockResolvedValue(undefined),
    } as unknown as Router;
    LitShare.set('router', mockRouter);

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });

    if (!document.querySelector('meta[name="description"]')) {
      const desc = document.createElement('meta');
      desc.setAttribute('name', 'description');
      document.head.appendChild(desc);
    }
    if (!document.querySelector('meta[property="og:title"]')) {
      const ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    if (!document.querySelector('meta[property="og:description"]')) {
      const ogDesc = document.createElement('meta');
      ogDesc.setAttribute('property', 'og:description');
      document.head.appendChild(ogDesc);
    }
  });

  afterEach(() => {
    container.remove();
    clearPreferredLanguageCache();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('PageElement', () => {
    it('renders in shadow DOM', async () => {
      const element = document.createElement('test-page') as TestPage;
      container.appendChild(element);
      await element.updateComplete;

      const content = element.shadowRoot?.querySelector('div');
      expect(content?.textContent).toBe('Test Content');
      expect(element.shadowRoot).not.toBeNull();
    });

    it('registers shared host styles by default', async () => {
      const element = document.createElement('test-page') as TestPage;
      container.appendChild(element);
      await element.updateComplete;

      expect(TestPage.styles).toBe(PageElement.styles);
      expect(element.shadowRoot).not.toBeNull();
    });

    it('allows custom host styles to extend defaults', async () => {
      const element = document.createElement('test-page-custom') as TestPageCustom;
      container.appendChild(element);
      await element.updateComplete;

      expect(TestPageCustom.styles).not.toBe(PageElement.styles);
      expect(element.shadowRoot).not.toBeNull();
    });

    it('sets page metadata on connection', async () => {
      const element = document.createElement('test-page') as TestPage;
      container.appendChild(element);
      await element.updateComplete;

      expect(document.title).toBe('Test Page');
      expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe('Test Description');
      expect(document.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe('Test Page');
      expect(document.querySelector('meta[property="og:description"]')?.getAttribute('content')).toBe(
        'Test Description'
      );
    });

    it('handles missing metadata gracefully', async () => {
      const element = document.createElement('test-page-custom') as TestPageCustom;
      container.appendChild(element);
      await element.updateComplete;

      expect(element).toBeDefined();
    });

    it('calls Navigate.to when navigateTo is called', async () => {
      const navigateToSpy = vi.spyOn(Navigate, 'to').mockResolvedValue();

      const element = document.createElement('test-page') as TestPage;
      container.appendChild(element);
      await element.updateComplete;

      await (element as unknown as { navigateTo: (path: string) => Promise<void> }).navigateTo('/test-path/');

      expect(navigateToSpy).toHaveBeenCalledWith('/test-path/', undefined);
      navigateToSpy.mockRestore();
    });

    it('passes state to Navigate.to', async () => {
      const navigateToSpy = vi.spyOn(Navigate, 'to').mockResolvedValue();

      const element = document.createElement('test-page') as TestPage;
      container.appendChild(element);
      await element.updateComplete;

      const state = { foo: 'bar' };
      await (element as unknown as { navigateTo: (path: string, state?: unknown) => Promise<void> }).navigateTo(
        '/test-path/',
        state
      );

      expect(navigateToSpy).toHaveBeenCalledWith('/test-path/', state);
      navigateToSpy.mockRestore();
    });

    it('prefers page translations over global translations', async () => {
      setPreferredLanguage('en');

      const element = document.createElement('test-page-translated') as TestPageTranslated;
      container.appendChild(element);
      await element.updateComplete;

      expect(element.exposeTrans('greeting')).toBe('Hello');
    });

    it('falls back to global translations when page translation is missing', async () => {
      setPreferredLanguage('ja');

      const element = document.createElement('test-page-translated') as TestPageTranslated;
      container.appendChild(element);
      await element.updateComplete;

      expect(element.exposeTrans('cancel')).toBe('キャンセル');
    });

    it('returns the code when no translation is found', async () => {
      const element = document.createElement('test-page-translated') as TestPageTranslated;
      container.appendChild(element);
      await element.updateComplete;

      expect(element.exposeTrans('missing-code')).toBe('missing-code');
    });
  });

  describe('Navigate', () => {
    describe('Directive', () => {
      it('throws error when used in non-element context', () => {
        const partInfo = { type: PartType.ATTRIBUTE } as PartInfo;
        expect(() => new Navigate(partInfo)).toThrow('The `navigate` directive must be used in the element');
      });

      it('returns no rendered content from render', () => {
        const directive = new Navigate({ type: PartType.ELEMENT } as PartInfo);
        expect(directive.render('/test-path/')).toBeUndefined();
      });

      it('updates element pathname on update', async () => {
        const navigateToSpy = vi.spyOn(Navigate, 'to').mockResolvedValue();

        const button = document.createElement('button');
        container.appendChild(button);

        const directive = new Navigate({ type: PartType.ELEMENT } as PartInfo);
        const part = {
          element: button,
        } as unknown as ElementPart;

        directive.update(part, ['/test-path/']);

        button.click();
        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(navigateToSpy).toHaveBeenCalledWith('/test-path/');
        navigateToSpy.mockRestore();
      });

      it('does not update if props length is not 1', () => {
        const navigateToSpy = vi.spyOn(Navigate, 'to').mockResolvedValue();

        const button = document.createElement('button');
        container.appendChild(button);

        const directive = new Navigate({ type: PartType.ELEMENT } as PartInfo);
        const part = {
          element: button,
        } as unknown as ElementPart;

        directive.update(part, []);
        button.click();

        expect(navigateToSpy).not.toHaveBeenCalled();
        navigateToSpy.mockRestore();
      });

      it('disconnects event listener on disconnected', async () => {
        const navigateToSpy = vi.spyOn(Navigate, 'to').mockResolvedValue();

        const button = document.createElement('button');
        container.appendChild(button);

        const directive = new Navigate({ type: PartType.ELEMENT } as PartInfo);
        const part = {
          element: button,
        } as unknown as ElementPart;

        directive.update(part, ['/test-path/']);
        directive.disconnected();

        button.click();
        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(navigateToSpy).not.toHaveBeenCalled();
        navigateToSpy.mockRestore();
      });

      it('reconnects event listener on reconnected', async () => {
        const navigateToSpy = vi.spyOn(Navigate, 'to').mockResolvedValue();

        const button = document.createElement('button');
        container.appendChild(button);

        const directive = new Navigate({ type: PartType.ELEMENT } as PartInfo);
        const part = {
          element: button,
        } as unknown as ElementPart;

        directive.update(part, ['/test-path/']);
        directive.disconnected();
        directive.reconnected();

        button.click();
        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(navigateToSpy).toHaveBeenCalledWith('/test-path/');
        navigateToSpy.mockRestore();
      });
    });

    it('handles external URLs by opening in new tab', async () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      await Navigate.to('https://example.com');

      expect(windowOpenSpy).toHaveBeenCalledWith('https://example.com', '_blank');
    });

    it('handles http URLs by opening in new tab', async () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      await Navigate.to('http://example.com');

      expect(windowOpenSpy).toHaveBeenCalledWith('http://example.com', '_blank');
    });

    it('handles hash links by updating location hash', async () => {
      const originalHash = location.hash;
      location.hash = '';

      await Navigate.to('#test-section');

      expect(location.hash).toBe('#test-section');

      location.hash = originalHash;
    });

    it('scrolls to existing hash anchor when hash already set', async () => {
      const originalHash = location.hash;
      location.hash = '#test-anchor';

      const testDiv = document.createElement('div');
      testDiv.id = 'test-anchor';
      testDiv.style.position = 'absolute';
      testDiv.style.top = '1000px';
      document.body.appendChild(testDiv);

      const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {
        /* Mock scrollTo to prevent actual scrolling in tests */
      });

      await Navigate.to('#test-anchor');

      expect(scrollToSpy).toHaveBeenCalled();

      testDiv.remove();
      location.hash = originalHash;
    });

    it('handles internal navigation with history API', async () => {
      const originalPathname = window.location.pathname;
      const pushStateSpy = vi.spyOn(history, 'pushState');
      const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {
        /* Mock scrollTo to prevent actual scrolling in tests */
      });

      await Navigate.to('/test-page/');

      expect(pushStateSpy).toHaveBeenCalledWith(undefined, '', '/test-page/');
      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'instant' });
      expect(mockRouter.goto).toHaveBeenCalledWith('/test-page/');

      history.pushState(null, '', originalPathname);
    });

    it('passes state to history API', async () => {
      const originalPathname = window.location.pathname;
      const pushStateSpy = vi.spyOn(history, 'pushState');
      vi.spyOn(window, 'scrollTo').mockImplementation(() => {
        /* Mock scrollTo to prevent actual scrolling in tests */
      });

      const state = { from: 'test' };
      await Navigate.to('/test-page/', state);

      expect(pushStateSpy).toHaveBeenCalledWith(state, '', '/test-page/');

      history.pushState(null, '', originalPathname);
    });

    it('normalizes pathname with trailing slash', async () => {
      const originalPathname = window.location.pathname;
      const pushStateSpy = vi.spyOn(history, 'pushState');
      vi.spyOn(window, 'scrollTo').mockImplementation(() => {
        /* Mock scrollTo to prevent actual scrolling in tests */
      });

      await Navigate.to('/test-page');

      expect(pushStateSpy).toHaveBeenCalledWith(undefined, '', '/test-page/');

      history.pushState(null, '', originalPathname);
    });

    it('normalizes pathname with query parameters', async () => {
      const originalPathname = window.location.pathname;
      const pushStateSpy = vi.spyOn(history, 'pushState');
      vi.spyOn(window, 'scrollTo').mockImplementation(() => {
        /* Mock scrollTo to prevent actual scrolling in tests */
      });

      await Navigate.to('/test-page?foo=bar');

      expect(pushStateSpy).toHaveBeenCalledWith(undefined, '', '/test-page/');

      history.pushState(null, '', originalPathname);
    });

    it('normalizes pathname with hash', async () => {
      const originalPathname = window.location.pathname;
      const pushStateSpy = vi.spyOn(history, 'pushState');
      vi.spyOn(window, 'scrollTo').mockImplementation(() => {
        /* Mock scrollTo to prevent actual scrolling in tests */
      });

      await Navigate.to('/test-page#section');

      expect(pushStateSpy).toHaveBeenCalledWith(undefined, '', '/test-page/');

      history.pushState(null, '', originalPathname);
    });

    it('normalizes pathname with both query and hash', async () => {
      const originalPathname = window.location.pathname;
      const pushStateSpy = vi.spyOn(history, 'pushState');
      vi.spyOn(window, 'scrollTo').mockImplementation(() => {
        /* Mock scrollTo to prevent actual scrolling in tests */
      });

      await Navigate.to('/test-page?foo=bar#section');

      expect(pushStateSpy).toHaveBeenCalledWith(undefined, '', '/test-page/');

      history.pushState(null, '', originalPathname);
    });

    it('resolves relative paths starting with ./', async () => {
      const originalPathname = window.location.pathname;
      history.pushState(null, '', '/parent/current/');

      const pushStateSpy = vi.spyOn(history, 'pushState');
      vi.spyOn(window, 'scrollTo').mockImplementation(() => {
        /* Mock scrollTo to prevent actual scrolling in tests */
      });

      await Navigate.to('./sibling/');

      expect(pushStateSpy).toHaveBeenCalledWith(undefined, '', '/parent/current/sibling/');

      history.pushState(null, '', originalPathname);
    });

    it('resolves relative paths with ../', async () => {
      const originalPathname = window.location.pathname;
      history.pushState(null, '', '/parent/current/');

      const pushStateSpy = vi.spyOn(history, 'pushState');
      vi.spyOn(window, 'scrollTo').mockImplementation(() => {
        /* Mock scrollTo to prevent actual scrolling in tests */
      });

      await Navigate.to('../sibling/');

      expect(pushStateSpy).toHaveBeenCalledWith(undefined, '', '/parent/sibling/');

      history.pushState(null, '', originalPathname);
    });

    it('resolves multiple ../ in path', async () => {
      const originalPathname = window.location.pathname;
      history.pushState(null, '', '/a/b/c/d/');

      const pushStateSpy = vi.spyOn(history, 'pushState');
      vi.spyOn(window, 'scrollTo').mockImplementation(() => {
        /* Mock scrollTo to prevent actual scrolling in tests */
      });

      await Navigate.to('../../e/');

      expect(pushStateSpy).toHaveBeenCalledWith(undefined, '', '/a/b/e/');

      history.pushState(null, '', originalPathname);
    });

    it('scrolls to hash after navigation if hash in URL', async () => {
      const originalPathname = window.location.pathname;
      const originalHash = location.hash;

      history.pushState(null, '', '/test/');
      location.hash = '#target';

      const testDiv = document.createElement('div');
      testDiv.id = 'target';
      testDiv.style.position = 'absolute';
      testDiv.style.top = '1000px';
      document.body.appendChild(testDiv);

      const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {
        /* Mock scrollTo to prevent actual scrolling in tests */
      });

      await Navigate.to('/another/');

      expect(scrollToSpy).toHaveBeenCalled();
      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'instant' });

      testDiv.remove();
      history.pushState(null, '', originalPathname);
      location.hash = originalHash;
    });

    it('does not scroll if no hash in URL', async () => {
      const originalPathname = window.location.pathname;
      const originalHash = location.hash;
      location.hash = '';

      const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {
        /* Mock scrollTo to prevent actual scrolling in tests */
      });

      await Navigate.to('/test/');

      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'instant' });
      expect(scrollToSpy).toHaveBeenCalledTimes(1);

      history.pushState(null, '', originalPathname);
      location.hash = originalHash;
    });

    it('does not scroll if hash target not found', async () => {
      const originalPathname = window.location.pathname;
      const originalHash = location.hash;
      location.hash = '#nonexistent';

      const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {
        /* Mock scrollTo to prevent actual scrolling in tests */
      });

      await Navigate.to('/test/');

      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'instant' });

      history.pushState(null, '', originalPathname);
      location.hash = originalHash;
    });

    it('handles navigation without router', async () => {
      LitShare.set('router', null);

      const originalPathname = window.location.pathname;
      const pushStateSpy = vi.spyOn(history, 'pushState');
      vi.spyOn(window, 'scrollTo').mockImplementation(() => {
        /* Mock scrollTo to prevent actual scrolling in tests */
      });

      await Navigate.to('/test/');

      expect(pushStateSpy).toHaveBeenCalledWith(undefined, '', '/test/');

      LitShare.set('router', mockRouter);
      history.pushState(null, '', originalPathname);
    });

    it('does nothing when an existing hash target cannot be found', async () => {
      const originalHash = location.hash;
      location.hash = '#missing-anchor';

      const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {
        /* noop */
      });

      await Navigate.to('#missing-anchor');

      expect(scrollToSpy).not.toHaveBeenCalled();
      location.hash = originalHash;
    });
  });
});
