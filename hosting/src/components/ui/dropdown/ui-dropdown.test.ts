import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { proxyShadowQueries } from '@app/../test/query-shadow-root';

import type { DropdownSize, UiDropdown } from './ui-dropdown';

import './ui-dropdown';

describe('UiDropdown', () => {
  let element: UiDropdown;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    element = proxyShadowQueries(document.createElement('ui-dropdown') as UiDropdown);

    const trigger = document.createElement('button');
    trigger.setAttribute('slot', 'trigger');
    trigger.textContent = 'Options';
    element.appendChild(trigger);

    const menu = document.createElement('div');
    menu.setAttribute('slot', 'menu');
    const item1 = document.createElement('a');
    item1.href = '#';
    item1.textContent = 'Item 1';
    item1.className = 'block px-4 py-2 text-sm';
    const item2 = document.createElement('a');
    item2.href = '#';
    item2.textContent = 'Item 2';
    item2.className = 'block px-4 py-2 text-sm';
    menu.appendChild(item1);
    menu.appendChild(item2);
    element.appendChild(menu);

    container.appendChild(element);
  });

  afterEach(() => {
    container.remove();
  });

  async function openDropdown(): Promise<HTMLElement> {
    await element.updateComplete;
    const trigger = element.querySelector('[data-dropdown-trigger]') as HTMLElement;
    trigger.click();
    await element.updateComplete;
    await new Promise((resolve) => setTimeout(resolve, 50));
    return trigger;
  }

  function getMenu(): HTMLElement {
    return element.querySelector('[data-dropdown-menu]') as HTMLElement;
  }

  function getFocusableItems(): HTMLElement[] {
    const slot = getMenu().querySelector('slot[name="menu"]');
    if (!(slot instanceof HTMLSlotElement)) {
      return [];
    }

    const selector = 'a, button, [tabindex]:not([tabindex="-1"])';
    return slot.assignedElements({ flatten: true }).flatMap((assignedElement) => {
      const matches: HTMLElement[] = [];

      if (assignedElement instanceof HTMLElement && assignedElement.matches(selector)) {
        matches.push(assignedElement);
      }

      matches.push(...Array.from(assignedElement.querySelectorAll<HTMLElement>(selector)));
      return matches;
    });
  }

  it('renders with default properties', async () => {
    await element.updateComplete;
    expect(element).toBeDefined();
    expect(element.size).toBe('md');
    expect(element.placement).toBe('bottom-start');
  });

  it('renders trigger slot', async () => {
    await element.updateComplete;
    const trigger = element.querySelector('[slot="trigger"]');
    expect(trigger).toBeTruthy();
    expect(trigger?.textContent).toBe('Options');
  });

  it('menu is rendered but visually hidden by default', async () => {
    await element.updateComplete;
    const menu = element.querySelector('[data-dropdown-menu]');
    expect(menu).toBeTruthy();
    expect(menu?.classList.contains('hidden')).toBe(true);
  });

  it('opens dropdown when trigger is clicked', async () => {
    await element.updateComplete;
    const trigger = element.querySelector('[data-dropdown-trigger]') as HTMLElement;
    trigger.click();
    await element.updateComplete;

    const menu = element.querySelector('[data-dropdown-menu]');
    expect(menu).toBeTruthy();
    expect(menu?.classList.contains('hidden')).toBe(false);
  });

  it('closes dropdown when trigger is clicked again', async () => {
    const trigger = await openDropdown();

    const menu = getMenu();
    expect(menu.classList.contains('hidden')).toBe(false);

    trigger.click();
    await element.updateComplete;

    expect(menu.classList.contains('hidden')).toBe(true);
  });

  it('closes dropdown when clicking outside', async () => {
    await openDropdown();
    const menu = getMenu();
    expect(menu.classList.contains('hidden')).toBe(false);

    document.body.click();
    await element.updateComplete;

    expect(menu.classList.contains('hidden')).toBe(true);
  });

  it('closes dropdown when Escape key is pressed', async () => {
    await openDropdown();
    const menu = getMenu();
    expect(menu.classList.contains('hidden')).toBe(false);

    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    document.dispatchEvent(event);
    await element.updateComplete;

    expect(menu.classList.contains('hidden')).toBe(true);
    expect(document.activeElement).toBe(element.querySelector('[slot="trigger"]'));
  });

  it('applies small size classes', async () => {
    element.size = 'sm';
    await element.updateComplete;
    const trigger = element.querySelector('[data-dropdown-trigger]') as HTMLElement;
    trigger.click();
    await element.updateComplete;

    const menu = element.querySelector('[data-dropdown-menu]');
    expect(menu?.className).toContain('min-w-[8rem]');
  });

  it('applies medium size classes', async () => {
    element.size = 'md';
    await element.updateComplete;
    const trigger = element.querySelector('[data-dropdown-trigger]') as HTMLElement;
    trigger.click();
    await element.updateComplete;

    const menu = element.querySelector('[data-dropdown-menu]');
    expect(menu?.className).toContain('min-w-[12rem]');
  });

  it('applies large size classes', async () => {
    element.size = 'lg';
    await element.updateComplete;
    const trigger = element.querySelector('[data-dropdown-trigger]') as HTMLElement;
    trigger.click();
    await element.updateComplete;

    const menu = element.querySelector('[data-dropdown-menu]');
    expect(menu?.className).toContain('min-w-[16rem]');
  });

  it('applies bottom-start placement classes', async () => {
    element.placement = 'bottom-start';
    await element.updateComplete;
    const trigger = element.querySelector('[data-dropdown-trigger]') as HTMLElement;
    trigger.click();
    await element.updateComplete;

    const menu = element.querySelector('[data-dropdown-menu]');
    expect(menu?.className).toContain('mt-2');
    expect(menu?.className).toContain('left-0');
  });

  it('applies bottom-end placement classes', async () => {
    element.placement = 'bottom-end';
    await element.updateComplete;
    const trigger = element.querySelector('[data-dropdown-trigger]') as HTMLElement;
    trigger.click();
    await element.updateComplete;

    const menu = element.querySelector('[data-dropdown-menu]');
    expect(menu?.className).toContain('mt-2');
    expect(menu?.className).toContain('right-0');
  });

  it('applies top-start placement classes', async () => {
    element.placement = 'top-start';
    await element.updateComplete;
    const trigger = element.querySelector('[data-dropdown-trigger]') as HTMLElement;
    trigger.click();
    await element.updateComplete;

    const menu = element.querySelector('[data-dropdown-menu]');
    expect(menu?.className).toContain('bottom-full');
    expect(menu?.className).toContain('left-0');
  });

  it('applies top-end placement classes', async () => {
    element.placement = 'top-end';
    await element.updateComplete;
    const trigger = element.querySelector('[data-dropdown-trigger]') as HTMLElement;
    trigger.click();
    await element.updateComplete;

    const menu = element.querySelector('[data-dropdown-menu]');
    expect(menu?.className).toContain('bottom-full');
    expect(menu?.className).toContain('right-0');
  });

  it('applies common menu classes', async () => {
    await element.updateComplete;
    const trigger = element.querySelector('[data-dropdown-trigger]') as HTMLElement;
    trigger.click();
    await element.updateComplete;

    const menu = element.querySelector('[data-dropdown-menu]');
    expect(menu?.className).toContain('absolute');
    expect(menu?.className).toContain('z-10');
    expect(menu?.className).toContain('rounded-md');
    expect(menu?.className).toContain('bg-white');
    expect(menu?.className).toContain('shadow-sm');
  });

  it('sets correct aria attributes on menu', async () => {
    await element.updateComplete;
    const trigger = element.querySelector('[data-dropdown-trigger]') as HTMLElement;
    trigger.click();
    await element.updateComplete;

    const menu = element.querySelector('[data-dropdown-menu]');
    expect(menu?.getAttribute('role')).toBe('menu');
    expect(menu?.getAttribute('aria-orientation')).toBe('vertical');
  });

  it('applies all size variants correctly', async () => {
    const sizes: DropdownSize[] = ['sm', 'md', 'lg'];
    const expectedClasses = {
      sm: 'min-w-[8rem]',
      md: 'min-w-[12rem]',
      lg: 'min-w-[16rem]',
    };

    for (const size of sizes) {
      element.size = size;
      await element.updateComplete;
      const trigger = element.querySelector('[data-dropdown-trigger]') as HTMLElement;
      trigger.click();
      await element.updateComplete;

      const menu = element.querySelector('[data-dropdown-menu]');
      expect(menu?.className).toContain(expectedClasses[size]);

      trigger.click();
      await element.updateComplete;
    }
  });

  it('renders menu items in slot', async () => {
    await element.updateComplete;
    const trigger = element.querySelector('[data-dropdown-trigger]') as HTMLElement;
    trigger.click();
    await element.updateComplete;

    const menu = element.querySelector('[data-dropdown-menu]');
    expect(menu).toBeTruthy();

    const slot = menu?.querySelector('[name="menu"]');
    expect(slot).toBeTruthy();
  });

  it('handles ArrowDown key press when dropdown is open', async () => {
    await openDropdown();
    const [firstItem, secondItem] = getFocusableItems();
    firstItem.focus();

    const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true });
    document.dispatchEvent(event);

    expect(document.activeElement).toBe(secondItem);
  });

  it('handles ArrowUp key press when dropdown is open', async () => {
    await openDropdown();
    const [firstItem, secondItem] = getFocusableItems();
    secondItem.focus();

    const event = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true });
    document.dispatchEvent(event);

    expect(document.activeElement).toBe(firstItem);
  });

  it('handles keyboard navigation with focus wrapping', async () => {
    await openDropdown();
    const [firstItem, secondItem] = getFocusableItems();
    secondItem.focus();

    const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true });
    document.dispatchEvent(downEvent);
    expect(document.activeElement).toBe(firstItem);

    firstItem.focus();
    const upEvent = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true });
    document.dispatchEvent(upEvent);

    expect(document.activeElement).toBe(secondItem);
  });

  it('handles Home and End keys for navigation', async () => {
    await openDropdown();
    const [firstItem, secondItem] = getFocusableItems();
    firstItem.focus();

    const homeEvent = new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true });
    document.dispatchEvent(homeEvent);
    expect(document.activeElement).toBe(firstItem);

    firstItem.focus();
    const endEvent = new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true });
    document.dispatchEvent(endEvent);

    expect(document.activeElement).toBe(secondItem);
  });

  it('cleans up event listeners on disconnect', async () => {
    await element.updateComplete;
    const trigger = element.querySelector('[data-dropdown-trigger]') as HTMLElement;
    trigger.click();
    await element.updateComplete;

    const spy = vi.spyOn(document, 'removeEventListener');

    element.remove();

    expect(spy).toHaveBeenCalledWith('click', expect.any(Function));
    expect(spy).toHaveBeenCalledWith('keydown', expect.any(Function));

    spy.mockRestore();
  });
});

describe('UiDropdown keyboard navigation nested in a shadow root', () => {
  let host: HTMLElement;
  let dropdown: UiDropdown;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });

    dropdown = document.createElement('ui-dropdown') as UiDropdown;

    const trigger = document.createElement('button');
    trigger.setAttribute('slot', 'trigger');
    trigger.textContent = 'Options';
    dropdown.appendChild(trigger);

    const menu = document.createElement('div');
    menu.setAttribute('slot', 'menu');
    for (const label of ['Item 1', 'Item 2', 'Item 3']) {
      const link = document.createElement('a');
      link.href = '#';
      link.textContent = label;
      link.className = 'block px-4 py-2 text-sm';
      menu.appendChild(link);
    }
    dropdown.appendChild(menu);

    shadow.appendChild(dropdown);
  });

  afterEach(() => {
    host.remove();
  });

  function items(): HTMLAnchorElement[] {
    return Array.from(dropdown.querySelectorAll('a'));
  }

  function deepActiveElement(): Element | null {
    let active: Element | null = document.activeElement;
    while (active?.shadowRoot?.activeElement) {
      active = active.shadowRoot.activeElement;
    }
    return active;
  }

  async function open(): Promise<void> {
    await dropdown.updateComplete;
    (dropdown.shadowRoot?.querySelector('[data-dropdown-trigger]') as HTMLElement).click();
    await dropdown.updateComplete;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  function pressArrowDown(): void {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
  }

  it('advances one item on each ArrowDown (not stuck on the first)', async () => {
    await open();
    const [first, second, third] = items();
    first.focus();
    expect(deepActiveElement()).toBe(first);

    pressArrowDown();
    expect(deepActiveElement()).toBe(second);

    pressArrowDown();
    expect(deepActiveElement()).toBe(third);
  });

  it('wraps to the first item after the last on ArrowDown', async () => {
    await open();
    const [first, , third] = items();
    third.focus();

    pressArrowDown();
    expect(deepActiveElement()).toBe(first);
  });

  it('moves backwards on ArrowUp', async () => {
    await open();
    const [, second, third] = items();
    third.focus();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }));
    expect(deepActiveElement()).toBe(second);
  });

  function menu(): HTMLElement {
    return dropdown.shadowRoot?.querySelector('[data-dropdown-menu]') as HTMLElement;
  }

  it('stays open when clicking an item inside the menu (inside click not treated as outside)', async () => {
    await open();
    expect(menu().classList.contains('hidden')).toBe(false);

    items()[0].click();
    await dropdown.updateComplete;

    expect(menu().classList.contains('hidden')).toBe(false);
  });

  it('closes when clicking truly outside the shadow-nested dropdown', async () => {
    await open();
    expect(menu().classList.contains('hidden')).toBe(false);

    document.body.click();
    await dropdown.updateComplete;

    expect(menu().classList.contains('hidden')).toBe(true);
  });
});
