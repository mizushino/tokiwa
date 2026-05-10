import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { proxyShadowQueries } from '@app/../test/query-shadow-root';

import type { UiDialog } from './ui-dialog';

import './ui-dialog';

describe('UiDialog', () => {
  let element: UiDialog;
  let container: HTMLElement;
  let showModalSpy: ReturnType<typeof vi.spyOn>;
  let closeSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    element = proxyShadowQueries(document.createElement('ui-dialog') as UiDialog);
    container.appendChild(element);
    showModalSpy = vi.spyOn(HTMLDialogElement.prototype, 'showModal').mockImplementation(() => undefined);
    closeSpy = vi.spyOn(HTMLDialogElement.prototype, 'close').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
    expect(showModalSpy).toHaveBeenCalled();
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

  it('supports xl and full size classes', async () => {
    element.size = 'xl';
    await element.updateComplete;
    expect(element.querySelector('div.max-w-xl')).toBeTruthy();

    element.size = 'full';
    await element.updateComplete;
    expect(element.querySelector('div.max-w-full')).toBeTruthy();
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

  it('closes after the leave delay when open is set to false', async () => {
    vi.useFakeTimers();

    element.open = true;
    await element.updateComplete;
    element.open = false;
    await element.updateComplete;

    vi.advanceTimersByTime(200);

    expect(closeSpy).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('closes only when both pointer events target the backdrop', async () => {
    element.open = true;
    await element.updateComplete;

    const dialog = element.querySelector('dialog');
    const closeHandler = vi.fn();
    element.addEventListener('close', closeHandler);

    dialog?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    dialog?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(closeHandler).toHaveBeenCalledTimes(1);
  });

  it('does not close when the pointer started inside the panel', async () => {
    element.open = true;
    await element.updateComplete;

    const dialog = element.querySelector('dialog');
    const panel = element.querySelector('div.max-w-md');
    const closeHandler = vi.fn();
    element.addEventListener('close', closeHandler);

    panel?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    dialog?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(closeHandler).not.toHaveBeenCalled();
  });
});
