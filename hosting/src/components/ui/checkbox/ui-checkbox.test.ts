import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { proxyShadowQueries } from '@app/../test/query-shadow-root';

import type { CheckboxSize, UiCheckbox } from './ui-checkbox';

import './ui-checkbox';

describe('UiCheckbox', () => {
  let element: UiCheckbox;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    element = proxyShadowQueries(document.createElement('ui-checkbox') as UiCheckbox);
    container.appendChild(element);
  });

  afterEach(() => {
    container.remove();
  });

  it('renders with default properties', async () => {
    await element.updateComplete;
    expect(element).toBeDefined();
    expect(element.checked).toBe(false);
    expect(element.disabled).toBe(false);
    expect(element.indeterminate).toBe(false);
    expect(element.size).toBe('md');
    expect(element.name).toBe('');
    expect(element.value).toBe('');
  });

  it('renders checkbox input element', async () => {
    await element.updateComplete;
    const input = element.querySelector('input[type="checkbox"]');
    expect(input).toBeTruthy();
  });

  it('renders label element', async () => {
    await element.updateComplete;
    const label = element.querySelector('label');
    expect(label).toBeTruthy();
  });

  it('sets checked property', async () => {
    element.checked = true;
    await element.updateComplete;
    const input = element.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(input?.checked).toBe(true);
  });

  it('sets disabled property', async () => {
    element.disabled = true;
    await element.updateComplete;
    const input = element.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(input?.disabled).toBe(true);
  });

  it('sets indeterminate property', async () => {
    element.indeterminate = true;
    await element.updateComplete;
    const input = element.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(input?.indeterminate).toBe(true);
  });

  it('applies small size classes', async () => {
    element.size = 'sm';
    await element.updateComplete;
    const input = element.querySelector('input[type="checkbox"]');
    expect(input?.className).toContain('size-4');
  });

  it('applies medium size classes', async () => {
    element.size = 'md';
    await element.updateComplete;
    const input = element.querySelector('input[type="checkbox"]');
    expect(input?.className).toContain('size-5');
  });

  it('applies large size classes', async () => {
    element.size = 'lg';
    await element.updateComplete;
    const input = element.querySelector('input[type="checkbox"]');
    expect(input?.className).toContain('size-6');
  });

  it('applies disabled classes when disabled', async () => {
    element.disabled = true;
    await element.updateComplete;
    const input = element.querySelector('input[type="checkbox"]');
    expect(input?.className).toContain('cursor-not-allowed');
    expect(input?.className).toContain('opacity-50');
  });

  it('applies cursor-pointer class when not disabled', async () => {
    element.disabled = false;
    await element.updateComplete;
    const input = element.querySelector('input[type="checkbox"]');
    expect(input?.className).toContain('cursor-pointer');
  });

  it('sets name attribute', async () => {
    element.name = 'test-checkbox';
    await element.updateComplete;
    const input = element.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(input?.name).toBe('test-checkbox');
  });

  it('sets value attribute', async () => {
    element.value = 'test-value';
    await element.updateComplete;
    const input = element.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(input?.value).toBe('test-value');
  });

  it('toggles checked state on click', async () => {
    await element.updateComplete;
    const input = element.querySelector('input[type="checkbox"]') as HTMLInputElement;

    expect(element.checked).toBe(false);
    input.click();
    await element.updateComplete;
    expect(element.checked).toBe(true);

    input.click();
    await element.updateComplete;
    expect(element.checked).toBe(false);
  });

  it('emits change event on click', async () => {
    await element.updateComplete;

    const changeHandler = vi.fn();
    element.addEventListener('change', changeHandler);

    const input = element.querySelector('input[type="checkbox"]') as HTMLInputElement;
    input.click();
    await element.updateComplete;

    expect(changeHandler).toHaveBeenCalled();
    expect(changeHandler.mock.calls[0][0].detail.checked).toBe(true);
  });

  it('includes value in change event detail', async () => {
    element.value = 'test-value';
    await element.updateComplete;

    const changeHandler = vi.fn();
    element.addEventListener('change', changeHandler);

    const input = element.querySelector('input[type="checkbox"]') as HTMLInputElement;
    input.click();
    await element.updateComplete;

    expect(changeHandler).toHaveBeenCalled();
    expect(changeHandler.mock.calls[0][0].detail.value).toBe('test-value');
  });

  it('clears indeterminate state when checked', async () => {
    element.indeterminate = true;
    await element.updateComplete;

    const input = element.querySelector('input[type="checkbox"]') as HTMLInputElement;
    input.click();
    await element.updateComplete;

    expect(element.indeterminate).toBe(false);
  });

  it('does not fire change event when disabled', async () => {
    element.disabled = true;
    await element.updateComplete;

    const changeHandler = vi.fn();
    element.addEventListener('change', changeHandler);

    const input = element.querySelector('input[type="checkbox"]') as HTMLInputElement;
    input.click();
    await element.updateComplete;

    expect(changeHandler).not.toHaveBeenCalled();
  });

  it('applies base styling classes', async () => {
    await element.updateComplete;
    const input = element.querySelector('input[type="checkbox"]');
    expect(input?.className).toContain('rounded');
    expect(input?.className).toContain('border-gray-300');
    expect(input?.className).toContain('text-primary-600');
    expect(input?.className).toContain('focus:ring-2');
  });

  it('applies dark mode classes', async () => {
    await element.updateComplete;
    const input = element.querySelector('input[type="checkbox"]');
    expect(input?.className).toContain('dark:border-gray-600');
    expect(input?.className).toContain('dark:bg-gray-800');
  });

  it('renders slotted content', async () => {
    container.remove();
    container = document.createElement('div');
    document.body.appendChild(container);

    element = proxyShadowQueries(document.createElement('ui-checkbox') as UiCheckbox);
    element.textContent = 'Checkbox Label';
    container.appendChild(element);

    await element.updateComplete;
    const slot = element.querySelector('slot');
    expect(slot).toBeTruthy();
  });

  it('applies label text styling', async () => {
    await element.updateComplete;
    const span = element.querySelector('span');
    expect(span?.className).toContain('text-sm');
    expect(span?.className).toContain('text-gray-900');
  });

  it('applies label cursor-not-allowed when disabled', async () => {
    element.disabled = true;
    await element.updateComplete;
    const label = element.querySelector('label');
    expect(label?.className).toContain('cursor-not-allowed');
  });

  it('applies label cursor-pointer when not disabled', async () => {
    element.disabled = false;
    await element.updateComplete;
    const label = element.querySelector('label');
    expect(label?.className).toContain('cursor-pointer');
  });

  it('applies all size variants correctly', async () => {
    const sizes: CheckboxSize[] = ['sm', 'md', 'lg'];
    const expectedClasses = {
      sm: 'size-4',
      md: 'size-5',
      lg: 'size-6',
    };

    for (const size of sizes) {
      element.size = size;
      await element.updateComplete;
      const input = element.querySelector('input[type="checkbox"]');
      expect(input?.className).toContain(expectedClasses[size]);
    }
  });

  it('maintains checked state through updates', async () => {
    element.checked = true;
    await element.updateComplete;

    element.size = 'lg';
    await element.updateComplete;

    const input = element.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(input?.checked).toBe(true);
  });

  it('renders with multiple properties combined', async () => {
    element.checked = true;
    element.size = 'lg';
    element.name = 'test';
    element.value = 'value1';
    await element.updateComplete;

    const input = element.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(input?.checked).toBe(true);
    expect(input?.className).toContain('size-6');
    expect(input?.name).toBe('test');
    expect(input?.value).toBe('value1');
  });
});
