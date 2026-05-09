import { html, render } from 'lit';

import type { ModalButton, ModalIcon } from './ui-modal';
import './ui-modal';

// Modal API as plain object with functions
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
        renderModal(); // Re-render to trigger close animation
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

// Success alert (OK button only)
async function success(title: string, message?: string): Promise<void> {
  const actualTitle = message ? title : '';
  const actualMessage = message ? message : title;
  await open('success', actualTitle, actualMessage, [{ label: 'OK', value: 'ok', variant: 'primary' }]);
}

// Info alert (OK button only)
async function info(title: string, message?: string): Promise<void> {
  const actualTitle = message ? title : '';
  const actualMessage = message ? message : title;
  await open('info', actualTitle, actualMessage, [{ label: 'OK', value: 'ok', variant: 'primary' }]);
}

// Error alert (OK button only)
async function error(title: string, message?: string): Promise<void> {
  const actualTitle = message ? title : '';
  const actualMessage = message ? message : title;
  await open('danger', actualTitle, actualMessage, [{ label: 'OK', value: 'ok', variant: 'primary' }]);
}

// Generic confirm (Yes/No buttons)
async function confirm(title: string, message?: string, icon?: 'question' | 'danger' | 'warning'): Promise<boolean> {
  const actualTitle = message ? title : '';
  const actualMessage = message ? message : title;
  const actualIcon = icon || 'question';
  const result = await open(actualIcon, actualTitle, actualMessage, undefined);
  return !!result;
}

// Prompt dialog (input field with OK/Cancel buttons)
// validator: optional function that returns error message or null if valid
// useHtml: if true, message is rendered as HTML (for emphasis styling)
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
      // Clear error when user types
      if (inputError) {
        inputError = '';
        renderModal();
      }
    };

    const handleConfirm = (): void => {
      if (isResolved) return;

      // Run validation if provided
      if (validator) {
        const validationError = validator(inputValue);
        if (validationError) {
          inputError = validationError;
          renderModal();
          return; // Don't close, show error
        }
      }

      isResolved = true;
      isOpen = false;
      renderModal(); // Re-render to trigger close animation
      setTimeout(() => {
        resolve(inputValue);
        cleanup();
      }, 300);
    };

    const handleCancel = (): void => {
      if (!isResolved) {
        isResolved = true;
        isOpen = false;
        renderModal(); // Re-render to trigger close animation
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
 * Example:
 * ```ts
 * const confirmed = await Modal.confirmWithInput(
 *   '権限の剥奪',
 *   '<span class="font-semibold text-gray-900 dark:text-white">田中太郎</span> の権限を<span class="font-semibold text-danger-600 dark:text-danger-400">剥奪</span>します。',
 *   '剥奪',
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
  // 「剥」の異体字対応: 剥(U+5265) と 剝(U+525D) を相互に許容
  const normalizeKeyword = (text: string): string => {
    return text.replace(/[剥剝]/g, '剥');
  };

  const normalizedKeyword = normalizeKeyword(keyword);

  // キーワードを強調表示（付与系=緑、削除系=赤）
  const keywordClass =
    variant === 'success'
      ? 'font-semibold text-success-600 dark:text-success-400'
      : 'font-semibold text-danger-600 dark:text-danger-400';
  const keywordHtml = `<span class="${keywordClass}">${keyword}</span>`;
  // HTMLモードでは<br>を使用（\nはpre-wrapで大きな空白になる）
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
    true // useHtml
  );
  return result !== null && normalizeKeyword(result) === normalizedKeyword;
}

export const Modal = { open, success, info, error, confirm, prompt, confirmWithInput };
