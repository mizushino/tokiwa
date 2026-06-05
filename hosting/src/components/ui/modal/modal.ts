import { html, render } from 'lit';

import type { ModalButton, ModalIcon } from './ui-modal';
import './ui-modal';

/**
 * Programmatic modal helpers for alerts, confirmations, and prompt flows.
 *
 * Usage:
 * ```ts
 * await Modal.success('Saved');
 * const confirmed = await Modal.confirm('Delete?', 'This cannot be undone', 'danger');
 * const keyword = await Modal.prompt('Rename', 'Enter the new name');
 * ```
 */
function open(icon: ModalIcon, title: string, message: string, buttons?: ModalButton[]): Promise<boolean | string> {
  return new Promise((resolve) => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    let isResolved = false;
    let isOpen = true;

    const closeAndResolve = (value: boolean | string): void => {
      if (!isResolved) {
        isResolved = true;
        isOpen = false;
        renderModal(); // Re-render to trigger the close transition.
        setTimeout(() => {
          resolve(value);
          cleanup();
        }, 300);
      }
    };

    const handleButtonClick = (e: CustomEvent): void => {
      closeAndResolve(e.detail.value);
    };

    const handleConfirm = (): void => {
      closeAndResolve(true);
    };

    const handleCancel = (): void => {
      closeAndResolve(false);
    };

    const cleanup = (): void => {
      render(html``, container);
      container.remove();
    };

    const renderModal = (): void => {
      const template = html`
        <ui-modal
          title=${title}
          message=${message}
          icon=${icon}
          .buttons=${buttons}
          .open=${isOpen}
          @button-click=${handleButtonClick}
          @confirm=${handleConfirm}
          @cancel=${handleCancel}
        ></ui-modal>
      `;
      render(template, container);
    };

    renderModal();
  });
}

async function success(title: string, message?: string): Promise<void> {
  const actualTitle = message ? title : '';
  const actualMessage = message ? message : title;
  await open('success', actualTitle, actualMessage, [{ label: 'OK', value: 'ok', variant: 'primary' }]);
}

async function info(title: string, message?: string): Promise<void> {
  const actualTitle = message ? title : '';
  const actualMessage = message ? message : title;
  await open('info', actualTitle, actualMessage, [{ label: 'OK', value: 'ok', variant: 'primary' }]);
}

async function error(title: string, message?: string): Promise<void> {
  const actualTitle = message ? title : '';
  const actualMessage = message ? message : title;
  await open('danger', actualTitle, actualMessage, [{ label: 'OK', value: 'ok', variant: 'primary' }]);
}

async function confirm(title: string, message?: string, icon?: 'question' | 'danger' | 'warning'): Promise<boolean> {
  const actualTitle = message ? title : '';
  const actualMessage = message ? message : title;
  const actualIcon = icon || 'question';
  const result = await open(actualIcon, actualTitle, actualMessage, undefined);
  return !!result;
}

/**
 * Show a prompt dialog with optional validation.
 *
 * Usage:
 * ```ts
 * const value = await Modal.prompt('Project name', 'Enter a display name', 'question');
 * ```
 */
async function prompt(
  title: string,
  message: string,
  icon?: 'question' | 'danger' | 'warning',
  validator?: (value: string) => string | null,
  useHtml = false
): Promise<string | null> {
  return new Promise((resolve) => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    let isResolved = false;
    let inputValue = '';
    let inputError = '';
    let isOpen = true;

    const handleInputChange = (e: CustomEvent): void => {
      inputValue = e.detail.value;
      if (inputError) {
        inputError = '';
        renderModal();
      }
    };

    const handleConfirm = (): void => {
      if (isResolved) return;

      if (validator) {
        const validationError = validator(inputValue);
        if (validationError) {
          inputError = validationError;
          renderModal();
          return;
        }
      }

      isResolved = true;
      isOpen = false;
      renderModal(); // Re-render to trigger the close transition.
      setTimeout(() => {
        resolve(inputValue);
        cleanup();
      }, 300);
    };

    const handleCancel = (): void => {
      if (!isResolved) {
        isResolved = true;
        isOpen = false;
        renderModal(); // Re-render to trigger the close transition.
        setTimeout(() => {
          resolve(null);
          cleanup();
        }, 300);
      }
    };

    const cleanup = (): void => {
      render(html``, container);
      container.remove();
    };

    const actualIcon = icon || 'warning';

    const renderModal = (): void => {
      const template = html`
        <ui-modal
          title=${title}
          message=${message}
          icon=${actualIcon}
          .showInput=${true}
          .inputValue=${inputValue}
          .inputError=${inputError}
          .useHtml=${useHtml}
          .open=${isOpen}
          @input-change=${handleInputChange}
          @confirm=${handleConfirm}
          @cancel=${handleCancel}
        ></ui-modal>
      `;
      render(template, container);
    };

    renderModal();
  });
}

/**
 * Confirm dialog with keyword input verification.
 * User must type the exact keyword to enable the confirm button.
 *
 * @param title - Dialog title
 * @param message - Dialog message (can include HTML for emphasis)
 * @param keyword - The keyword user must type to confirm
 * @param variant - Color variant: 'danger' for red (revoke/delete), 'success' for green (grant/add)
 * @returns true if confirmed, false if cancelled
 *
 * Usage:
 * ```ts
 * const confirmed = await Modal.confirmWithInput(
 *   'Revoke access',
 *   '<span class="font-semibold text-gray-900 dark:text-white">Jane Doe</span> will have <span class="font-semibold text-danger-600 dark:text-danger-400">access revoked</span>.',
 *   'REVOKE',
 *   'danger'
 * );
 * ```
 */
async function confirmWithInput(
  title: string,
  message: string,
  keyword: string,
  variant: 'danger' | 'success' = 'danger'
): Promise<boolean> {
  const normalizeKeyword = (text: string): string => {
    return text.replace(/[剥剝]/g, '剥');
  };

  const normalizedKeyword = normalizeKeyword(keyword);

  const keywordClass =
    variant === 'success'
      ? 'font-semibold text-success-600 dark:text-success-400'
      : 'font-semibold text-danger-600 dark:text-danger-400';
  const keywordHtml = `<span class="${keywordClass}">${keyword}</span>`;
  const fullMessage = `${message}<br><br>確認のため${keywordHtml}と入力してください。`;

  const icon = variant === 'success' ? 'warning' : 'danger';

  const result = await prompt(
    title,
    fullMessage,
    icon,
    (value) => {
      if (normalizeKeyword(value) !== normalizedKeyword) {
        return `「${keyword}」と入力してください`;
      }
      return null;
    },
    true // Render the emphasized keyword as HTML.
  );
  return result !== null && normalizeKeyword(result) === normalizedKeyword;
}

export const Modal = { open, success, info, error, confirm, prompt, confirmWithInput };
