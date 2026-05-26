import { LitElement, css, html, type CSSResultGroup, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { createRef, ref, type Ref } from 'lit/directives/ref.js';

import { tailwindCSS } from '@app/styles';

/**
 * Resizable split divider for adjacent panels.
 *
 * Usage:
 * ```ts
 * html`
 *   <div class="flex h-full">
 *     <aside class="w-80"></aside>
 *     <ui-split direction="horizontal" .min=${240} .max=${640}></ui-split>
 *     <main class="flex-1"></main>
 *   </div>
 * `
 * ```
 *
 * @fires change - Fired when a drag interaction commits a new panel size.
 */
@customElement('ui-split')
export class UiSplit extends LitElement {
  static override styles: CSSResultGroup = [
    tailwindCSS,
    css`
      :host {
        display: flex;
        flex-shrink: 0;
      }
    `,
  ];

  @property({ type: String }) direction: 'horizontal' | 'vertical' = 'horizontal';
  @property({ type: Number }) min?: number;
  @property({ type: Number }) max?: number;

  // Track drag state without triggering Lit re-renders.
  protected isDragging = false;
  protected parentRect: DOMRect | undefined;
  protected startPrevSize = 0;
  protected startMousePos = 0; // Mouse position captured when dragging starts.
  protected startMin?: number; // Min size captured at drag start.
  protected startMax?: number; // Max size captured at drag start.
  protected pendingSize: number | null = null;

  protected readonly handleRef: Ref<HTMLDivElement> = createRef();

  protected override render(): TemplateResult {
    const isVertical = this.direction === 'vertical';

    // Extend the hit area without affecting layout.
    return html`
      <div class="${isVertical ? 'h-4 w-full' : 'h-full w-4'} relative">
        <!-- Invisible touch extension (before) - absolute positioned -->
        <div
          class="${isVertical
            ? '-top-2 left-0 h-2 w-full cursor-ns-resize'
            : '-left-2 top-0 h-full w-2 cursor-ew-resize'} absolute"
          @mousedown=${this.onMouseDown}
          @touchstart=${this.onTouchStart}
        ></div>
        <!-- Visible split bar -->
        <div
          ${ref(this.handleRef)}
          class="${isVertical
            ? 'z-10 flex h-full w-full cursor-ns-resize items-center justify-center border-t border-b'
            : 'z-10 flex h-full w-full cursor-ew-resize items-center justify-center border-l border-r'} border-neutral-800 bg-neutral-900 hover:bg-neutral-800"
          @mousedown=${this.onMouseDown}
          @touchstart=${this.onTouchStart}
        >
          ${isVertical
            ? html`
                <svg
                  class="pointer-events-none size-4 text-neutral-400"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 32 32"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <line x1="0" y1="12" x2="32" y2="12"></line>
                  <line x1="0" y1="20" x2="32" y2="20"></line>
                </svg>
              `
            : html`
                <svg
                  class="pointer-events-none size-4 text-neutral-400"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 32 32"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <line x1="12" y1="0" x2="12" y2="32"></line>
                  <line x1="20" y1="0" x2="20" y2="32"></line>
                </svg>
              `}
        </div>
        <!-- Invisible touch extension (after) - absolute positioned -->
        <div
          class="${isVertical
            ? '-bottom-2 left-0 h-2 w-full cursor-ns-resize'
            : '-right-2 top-0 h-full w-2 cursor-ew-resize'} absolute"
          @mousedown=${this.onMouseDown}
          @touchstart=${this.onTouchStart}
        ></div>
      </div>
    `;
  }

  protected onMouseDown(e: MouseEvent): void {
    if (e.buttons === 1) {
      this.startDrag(e.clientX, e.clientY);
      e.stopPropagation();
      e.preventDefault();
    }
  }

  protected onTouchStart = (e: TouchEvent): void => {
    const touch = e.touches[0];
    this.startDrag(touch.clientX, touch.clientY);
    e.stopPropagation();
    e.preventDefault();
  };

  protected startDrag(clientX: number, clientY: number): void {
    const handleElement = this.handleRef.value;
    const prevElement = this.previousElementSibling as HTMLElement;
    if (!handleElement || !prevElement) return;

    this.parentRect = this.parentElement?.getBoundingClientRect();
    this.isDragging = true;
    this.pendingSize = null;

    const prevRect = prevElement.getBoundingClientRect();
    this.startPrevSize = this.direction === 'vertical' ? prevRect.height : prevRect.width;
    this.startMousePos = this.direction === 'vertical' ? clientY : clientX;

    // Freeze the current bounds for the full drag interaction.
    this.startMin = this.min;
    this.startMax = this.max;

    // Prevent nested iframes from stealing pointer events while dragging.
    this.showDragOverlay();

    // Dim the handle to indicate that a drag is in progress.
    handleElement.style.opacity = '0.75';
  }

  // Transparent overlay used to keep drag events flowing across iframes.
  protected dragOverlay: HTMLDivElement | null = null;

  protected showDragOverlay(): void {
    if (this.dragOverlay) return;
    this.dragOverlay = document.createElement('div');
    this.dragOverlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 9999;
      cursor: ${this.direction === 'vertical' ? 'ns-resize' : 'ew-resize'};
    `;
    document.body.appendChild(this.dragOverlay);
  }

  protected hideDragOverlay(): void {
    if (this.dragOverlay) {
      this.dragOverlay.remove();
      this.dragOverlay = null;
    }
  }

  protected onPointerUp = (): void => {
    if (this.isDragging) {
      this.finalizeDrag();
    }
  };

  protected finalizeDrag(): void {
    const handleElement = this.handleRef.value;
    const prevElement = this.previousElementSibling as HTMLElement;

    this.isDragging = false;
    this.hideDragOverlay();

    if (handleElement) {
      handleElement.style.transform = '';
      handleElement.style.opacity = ''; // Reset the temporary drag styling.
    }

    if (this.pendingSize !== null && prevElement) {
      if (this.direction === 'vertical') {
        prevElement.style.height = `${this.pendingSize}px`;
        this.dispatchEvent(
          new CustomEvent('change', { detail: { height: this.pendingSize }, bubbles: true, composed: true })
        );
      } else {
        prevElement.style.width = `${this.pendingSize}px`;
        this.dispatchEvent(
          new CustomEvent('change', { detail: { width: this.pendingSize }, bubbles: true, composed: true })
        );
      }
      this.pendingSize = null;
    }
  }

  protected onDrag = (e: MouseEvent | TouchEvent | DragEvent): void => {
    if (!this.isDragging) return;

    let clientX: number;
    let clientY: number;

    if (e instanceof TouchEvent) {
      if (e.touches.length === 0) {
        this.finalizeDrag();
        return;
      }
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e instanceof MouseEvent) {
      if (e.buttons !== 1) {
        this.finalizeDrag();
        return;
      }
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      return;
    }

    const handleElement = this.handleRef.value;
    if (!handleElement || !this.parentRect) return;

    if (this.direction === 'vertical') {
      // Base the next size on the initial measurement to avoid reflow-driven drift.
      const mouseDelta = clientY - this.startMousePos;
      let height = this.startPrevSize + mouseDelta;

      // Clamp using the bounds captured at drag start.
      if (this.startMin !== undefined && height < this.startMin) height = this.startMin;
      if (this.startMax !== undefined && height > this.startMax) height = this.startMax;

      const nextElement = this.nextElementSibling as HTMLElement;
      if (nextElement) {
        const minNextHeight = this.startMin !== undefined ? this.startMin : 200;
        const maxAllowedHeight = this.parentRect.height - minNextHeight - (handleElement.clientHeight || 0);
        if (height > maxAllowedHeight) height = maxAllowedHeight;
      }

      const offset = height - this.startPrevSize;
      handleElement.style.transform = `translateY(${offset}px)`;
      this.pendingSize = height;
    } else {
      // Base the next size on the initial measurement to avoid reflow-driven drift.
      const mouseDelta = clientX - this.startMousePos;
      let width = this.startPrevSize + mouseDelta;

      // Clamp using the bounds captured at drag start.
      if (this.startMin !== undefined && width < this.startMin) width = this.startMin;
      if (this.startMax !== undefined && width > this.startMax) width = this.startMax;

      const nextElement = this.nextElementSibling as HTMLElement;
      if (nextElement) {
        const minNextWidth = 320;
        const maxAllowedWidth = this.parentRect.width - minNextWidth - (handleElement.clientWidth || 0);
        if (width > maxAllowedWidth) width = maxAllowedWidth;
      }

      const offset = width - this.startPrevSize;
      handleElement.style.transform = `translateX(${offset}px)`;
      this.pendingSize = width;
    }

    e.stopPropagation();
    e.preventDefault();
  };

  public setWidth(width: number): void {
    const prevElement = this.previousElementSibling as HTMLElement;
    if (prevElement) {
      prevElement.classList.add('transition-all', 'duration-200');
      prevElement.style.width = `${width}px`;
      setTimeout(() => prevElement.classList.remove('transition-all', 'duration-200'), 200);
    }
  }

  public setHeight(height: number): void {
    const prevElement = this.previousElementSibling as HTMLElement;
    if (prevElement) {
      prevElement.classList.add('transition-all', 'duration-200');
      prevElement.style.height = `${height}px`;
      setTimeout(() => prevElement.classList.remove('transition-all', 'duration-200'), 200);
    }
  }

  public override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('mousemove', this.onDrag);
    document.addEventListener('touchmove', this.onDrag, { passive: false });
    document.addEventListener('drag', this.onDrag);
    document.addEventListener('mouseup', this.onPointerUp);
    document.addEventListener('touchend', this.onPointerUp);
    document.addEventListener('touchcancel', this.onPointerUp);
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('mousemove', this.onDrag);
    document.removeEventListener('touchmove', this.onDrag);
    document.removeEventListener('drag', this.onDrag);
    document.removeEventListener('mouseup', this.onPointerUp);
    document.removeEventListener('touchend', this.onPointerUp);
    document.removeEventListener('touchcancel', this.onPointerUp);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-split': UiSplit;
  }
}
