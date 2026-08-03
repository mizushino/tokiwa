import { html, render, type TemplateResult } from 'lit';

import { tGlobal } from '@app/i18n';

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
        renderModal();
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
          .message=${message}
          icon=${icon}
          confirmText=${tGlobal('confirm')}
          cancelText=${tGlobal('cancel')}
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

async function prompt(
  title: string,
  message: string | TemplateResult,
  icon?: 'question' | 'danger' | 'warning',
  validator?: (value: string) => string | null
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
      renderModal();
      setTimeout(() => {
        resolve(inputValue);
        cleanup();
      }, 300);
    };

    const handleCancel = (): void => {
      if (!isResolved) {
        isResolved = true;
        isOpen = false;
        renderModal();
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
          .message=${message}
          icon=${actualIcon}
          confirmText=${tGlobal('confirm')}
          cancelText=${tGlobal('cancel')}
          .showInput=${true}
          .inputValue=${inputValue}
          .inputError=${inputError}
          .open=${isOpen}
          @input=${handleInputChange}
          @confirm=${handleConfirm}
          @cancel=${handleCancel}
        ></ui-modal>
      `;
      render(template, container);
    };

    renderModal();
  });
}

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
  const keywordMessage = tGlobal('confirm_keyword_message');
  const keywordPlaceholderIndex = keywordMessage.indexOf('{keyword}');
  const fullMessage =
    keywordPlaceholderIndex === -1
      ? html`${message}<br /><br />${keywordMessage}`
      : html`${message}<br /><br />${keywordMessage.slice(0, keywordPlaceholderIndex)}<span class=${keywordClass}
            >${keyword}</span
          >${keywordMessage.slice(keywordPlaceholderIndex + '{keyword}'.length)}`;

  const icon = variant === 'success' ? 'warning' : 'danger';

  const result = await prompt(title, fullMessage, icon, (value) => {
    if (normalizeKeyword(value) !== normalizedKeyword) {
      return tGlobal('confirm_keyword_error').replace('{keyword}', keyword);
    }
    return null;
  });
  return result !== null && normalizeKeyword(result) === normalizedKeyword;
}

export const Modal = { success, info, error, confirm, prompt, confirmWithInput };
