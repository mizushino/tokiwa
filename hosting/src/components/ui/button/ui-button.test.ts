import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { proxyShadowQueries } from '@app/../test/query-shadow-root';

import { type ButtonSize, type ButtonVariant, type UiButton } from './ui-button';

import './ui-button';

describe('UiButton', () => {
  let element: UiButton;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    element = proxyShadowQueries(document.createElement('ui-button') as UiButton);
    container.appendChild(element);
  });

  afterEach(() => {
    container.remove();
  });

  it('renders with default properties', async () => {
    await element.updateComplete;
    expect(element).toBeDefined();
    expect(element.variant).toBe('primary');
    expect(element.size).toBe('md');
    expect(element.type).toBe('button');
    expect(element.disabled).toBe(false);
    expect(element.loading).toBe(false);
    expect(element.fullWidth).toBe(false);
    expect(element.rounded).toBe(false);
  });

  it('renders button element', async () => {
    await element.updateComplete;
    const button = element.querySelector('button');
    expect(button).toBeTruthy();
  });

  it('applies primary variant classes', async () => {
    element.variant = 'primary';
    await element.updateComplete;
    const button = element.querySelector('button');
    expect(button?.className).toContain('bg-primary-600');
  });

  it('applies secondary variant classes', async () => {
    element.variant = 'secondary';
    await element.updateComplete;
    const button = element.querySelector('button');
    expect(button?.className).toContain('bg-secondary-600');
  });

  it('applies success variant classes', async () => {
    element.variant = 'success';
    await element.updateComplete;
    const button = element.querySelector('button');
    expect(button?.className).toContain('bg-success-600');
  });

  it('applies danger variant classes', async () => {
    element.variant = 'danger';
    await element.updateComplete;
    const button = element.querySelector('button');
    expect(button?.className).toContain('bg-danger-600');
  });

  it('applies warning variant classes', async () => {
    element.variant = 'warning';
    await element.updateComplete;
    const button = element.querySelector('button');
    expect(button?.className).toContain('bg-warning-600');
  });

  it('applies info variant classes', async () => {
    element.variant = 'info';
    await element.updateComplete;
    const button = element.querySelector('button');
    expect(button?.className).toContain('bg-info-600');
  });

  it('applies soft variant classes', async () => {
    element.variant = 'soft';
    await element.updateComplete;
    const button = element.querySelector('button');
    expect(button?.className).toContain('bg-primary-50');
  });

  it('applies xs size classes', async () => {
    element.size = 'xs';
    await element.updateComplete;
    const button = element.querySelector('button');
    expect(button?.className).toContain('rounded-sm');
    expect(button?.className).toContain('px-2');
    expect(button?.className).toContain('text-xs');
  });

  it('applies small size classes', async () => {
    element.size = 'sm';
    await element.updateComplete;
    const button = element.querySelector('button');
    expect(button?.className).toContain('rounded-sm');
    expect(button?.className).toContain('px-2');
    expect(button?.className).toContain('text-sm');
  });

  it('applies medium size classes', async () => {
    element.size = 'md';
    await element.updateComplete;
    const button = element.querySelector('button');
    expect(button?.className).toContain('rounded-md');
    expect(button?.className).toContain('px-2.5');
    expect(button?.className).toContain('text-sm');
  });

  it('applies large size classes', async () => {
    element.size = 'lg';
    await element.updateComplete;
    const button = element.querySelector('button');
    expect(button?.className).toContain('rounded-md');
    expect(button?.className).toContain('px-3');
    expect(button?.className).toContain('text-sm');
  });

  it('applies xl size classes', async () => {
    element.size = 'xl';
    await element.updateComplete;
    const button = element.querySelector('button');
    expect(button?.className).toContain('rounded-md');
    expect(button?.className).toContain('px-3.5');
    expect(button?.className).toContain('text-sm');
  });

  it('sets button type attribute', async () => {
    element.type = 'submit';
    await element.updateComplete;
    const button = element.querySelector('button');
    expect(button?.type).toBe('submit');
  });

  it('disables button when disabled is true', async () => {
    element.disabled = true;
    await element.updateComplete;
    const button = element.querySelector('button');
    expect(button?.disabled).toBe(true);
  });

  it('applies disabled classes when disabled', async () => {
    element.disabled = true;
    await element.updateComplete;
    const button = element.querySelector('button');
    expect(button?.className).toContain('disabled:cursor-not-allowed');
    expect(button?.className).toContain('disabled:opacity-50');
  });

  it('renders loading spinner when loading is true', async () => {
    element.loading = true;
    await element.updateComplete;
    const spinner = element.querySelector('svg.animate-spin');
    expect(spinner).toBeTruthy();
  });

  it('disables button when loading is true', async () => {
    element.loading = true;
    await element.updateComplete;
    const button = element.querySelector('button');
    expect(button?.disabled).toBe(true);
  });

  it('applies flex classes when loading', async () => {
    element.loading = true;
    await element.updateComplete;
    const button = element.querySelector('button');
    expect(button?.className).toContain('inline-flex');
    expect(button?.className).toContain('items-center');
  });

  it('applies full width class when fullWidth is true', async () => {
    element.fullWidth = true;
    await element.updateComplete;
    const button = element.querySelector('button');
    expect(button?.className).toContain('w-full');
  });

  it('does not apply full width class when fullWidth is false', async () => {
    element.fullWidth = false;
    await element.updateComplete;
    const button = element.querySelector('button');
    expect(button?.className).not.toContain('w-full');
  });

  it('applies common button classes to all variants', async () => {
    const variants: ButtonVariant[] = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'soft'];

    for (const variant of variants) {
      element.variant = variant;
      await element.updateComplete;
      const button = element.querySelector('button');
      expect(button?.className).toContain('font-semibold');
      expect(button?.className).toContain('inline-flex');
      expect(button?.className).toContain('cursor-pointer');
    }
  });

  it('applies rounded-full class when rounded is true', async () => {
    element.rounded = true;
    await element.updateComplete;
    const button = element.querySelector('button');
    expect(button?.className).toContain('rounded-full');
  });

  it('does not apply rounded-full class when rounded is false', async () => {
    element.rounded = false;
    await element.updateComplete;
    const button = element.querySelector('button');
    expect(button?.className).not.toContain('rounded-full');
  });

  it('applies rounded-full with different sizes', async () => {
    const sizes: ButtonSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
    element.rounded = true;

    for (const size of sizes) {
      element.size = size;
      await element.updateComplete;
      const button = element.querySelector('button');
      expect(button?.className).toContain('rounded-full');
    }
  });

  it('renders button with reset type', async () => {
    element.type = 'reset';
    await element.updateComplete;
    const button = element.querySelector('button');
    expect(button?.type).toBe('reset');
  });

  it('renders with multiple properties combined', async () => {
    element.variant = 'danger';
    element.size = 'lg';
    element.fullWidth = true;
    await element.updateComplete;

    const button = element.querySelector('button');
    expect(button?.className).toContain('bg-danger-600');
    expect(button?.className).toContain('px-3');
    expect(button?.className).toContain('w-full');
  });

  it('does not render spinner when not loading', async () => {
    element.loading = false;
    await element.updateComplete;
    const spinner = element.querySelector('svg.animate-spin');
    expect(spinner).toBeNull();
  });

  it('can be clicked when not disabled', async () => {
    element.disabled = false;
    await element.updateComplete;
    const button = element.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });

  it('cannot be clicked when disabled', async () => {
    element.disabled = true;
    await element.updateComplete;
    const button = element.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('cannot be clicked when loading', async () => {
    element.loading = true;
    await element.updateComplete;
    const button = element.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('maintains content when loading', async () => {
    element.loading = true;
    await element.updateComplete;
    const button = element.querySelector('button');
    const spinner = button?.querySelector('svg.animate-spin');
    expect(spinner).toBeTruthy();
  });

  it('applies all size variants correctly', async () => {
    const sizes: ButtonSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
    const expectedClasses = {
      xs: ['px-2', 'text-xs', 'rounded-sm'],
      sm: ['px-2', 'text-sm', 'rounded-sm'],
      md: ['px-2.5', 'text-sm', 'rounded-md'],
      lg: ['px-3', 'text-sm', 'rounded-md'],
      xl: ['px-3.5', 'text-sm', 'rounded-md'],
    };

    for (const size of sizes) {
      element.size = size;
      await element.updateComplete;
      const button = element.querySelector('button');
      for (const className of expectedClasses[size]) {
        expect(button?.className).toContain(className);
      }
    }
  });

  it('applies correct padding for rounded buttons', async () => {
    const sizes: ButtonSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
    const expectedClasses = {
      xs: ['px-2.5', 'rounded-full'],
      sm: ['px-2.5', 'rounded-full'],
      md: ['px-3', 'rounded-full'],
      lg: ['px-3.5', 'rounded-full'],
      xl: ['px-4', 'rounded-full'],
    };

    element.rounded = true;

    for (const size of sizes) {
      element.size = size;
      await element.updateComplete;
      const button = element.querySelector('button');
      for (const className of expectedClasses[size]) {
        expect(button?.className).toContain(className);
      }
    }
  });
});
