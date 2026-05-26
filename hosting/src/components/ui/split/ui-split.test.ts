import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { proxyShadowQueries } from '@app/../test/query-shadow-root';

import { type UiSplit } from './ui-split';

import './ui-split';

type TestableUiSplit = UiSplit & {
  isDragging: boolean;
  pendingSize: number | null;
  finalizeDrag(): void;
};

describe('UiSplit', () => {
  let container: HTMLDivElement;
  let parent: HTMLDivElement;
  let previousPanel: HTMLDivElement;
  let nextPanel: HTMLDivElement;
  let element: UiSplit;

  beforeEach(() => {
    container = document.createElement('div');
    parent = document.createElement('div');
    previousPanel = document.createElement('div');
    nextPanel = document.createElement('div');

    document.body.appendChild(container);
    container.appendChild(parent);

    element = proxyShadowQueries(document.createElement('ui-split') as UiSplit);

    parent.appendChild(previousPanel);
    parent.appendChild(element);
    parent.appendChild(nextPanel);
  });

  afterEach(() => {
    container.remove();
  });

  it('renders as a horizontal split by default', async () => {
    await element.updateComplete;

    const frame = element.querySelector('div.relative');
    const handle = element.querySelector('.z-10');

    expect(element.direction).toBe('horizontal');
    expect(frame?.className).toContain('h-full');
    expect(frame?.className).toContain('w-4');
    expect(handle?.className).toContain('cursor-ew-resize');
  });

  it('renders vertical resize handles when direction is vertical', async () => {
    element.direction = 'vertical';
    await element.updateComplete;

    const frame = element.querySelector('div.relative');
    const handle = element.querySelector('.z-10');

    expect(frame?.className).toContain('h-4');
    expect(frame?.className).toContain('w-full');
    expect(handle?.className).toContain('cursor-ns-resize');
  });

  it('sets width on the previous panel', async () => {
    await element.updateComplete;

    element.setWidth(320);

    expect(previousPanel.style.width).toBe('320px');
  });

  it('sets height on the previous panel', async () => {
    element.direction = 'vertical';
    await element.updateComplete;

    element.setHeight(240);

    expect(previousPanel.style.height).toBe('240px');
  });

  it('commits the pending width and emits a change event on finalize', async () => {
    await element.updateComplete;

    const split = element as TestableUiSplit;
    const changes: { width?: number; height?: number }[] = [];

    element.addEventListener('change', (event) => {
      changes.push((event as CustomEvent<{ width?: number; height?: number }>).detail);
    });

    split.isDragging = true;
    split.pendingSize = 360;
    split.finalizeDrag();

    expect(previousPanel.style.width).toBe('360px');
    expect(changes).toEqual([{ width: 360 }]);
  });
});
