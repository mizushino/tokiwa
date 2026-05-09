import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { UiDialog } from './ui-dialog';

import './ui-dialog';

describe('UiDialog', () => {
  let element: UiDialog;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    element = document.createElement('ui-dialog') as UiDialog;
    container.appendChild(element);
  });

  afterEach(() => {
    container.remove();
  });

  it('renders with default properties', async () => {
    await element.updateComplete;
    expect(element).toBeDefined();
    expect(element.title).toBe('');
    expect(element.open).toBe(false);
    expect(element.size).toBe('md');
  });

  it('renders dialog with title', async () => {
    element.title = 'Test Dialog';
    await element.updateComplete;

    const title = element.querySelector('h3');
    expect(title?.textContent).toBe('Test Dialog');
  });

  it('opens dialog when open property is set to true', async () => {
    element.open = true;
    await element.updateComplete;

    const dialog = element.querySelector('dialog');
    expect(dialog).toBeTruthy();
  });

  it('emits close event when close button is clicked', async () => {
    element.open = true;
    await element.updateComplete;

    const closeHandler = vi.fn();
    element.addEventListener('close', closeHandler);

    const closeButton = element.querySelector('button');
    closeButton?.click();
    await element.updateComplete;

    expect(closeHandler).toHaveBeenCalled();
    expect(element.open).toBe(false);
  });

  it('applies correct size class', async () => {
    element.size = 'lg';
    await element.updateComplete;

    const dialogContent = element.querySelector('div.max-w-lg');
    expect(dialogContent).toBeTruthy();
  });

  it('renders slots for content and actions', async () => {
    const content = document.createElement('div');
    content.slot = 'content';
    content.textContent = 'Dialog content';
    element.appendChild(content);

    const actions = document.createElement('div');
    actions.slot = 'actions';
    actions.textContent = 'Dialog actions';
    element.appendChild(actions);

    await element.updateComplete;

    expect(element.querySelector('[slot="content"]')).toBeTruthy();
    expect(element.querySelector('[slot="actions"]')).toBeTruthy();
  });
});
