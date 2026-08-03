import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { Modal } from './modal';
import type { UiModal } from './ui-modal';

describe('Modal', () => {
  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  it('renders a confirmation keyword as text', async () => {
    vi.useFakeTimers();
    const keyword = '<img src=x onerror=alert(1)>';
    const resultPromise = Modal.confirmWithInput('Delete project', 'This action cannot be undone.', keyword);
    const modal = document.querySelector('ui-modal') as UiModal;

    await modal.updateComplete;

    expect(modal.shadowRoot?.querySelector('img')).toBeNull();
    expect(modal.shadowRoot?.textContent).toContain(keyword);

    modal.dispatchEvent(new CustomEvent('cancel'));
    await vi.advanceTimersByTimeAsync(300);
    await expect(resultPromise).resolves.toBe(false);
  });
});
