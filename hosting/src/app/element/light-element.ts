import { LitElement, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { globalTranslations, getPreferredLanguage } from '@app/i18n';

/**
 * Base class for Lit components using Light DOM instead of Shadow DOM.
 *
 * @remarks
 * Provides two main features:
 * - Automatic host class management via {@link hostClasses}
 * - Slot functionality in Light DOM by preserving and repositioning child elements
 * - Translation support via {@link trans} method
 *
 * Slot behavior simulates Shadow DOM:
 * - Named slots: Use `slot="name"` attribute on child elements
 * - Default slot: Elements without `slot` attribute
 * - Fallback content: Content inside `<slot>` tags shown when no matching slotted content
 *
 * @example
 * ```ts
 * import { html } from 'lit';
 * import { customElement } from 'lit/decorators.js';
 *
 * @customElement('my-button')
 * class MyButton extends LightElement {
 *   protected static override hostClasses = ['inline-flex', 'items-center'];
 *
 *   protected override render() {
 *     return html`
 *       <button>
 *         <slot name="icon"></slot>
 *         <slot></slot>
 *       </button>
 *     `;
 *   }
 * }
 *
 * // Usage:
 * // <my-button>
 * //   <i slot="icon" class="fa-solid fa-home"></i>
 * //   Click me
 * // </my-button>
 * ```
 */
@customElement('light-element')
export class LightElement extends LitElement {
  /**
   * CSS classes applied to the host element on connection.
   * Override in subclasses to customize default styling.
   */
  protected static hostClasses: string[] = [];

  /**
   * Component-specific translations.
   * Override in subclasses to provide component-specific translations.
   */
  @property({ type: Object, attribute: false })
  protected componentTranslations?: {
    en?: Record<string, string>;
    ja?: Record<string, string>;
  };

  /** Preserved child nodes for slot insertion */
  private slotContent: Node[] = [];
  /** Child nodes grouped by slot name for efficient slot rendering */
  private contentBySlot = new Map<string, Node[]>();
  /** Child nodes without slot attribute (for default slot) */
  private defaultContent: Node[] = [];
  /** Cached slot elements to avoid repeated DOM queries */
  private cachedSlots: HTMLSlotElement[] | null = null;

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  public override connectedCallback(): void {
    // Preserve original children before Lit's render clears them
    // Only capture children on first connection to avoid losing them when moved by parent
    if (this.slotContent.length === 0 && this.childNodes.length > 0) {
      this.slotContent = Array.from(this.childNodes);
      while (this.firstChild) {
        this.removeChild(this.firstChild);
      }

      // Group slotContent by slot name for efficient slot rendering
      // This grouping is done once during initialization
      this.slotContent.forEach((node) => {
        if (node instanceof Element) {
          const slotName = node.getAttribute('slot');
          if (slotName) {
            // Named slot
            if (!this.contentBySlot.has(slotName)) {
              this.contentBySlot.set(slotName, []);
            }
            const slotNodes = this.contentBySlot.get(slotName);
            if (slotNodes) {
              slotNodes.push(node);
            }
          } else {
            // Default slot
            this.defaultContent.push(node);
          }
        } else {
          // Text nodes and comments go to default slot
          this.defaultContent.push(node);
        }
      });
    }

    super.connectedCallback();

    const classes = (this.constructor as typeof LightElement).hostClasses;
    if (classes.length > 0) {
      this.classList.add(...classes);
    }
  }

  protected override firstUpdated(_changedProperties: PropertyValues): void {
    super.firstUpdated(_changedProperties);
    this.updateSlotContent();
  }

  protected override updated(_changedProperties: PropertyValues): void {
    super.updated(_changedProperties);
    // Only update slot content if we have slots and content to insert
    if (this.cachedSlots !== null || this.slotContent.length > 0) {
      this.updateSlotContent();
    }
  }

  /**
   * Recursively finds slot elements that belong to this component only.
   * Stops traversal when encountering another LightElement.
   * Results are cached after first call.
   *
   * @param element - Element to search from
   * @returns Array of slot elements belonging to this component
   */
  private findOwnSlots(element: Element): HTMLSlotElement[] {
    // Return cached result if available
    if (this.cachedSlots !== null) {
      return this.cachedSlots;
    }

    const slots: HTMLSlotElement[] = [];

    const traverse = (node: Element): void => {
      for (const child of Array.from(node.children)) {
        // Stop if we encounter another LightElement
        if (child instanceof LightElement && child !== this) {
          continue;
        }

        // Collect slot elements
        if (child.tagName.toLowerCase() === 'slot') {
          slots.push(child as HTMLSlotElement);
        }

        // Continue traversing if not a LightElement
        if (!(child instanceof LightElement)) {
          traverse(child);
        }
      }
    };

    traverse(element);

    // Cache the result
    this.cachedSlots = slots;
    return slots;
  }

  /**
   * Inserts preserved child nodes into `<slot>` elements.
   *
   * @remarks
   * Simulates Shadow DOM slot behavior in Light DOM by moving
   * the original child nodes into `<slot>` elements in the template.
   * Supports both named slots and the default (unnamed) slot.
   * Only processes slots that belong to this component, not nested LightElements.
   */
  private updateSlotContent(): void {
    const slots = this.findOwnSlots(this);
    if (slots.length === 0) {
      return;
    }

    // Process each slot
    slots.forEach((slot) => {
      const slotName = slot.getAttribute('name');
      const content = slotName ? this.contentBySlot.get(slotName) : this.defaultContent;

      if (content && content.length > 0) {
        // Skip if content is already inserted (optimization for re-renders)
        const hasSlottedContent = content.some((node) => slot.contains(node));

        if (!hasSlottedContent) {
          // Clear fallback content only if slotted content hasn't been inserted yet
          while (slot.firstChild) {
            slot.removeChild(slot.firstChild);
          }

          // Insert slotted content
          content.forEach((node) => {
            slot.appendChild(node);
          });
        }
      }
      // If no content for this slot, keep fallback content
    });
  }

  /**
   * Translate a key to current language.
   * Fallback order: component-specific → global translations → raw key
   *
   * @param code - Translation key
   * @returns Translated string or raw key if not found
   */
  protected trans(code: string): string {
    const lang = getPreferredLanguage();

    // 1. Check component-specific translations
    const componentValue = this.componentTranslations?.[lang]?.[code];
    if (componentValue !== undefined) {
      return componentValue;
    }

    // 2. Check global translations
    const globalValue = globalTranslations[lang]?.[code];
    if (globalValue !== undefined) {
      return globalValue;
    }

    // 3. Return raw key if no translation found
    return code;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'light-element': LightElement;
  }
}
