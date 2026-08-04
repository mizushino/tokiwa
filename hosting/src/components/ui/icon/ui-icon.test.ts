import { CircleCheck, X } from 'lucide';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';

import type { UiIcon } from './ui-icon';

import './ui-icon';

describe('UiIcon', () => {
  let element: UiIcon;

  beforeEach(() => {
    element = document.createElement('ui-icon');
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  });

  it('renders a Lucide icon with accessible decorative defaults', async () => {
    element.icon = CircleCheck;
    await element.updateComplete;

    const svg = element.shadowRoot?.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getAttribute('focusable')).toBe('false');
    expect(svg?.getAttribute('width')).toBe('100%');
    expect(svg?.querySelectorAll('path').length).toBeGreaterThan(0);
  });

  it('updates the icon and stroke width', async () => {
    element.icon = CircleCheck;
    await element.updateComplete;
    const initialMarkup = element.shadowRoot?.innerHTML;

    element.icon = X;
    element.strokeWidth = 1.5;
    await element.updateComplete;

    expect(element.shadowRoot?.innerHTML).not.toBe(initialMarkup);
    expect(element.shadowRoot?.querySelector('svg')?.getAttribute('stroke-width')).toBe('1.5');
  });
});
