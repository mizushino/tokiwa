import type { TransitionOptions } from './transition';

/**
 * Shared overlay chrome for the native-dialog components (ui-dialog, ui-modal).
 */

export const overlayBackdropTransition: TransitionOptions = {
  enter: 'transition-opacity duration-300 ease-out',
  enterFrom: 'opacity-0',
  enterTo: 'opacity-100',
  leave: 'transition-opacity duration-200 ease-in',
  leaveFrom: 'opacity-100',
  leaveTo: 'opacity-0',
};

export const overlayPanelTransition: TransitionOptions = {
  enter: 'transition-all duration-300 ease-out',
  enterFrom: 'translate-y-4 opacity-0 sm:scale-95',
  enterTo: 'translate-y-0 opacity-100 sm:scale-100',
  leave: 'transition-all duration-200 ease-in',
  leaveFrom: 'translate-y-0 opacity-100 sm:scale-100',
  leaveTo: 'translate-y-4 opacity-0 sm:scale-95',
};

export const overlayDialogClasses =
  'fixed inset-0 size-auto max-h-none max-w-none overflow-y-auto border-0 bg-transparent p-0';

export const overlayBackdropClasses = 'fixed inset-0 bg-gray-500/75 dark:bg-gray-900/50';

export const overlayPanelClasses =
  'relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl sm:my-8 sm:w-full sm:p-6 dark:bg-gray-800 dark:outline dark:-outline-offset-1 dark:outline-white/10';

export const overlayTitleClasses = 'text-base font-semibold text-gray-900 dark:text-white';

/** Must match the duration-200 leave transitions above; overlays delay close() until the leave finishes. */
export const overlayLeaveDurationMs = 200;
