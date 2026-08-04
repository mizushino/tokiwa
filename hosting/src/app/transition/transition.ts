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

export class TransitionDirective extends AsyncDirective {
  private element?: HTMLElement;
  private currentDirection: 'enter' | 'leave' | null = null;
  private initialized = false;
  private transitionGeneration = 0;
  private cancelTransitionWait?: () => void;

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

    const generation = ++this.transitionGeneration;
    this.cancelTransitionWait?.();
    this.currentDirection = direction;

    if (direction === 'enter') {
      this.element.classList.remove('hidden');

      this.removeClasses(options.leave);
      this.removeClasses(options.leaveFrom);
      this.removeClasses(options.leaveTo);

      this.applyClasses(options.enter);
      this.applyClasses(options.enterFrom);

      await this.nextFrame();
      if (!this.isCurrentTransition(generation)) return;

      this.removeClasses(options.enterFrom);
      this.applyClasses(options.enterTo);

      await this.waitForTransition(generation);
    } else {
      this.removeClasses(options.enter);
      this.removeClasses(options.enterFrom);
      this.removeClasses(options.enterTo);

      this.applyClasses(options.leave);
      this.applyClasses(options.leaveFrom);

      await this.nextFrame();
      if (!this.isCurrentTransition(generation)) return;

      this.removeClasses(options.leaveFrom);
      this.applyClasses(options.leaveTo);

      await this.waitForTransition(generation);
      if (!this.isCurrentTransition(generation)) return;

      this.element.classList.add('hidden');
    }
  }

  protected override disconnected(): void {
    this.transitionGeneration += 1;
    this.cancelTransitionWait?.();
  }

  private nextFrame(): Promise<void> {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });
  }

  private waitForTransition(generation: number): Promise<void> {
    return new Promise((resolve) => {
      const element = this.element;
      if (!element || !this.isCurrentTransition(generation)) {
        resolve();
        return;
      }

      let settled = false;
      const finish = (): void => {
        if (settled) return;
        settled = true;
        element.removeEventListener('transitionend', handleTransitionEnd);
        element.removeEventListener('transitioncancel', handleTransitionEnd);
        clearTimeout(timeout);
        if (this.cancelTransitionWait === finish) {
          this.cancelTransitionWait = undefined;
        }
        resolve();
      };

      const handleTransitionEnd = (event: TransitionEvent): void => {
        if (event.target !== element) return;
        event.stopPropagation();
        finish();
      };

      const timeout = setTimeout(finish, this.getTransitionTimeout(element));
      this.cancelTransitionWait = finish;
      element.addEventListener('transitionend', handleTransitionEnd);
      element.addEventListener('transitioncancel', handleTransitionEnd);
    });
  }

  private isCurrentTransition(generation: number): boolean {
    return generation === this.transitionGeneration && this.element?.isConnected === true;
  }

  private getTransitionTimeout(element: HTMLElement): number {
    const style = getComputedStyle(element);
    const durations = style.transitionDuration.split(',').map((value) => this.parseTime(value));
    const delays = style.transitionDelay.split(',').map((value) => this.parseTime(value));
    const count = Math.max(durations.length, delays.length);
    let maximum = 0;

    for (let index = 0; index < count; index += 1) {
      maximum = Math.max(maximum, (durations[index % durations.length] ?? 0) + (delays[index % delays.length] ?? 0));
    }

    return maximum + 50;
  }

  private parseTime(value: string): number {
    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed)) return 0;
    return value.trim().endsWith('ms') ? parsed : parsed * 1_000;
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
