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

interface TransitionOptions {
  enter?: string;
  enterFrom?: string;
  enterTo?: string;
  leave?: string;
  leaveFrom?: string;
  leaveTo?: string;
}

class TransitionDirective extends AsyncDirective {
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
    // Rendering is handled in update
  }

  override update(
    part: ElementPart,
    [direction, options]: [direction: 'enter' | 'leave', options: TransitionOptions]
  ): void {
    this.element = part.element as HTMLElement;

    if (!this.initialized) {
      // Initial state without animation
      this.applyInitialState(direction, options);
      this.initialized = true;
    } else if (direction !== this.currentDirection) {
      // Direction changed, start transition
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

    // Clean up any existing transition listener
    if (this.transitionHandler) {
      this.element.removeEventListener('transitionend', this.transitionHandler);
      this.transitionHandler = undefined;
    }

    this.currentDirection = direction;

    if (direction === 'enter') {
      // Show element
      this.element.classList.remove('hidden');

      // Remove leave classes
      this.removeClasses(options.leave);
      this.removeClasses(options.leaveFrom);
      this.removeClasses(options.leaveTo);

      // Apply enter transition
      this.applyClasses(options.enter);
      this.applyClasses(options.enterFrom);

      await this.nextFrame();

      this.removeClasses(options.enterFrom);
      this.applyClasses(options.enterTo);

      await this.waitForTransition();
    } else {
      // Remove enter classes
      this.removeClasses(options.enter);
      this.removeClasses(options.enterFrom);
      this.removeClasses(options.enterTo);

      // Apply leave transition
      this.applyClasses(options.leave);
      this.applyClasses(options.leaveFrom);

      await this.nextFrame();

      this.removeClasses(options.leaveFrom);
      this.applyClasses(options.leaveTo);

      await this.waitForTransition();

      // Hide element
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
