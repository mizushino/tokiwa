import { html, type TemplateResult } from 'lit';

export type PageAccent = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';

const HERO_GRADIENT: Record<PageAccent, string> = {
  primary: 'from-primary-500 to-primary-700',
  secondary: 'from-secondary-500 to-secondary-700',
  success: 'from-success-500 to-success-700',
  danger: 'from-danger-500 to-danger-700',
  warning: 'from-warning-500 to-warning-700',
  info: 'from-info-500 to-info-700',
};

const CHIP_ACCENT: Record<PageAccent, string> = {
  primary: 'bg-primary-100 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400',
  secondary: 'bg-secondary-100 text-secondary-600 dark:bg-secondary-500/20 dark:text-secondary-400',
  success: 'bg-success-100 text-success-600 dark:bg-success-500/20 dark:text-success-400',
  danger: 'bg-danger-100 text-danger-600 dark:bg-danger-500/20 dark:text-danger-400',
  warning: 'bg-warning-100 text-warning-600 dark:bg-warning-500/20 dark:text-warning-400',
  info: 'bg-info-100 text-info-600 dark:bg-info-500/20 dark:text-info-400',
};

/**
 * Outer page container: a centered column with consistent spacing.
 * Every page wraps its content in this so pages share the same width and rhythm.
 */
export function pageContainer(content: unknown): TemplateResult {
  return html`<div class="mx-auto max-w-4xl space-y-6 p-4">${content}</div>`;
}

export function pageHero({
  title,
  description,
  accent = 'primary',
}: {
  title: string;
  description?: string;
  accent?: PageAccent;
}): TemplateResult {
  return html`
    <div class="${HERO_GRADIENT[accent]} relative overflow-hidden rounded-2xl bg-linear-to-br p-6 text-white shadow-xl">
      <h1 class="text-3xl font-bold">${title}</h1>
      ${description ? html`<p class="mt-2 text-sm text-white/90">${description}</p>` : ''}
    </div>
  `;
}

export function pageCard(content: unknown, extraClass = ''): TemplateResult {
  return html`
    <div
      class="${extraClass} rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
    >
      ${content}
    </div>
  `;
}

export function cardHeading({
  title,
  description,
  accent = 'primary',
  icon,
}: {
  title: string;
  description?: string;
  accent?: PageAccent;
  icon?: TemplateResult;
}): TemplateResult {
  return html`
    <div class="mb-3 flex items-center gap-2">
      ${icon ? html`<span class="${CHIP_ACCENT[accent]} rounded-lg p-2">${icon}</span>` : ''}
      <h2 class="text-xl font-bold text-gray-900 dark:text-white">${title}</h2>
    </div>
    ${description ? html`<p class="mb-4 text-sm text-gray-500 dark:text-gray-400">${description}</p>` : ''}
  `;
}

export function pageSection(
  { title, description }: { title: string; description?: string },
  content: unknown
): TemplateResult {
  return html`
    <div>
      <h2 class="mb-1 text-lg font-semibold text-gray-900 dark:text-white">${title}</h2>
      ${description ? html`<p class="mb-6 text-sm text-gray-500 dark:text-gray-400">${description}</p>` : ''} ${content}
    </div>
  `;
}
