import { LitElement, html, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { PartType, type ElementPart, type PartInfo } from 'lit/directive.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TransitionDirective, transition } from './transition';

@customElement('test-transition-fixture')
class TestTransitionFixture extends LitElement {
  @property({ type: Boolean })
  visible = true;

  override render(): TemplateResult {
    return html`
      <div
        id="target"
        ${transition(this.visible ? 'enter' : 'leave', {
          enter: 'transition-opacity duration-300',
          enterFrom: 'opacity-0',
          enterTo: 'opacity-100',
          leave: 'transition-opacity duration-200',
          leaveFrom: 'opacity-100',
          leaveTo: 'opacity-0',
        })}
      >
        Content
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'test-transition-fixture': TestTransitionFixture;
  }
}

describe('transition directive', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });
  });

  afterEach(() => {
    container.remove();
    vi.restoreAllMocks();
  });

  it('applies enter classes on initial render', async () => {
    const element = document.createElement('test-transition-fixture') as TestTransitionFixture;
    container.appendChild(element);
    await element.updateComplete;

    const target = element.shadowRoot?.querySelector<HTMLElement>('#target');
    expect(target?.classList.contains('transition-opacity')).toBe(true);
    expect(target?.classList.contains('opacity-100')).toBe(true);
    expect(target?.classList.contains('hidden')).toBe(false);
  });

  it('applies hidden leave state on initial hidden render', async () => {
    const element = document.createElement('test-transition-fixture') as TestTransitionFixture;
    element.visible = false;
    container.appendChild(element);
    await element.updateComplete;

    const target = element.shadowRoot?.querySelector<HTMLElement>('#target');
    expect(target?.classList.contains('hidden')).toBe(true);
    expect(target?.classList.contains('opacity-0')).toBe(true);
  });

  it('hides the element after a leave transition completes', async () => {
    const element = document.createElement('test-transition-fixture') as TestTransitionFixture;
    container.appendChild(element);
    await element.updateComplete;

    const target = element.shadowRoot?.querySelector<HTMLElement>('#target');
    element.visible = false;
    await element.updateComplete;

    target?.dispatchEvent(new TransitionEvent('transitionend', { bubbles: true }));
    await Promise.resolve();

    expect(target?.classList.contains('hidden')).toBe(true);
    expect(target?.classList.contains('opacity-0')).toBe(true);
  });

  it('shows the element after an enter transition completes', async () => {
    const element = document.createElement('test-transition-fixture') as TestTransitionFixture;
    element.visible = false;
    container.appendChild(element);
    await element.updateComplete;

    const target = element.shadowRoot?.querySelector<HTMLElement>('#target');
    element.visible = true;
    await element.updateComplete;

    target?.dispatchEvent(new TransitionEvent('transitionend', { bubbles: true }));
    await Promise.resolve();

    expect(target?.classList.contains('hidden')).toBe(false);
    expect(target?.classList.contains('opacity-100')).toBe(true);
  });

  it('throws when constructed outside an element part', () => {
    const partInfo = { type: PartType.ATTRIBUTE } as PartInfo;
    expect(() => new TransitionDirective(partInfo)).toThrow('transition directive can only be used on elements');
  });

  it('tolerates empty class options without throwing', async () => {
    const directive = new TransitionDirective({ type: PartType.ELEMENT } as PartInfo);
    const host = document.createElement('div');
    const part = { element: host } as unknown as ElementPart;

    directive.update(part, ['enter', {}]);
    directive.update(part, ['leave', {}]);
    host.dispatchEvent(new TransitionEvent('transitionend', { bubbles: true }));
    await Promise.resolve();

    expect(host).toBeInstanceOf(HTMLDivElement);
  });
});
