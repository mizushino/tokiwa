import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { proxyShadowQueries } from '@app/../test/query-shadow-root';

import type { InputSize, UiInput } from './ui-input';

import './ui-input';

describe('UiInput', () => {
  let element: UiInput;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    element = proxyShadowQueries(document.createElement('ui-input') as UiInput);
    container.appendChild(element);
  });

  afterEach(() => {
    container.remove();
  });

  it('renders with default properties', async () => {
    await element.updateComplete;
    expect(element.value).toBe('');
    expect(element.type).toBe('text');
    expect(element.size).toBe('md');
    expect(element.disabled).toBe(false);
    expect(element.required).toBe(false);
    expect(element.label).toBe('');
    expect(element.error).toBe('');
  });

  it('renders a text input element', async () => {
    await element.updateComplete;
    const input = element.querySelector('input');
    expect(input).toBeInstanceOf(HTMLInputElement);
    expect(input?.type).toBe('text');
  });

  it('does not render a label by default', async () => {
    await element.updateComplete;
    expect(element.querySelector('label')).toBeNull();
  });

  it('renders a label when provided', async () => {
    element.label = 'Name';
    await element.updateComplete;
    const label = element.querySelector('label');
    expect(label?.textContent?.trim()).toBe('Name');
  });

  it('reflects the type property to the input', async () => {
    element.type = 'email';
    await element.updateComplete;
    const input = element.querySelector('input') as HTMLInputElement;
    expect(input.type).toBe('email');
  });

  it('forwards inputId to the input id and label for', async () => {
    element.inputId = 'name-input';
    element.label = 'Name';
    await element.updateComplete;
    const input = element.querySelector('input') as HTMLInputElement;
    const label = element.querySelector('label') as HTMLLabelElement;
    expect(input.id).toBe('name-input');
    expect(label.htmlFor).toBe('name-input');
  });

  it('sets the value on the input', async () => {
    element.value = 'hello';
    await element.updateComplete;
    const input = element.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('hello');
  });

  it('sets placeholder, name and required', async () => {
    element.placeholder = 'Enter…';
    element.name = 'field';
    element.required = true;
    await element.updateComplete;
    const input = element.querySelector('input') as HTMLInputElement;
    expect(input.placeholder).toBe('Enter…');
    expect(input.name).toBe('field');
    expect(input.required).toBe(true);
  });

  it('disables the input', async () => {
    element.disabled = true;
    await element.updateComplete;
    const input = element.querySelector('input') as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });

  it('applies size classes', async () => {
    const expected: Record<InputSize, string> = {
      sm: 'py-1.5',
      md: 'py-2',
      lg: 'py-2.5',
    };
    for (const size of Object.keys(expected) as InputSize[]) {
      element.size = size;
      await element.updateComplete;
      const input = element.querySelector('input');
      expect(input?.className).toContain(expected[size]);
    }
  });

  it('applies normal border classes without error', async () => {
    await element.updateComplete;
    const input = element.querySelector('input');
    expect(input?.className).toContain('border-gray-300');
    expect(input?.className).not.toContain('border-danger-500');
  });

  it('applies error state classes and message when error is set', async () => {
    element.error = 'Required';
    await element.updateComplete;
    const input = element.querySelector('input');
    expect(input?.className).toContain('border-danger-500');
    const message = element.querySelector('p');
    expect(message?.textContent?.trim()).toBe('Required');
  });

  it('emits input event with value detail on typing', async () => {
    await element.updateComplete;
    const handler = vi.fn();
    element.addEventListener('input', handler);

    const input = element.querySelector('input') as HTMLInputElement;
    input.value = 'typed';
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));

    expect(element.value).toBe('typed');
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail.value).toBe('typed');
  });

  it('emits change event with value detail', async () => {
    await element.updateComplete;
    const handler = vi.fn();
    element.addEventListener('change', handler);

    const input = element.querySelector('input') as HTMLInputElement;
    input.value = 'committed';
    input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));

    expect(element.value).toBe('committed');
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail.value).toBe('committed');
  });
});
