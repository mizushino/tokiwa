import { html, type TemplateResult } from 'lit';

/**
 * Semantic accent colors available from the Tailwind theme (see app/styles/tailwind.css).
 * Pages pick one accent to keep visual variety while staying within the design palette.
 */
export type PageAccent = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';

/**
 * Full, literal Tailwind class strings per accent.
 *
 * These MUST be written out in full (not interpolated as `from-${accent}-500`) so the
 * Tailwind scanner can detect them at build time.
 */
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

/**
 * Gradient hero header shown at the top of every page.
 *
 * @param title - Page title (rendered as the page's h1).
 * @param description - Optional supporting text.
 * @param accent - Semantic accent color for the gradient (defaults to `primary`).
 */
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
    <div class="relative overflow-hidden rounded-2xl bg-linear-to-br ${HERO_GRADIENT[accent]} p-6 text-white shadow-xl">
      <h1 class="text-3xl font-bold">${title}</h1>
      ${description ? html`<p class="mt-2 text-sm text-white/90">${description}</p>` : ''}
    </div>
  `;
}

/**
 * Card surface used to group related content on a page.
 */
export function pageCard(content: unknown, extraClass = ''): TemplateResult {
  return html`
    <div
      class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800 ${extraClass}"
    >
      ${content}
    </div>
  `;
}

/**
 * Standard card heading: an accent icon chip, a title, and an optional description.
 *
 * @param icon - Optional inline SVG rendered inside the accent chip.
 */
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
      ${icon ? html`<span class="rounded-lg p-2 ${CHIP_ACCENT[accent]}">${icon}</span>` : ''}
      <h2 class="text-xl font-bold text-gray-900 dark:text-white">${title}</h2>
    </div>
    ${description ? html`<p class="mb-4 text-sm text-gray-500 dark:text-gray-400">${description}</p>` : ''}
  `;
}

/**
 * A labelled section used by the component-showcase pages.
 */
export function pageSection(
  { title, description }: { title: string; description?: string },
  content: unknown
): TemplateResult {
  return html`
    <div>
      <h2 class="mb-1 text-lg font-semibold text-gray-900 dark:text-white">${title}</h2>
      ${description ? html`<p class="mb-6 text-sm text-gray-500 dark:text-gray-400">${description}</p>` : ''}
      ${content}
    </div>
  `;
}
