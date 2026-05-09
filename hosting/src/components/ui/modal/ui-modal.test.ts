import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { proxyShadowQueries } from '@app/../test/query-shadow-root';

import type { UiModal } from './ui-modal';

import './ui-modal';

describe('UiModal', () => {
  let element: UiModal;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    element = proxyShadowQueries(document.createElement('ui-modal') as UiModal);
    container.appendChild(element);
  });

  afterEach(() => {
    container.remove();
  });

  it('renders with default properties', async () => {
    await element.updateComplete;
    expect(element).toBeDefined();
    expect(element.title).toBe('');
    expect(element.message).toBe('');
    expect(element.open).toBe(false);
    expect(element.icon).toBe('question');
    expect(element.confirmText).toBe('Confirm');
    expect(element.cancelText).toBe('Cancel');
    expect(element.size).toBe('sm');
  });

  it('renders modal with title and message', async () => {
    element.title = 'Delete Item';
    element.message = 'Are you sure you want to delete this item?';
    await element.updateComplete;

    const title = element.querySelector('h3');
    const message = element.querySelector('p');

    expect(title?.textContent?.trim()).toBe('Delete Item');
    expect(message?.textContent?.trim()).toBe('Are you sure you want to delete this item?');
  });

  it('opens modal when open property is set to true', async () => {
    element.open = true;
    await element.updateComplete;

    const dialog = element.querySelector('dialog');
    expect(dialog).toBeTruthy();
  });

  it('emits confirm event when confirm button is clicked', async () => {
    element.title = 'Confirm Action';
    element.message = 'Do you want to proceed?';
    element.open = true;
    await element.updateComplete;

    const confirmHandler = vi.fn();
    element.addEventListener('confirm', confirmHandler);

    const buttons = element.querySelectorAll('button');
    const confirmButton = Array.from(buttons).find((btn) => btn.textContent?.includes('Confirm'));
    confirmButton?.click();
    await element.updateComplete;

    expect(confirmHandler).toHaveBeenCalled();
    expect(element.open).toBe(true);
  });

  it('emits cancel event when cancel button is clicked', async () => {
    element.title = 'Confirm Action';
    element.message = 'Do you want to proceed?';
    element.open = true;
    await element.updateComplete;

    const cancelHandler = vi.fn();
    element.addEventListener('cancel', cancelHandler);

    const buttons = element.querySelectorAll('button');
    const cancelButton = Array.from(buttons).find((btn) => btn.textContent?.includes('Cancel'));
    cancelButton?.click();
    await element.updateComplete;

    expect(cancelHandler).toHaveBeenCalled();
    expect(element.open).toBe(true);
  });

  it('uses custom confirm and cancel text', async () => {
    element.confirmText = 'Delete';
    element.cancelText = 'Keep';
    element.open = true;
    await element.updateComplete;

    const buttons = element.querySelectorAll('button');
    const buttonTexts = Array.from(buttons).map((btn) => btn.textContent?.trim());

    expect(buttonTexts).toContain('Delete');
    expect(buttonTexts).toContain('Keep');
  });

  it('applies correct size class', async () => {
    element.size = 'lg';
    await element.updateComplete;

    const dialogContent = element.querySelector('div.max-w-lg');
    expect(dialogContent).toBeTruthy();
  });

  it('renders danger icon', async () => {
    element.icon = 'danger';
    element.open = true;
    await element.updateComplete;

    const iconContainer = element.querySelector('.bg-danger-100');
    expect(iconContainer).toBeTruthy();
  });

  it('renders warning icon', async () => {
    element.icon = 'warning';
    element.open = true;
    await element.updateComplete;

    const iconContainer = element.querySelector('.bg-warning-100');
    expect(iconContainer).toBeTruthy();
  });

  it('renders success icon', async () => {
    element.icon = 'success';
    element.open = true;
    await element.updateComplete;

    const iconContainer = element.querySelector('.bg-success-100');
    expect(iconContainer).toBeTruthy();
  });

  it('renders info icon', async () => {
    element.icon = 'info';
    element.open = true;
    await element.updateComplete;

    const iconContainer = element.querySelector('.bg-primary-100');
    expect(iconContainer).toBeTruthy();
  });

  it('renders question icon by default', async () => {
    element.open = true;
    await element.updateComplete;

    const iconContainer = element.querySelector('.bg-primary-100');
    expect(iconContainer).toBeTruthy();
  });

  it('emits cancel event on backdrop click', async () => {
    element.open = true;
    await element.updateComplete;

    const cancelHandler = vi.fn();
    element.addEventListener('cancel', cancelHandler);

    const dialog = element.querySelector('dialog');
    dialog?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await element.updateComplete;

    expect(cancelHandler).toHaveBeenCalled();
  });
});
