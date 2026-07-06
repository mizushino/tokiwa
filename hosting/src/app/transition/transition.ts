import { AsyncDirective, directive, type PartInfo, PartType } from 'lit/async-directive.js';
import type { ElementPart } from 'lit/directive.js';

/**
 * Transition directive for animating elements.
 *
 * Usage:
 * ```ts
 * html`
 *   <div ${transition(this.isVisible ? 'enter' : 'leave', {
 *     enter: 'transition-opacity duration-300 ease-out',
 *     enterFrom: 'opacity-0',
 *     enterTo: 'opacity-100',
 *     leave: 'transition-opacity duration-200 ease-in',
 *     leaveFrom: 'opacity-100',
 *     leaveTo: 'opacity-0',
 *   })}>
 *     Content
 *   </div>
 * `
 * ```
 */

export interface TransitionOptions {
  enter?: string;
  enterFrom?: string;
  enterTo?: string;
  leave?: string;
  leaveFrom?: string;
  leaveTo?: string;
}

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

/** Shared overlay chrome for the native-dialog components (ui-dialog, ui-modal). */
export const overlayDialogClasses =
  'fixed inset-0 size-auto max-h-none max-w-none overflow-y-auto border-0 bg-transparent p-0';

export const overlayBackdropClasses = 'fixed inset-0 bg-gray-500/75 dark:bg-gray-900/50';

export const overlayPanelClasses =
  'relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl sm:my-8 sm:w-full sm:p-6 dark:bg-gray-800 dark:outline dark:-outline-offset-1 dark:outline-white/10';

/** Must match the duration-200 leave transitions above; overlays delay close() until the leave finishes. */
export const overlayLeaveDurationMs = 200;

export class TransitionDirective extends AsyncDirective {
  private element?: HTMLElement;
  private currentDirection: 'enter' | 'leave' | null = null;
  private initialized = false;
  private transitionHandler?: (event: TransitionEvent) => void;

  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (partInfo.type !== PartType.ELEMENT) {
      throw new Error('transition directive can only be used on elements');
    }
  }

  override render(_direction: 'enter' | 'leave', _options: TransitionOptions): void {
    return;
  }

  override update(
    part: ElementPart,
    [direction, options]: [direction: 'enter' | 'leave', options: TransitionOptions]
  ): void {
    this.element = part.element as HTMLElement;

    if (!this.initialized) {
      this.applyInitialState(direction, options);
      this.initialized = true;
    } else if (direction !== this.currentDirection) {
      void this.transition(direction, options);
    }
  }

  private applyInitialState(direction: 'enter' | 'leave', options: TransitionOptions): void {
    if (!this.element) return;

    this.currentDirection = direction;

    if (direction === 'enter') {
      this.applyClasses(options.enter);
      this.applyClasses(options.enterTo);
    } else {
      this.element.classList.add('hidden');
      this.applyClasses(options.leave);
      this.applyClasses(options.leaveTo);
    }
  }

  private async transition(direction: 'enter' | 'leave', options: TransitionOptions): Promise<void> {
    if (!this.element) return;

    if (this.transitionHandler) {
      this.element.removeEventListener('transitionend', this.transitionHandler);
      this.transitionHandler = undefined;
    }

    this.currentDirection = direction;

    if (direction === 'enter') {
      this.element.classList.remove('hidden');

      this.removeClasses(options.leave);
      this.removeClasses(options.leaveFrom);
      this.removeClasses(options.leaveTo);

      this.applyClasses(options.enter);
      this.applyClasses(options.enterFrom);

      await this.nextFrame();

      this.removeClasses(options.enterFrom);
      this.applyClasses(options.enterTo);

      await this.waitForTransition();
    } else {
      this.removeClasses(options.enter);
      this.removeClasses(options.enterFrom);
      this.removeClasses(options.enterTo);

      this.applyClasses(options.leave);
      this.applyClasses(options.leaveFrom);

      await this.nextFrame();

      this.removeClasses(options.leaveFrom);
      this.applyClasses(options.leaveTo);

      await this.waitForTransition();

      this.element.classList.add('hidden');
    }
  }

  private nextFrame(): Promise<void> {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });
  }

  private waitForTransition(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.element) {
        resolve();
        return;
      }

      this.transitionHandler = (event: TransitionEvent): void => {
        if (this.element && this.transitionHandler) {
          this.element.removeEventListener('transitionend', this.transitionHandler);
          this.transitionHandler = undefined;
        }
        event.stopPropagation();
        resolve();
      };

      this.element.addEventListener('transitionend', this.transitionHandler);
    });
  }

  private applyClasses(classString?: string): void {
    if (!this.element || !classString) return;
    const classes = classString.split(' ').filter((c) => c.trim());
    this.element.classList.add(...classes);
  }

  private removeClasses(classString?: string): void {
    if (!this.element || !classString) return;
    const classes = classString.split(' ').filter((c) => c.trim());
    this.element.classList.remove(...classes);
  }
}

export const transition = directive(TransitionDirective);
