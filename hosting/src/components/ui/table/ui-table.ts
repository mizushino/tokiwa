import { LitElement, css, html, type CSSResultGroup, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { tailwindCSS } from '@app/styles';

/**
 * Column definition for the table.
 */
export interface TableColumn<T = unknown> {
  /** Column key (used for accessing data) */
  key: string;
  /** Column header label */
  label: string;
  /** Whether this column is sortable */
  sortable?: boolean;
  /** Whether this column is searchable (default: true if no render function) */
  searchable?: boolean;
  /** Custom cell renderer (optional) */
  render?: (row: T, key: string) => TemplateResult | string;
  /** Column width class (optional) */
  width?: string;
  /** Text alignment (default: 'left') */
  align?: 'left' | 'center' | 'right';
}

/**
 * Sort state for the table.
 */
export interface TableSort {
  /** Column key being sorted */
  key: string;
  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * Flexible table component with sorting support.
 *
 * Usage:
 * ```ts
 * const columns: TableColumn[] = [
 *   { key: 'name', label: 'Name', sortable: true },
 *   { key: 'email', label: 'Email', sortable: true },
 *   { key: 'role', label: 'Role' },
 * ];
 *
 * const data = [
 *   { name: 'John', email: 'john@example.com', role: 'Admin' },
 *   { name: 'Jane', email: 'jane@example.com', role: 'User' },
 * ];
 *
 * html`<ui-table .columns=${columns} .data=${data}></ui-table>`
 * ```
 */
@customElement('ui-table')
export class UiTable extends LitElement {
  static override styles: CSSResultGroup = [
    tailwindCSS,
    css`
      :host {
        display: block;
      }
    `,
  ];

  @property({ type: Array })
  columns: TableColumn[] = [];

  @property({ type: Array })
  data: unknown[] = [];

  /**
   * Default sort configuration. Applied on first render.
   * Example: { key: 'data.createdAt', direction: 'desc' }
   */
  @property({ type: Object })
  defaultSort?: TableSort;

  @state()
  private sort?: TableSort;

  private defaultSortApplied = false;

  @property({ type: String })
  filter = '';

  /**
   * Get nested property value using dot notation.
   * Example: getNestedValue(user, 'profile.name') => user.profile.name
   */
  private getNestedValue(obj: unknown, path: string): unknown {
    return path.split('.').reduce((current, key) => {
      return current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined;
    }, obj);
  }

  private applyDefaultSortIfNeeded(): void {
    if (!this.defaultSortApplied && this.defaultSort && !this.sort) {
      this.sort = { ...this.defaultSort };
      this.defaultSortApplied = true;
    }
  }

  private get filteredData(): unknown[] {
    this.applyDefaultSortIfNeeded();
    if (!this.filter) return this.data;

    const searchTerm = this.filter.toLowerCase();

    return this.data.filter((row) => {
      return this.columns.some((column) => {
        if (column.searchable === false) return false;

        const value = this.getNestedValue(row, column.key);
        if (value == null) return false;

        return String(value).toLowerCase().includes(searchTerm);
      });
    });
  }

  private get sortedData(): unknown[] {
    if (!this.sort) return this.filteredData;

    const sortKey = this.sort.key;
    const sortDirection = this.sort.direction;

    return [...this.filteredData].sort((a, b) => {
      const aVal = this.getNestedValue(a, sortKey) ?? '';
      const bVal = this.getNestedValue(b, sortKey) ?? '';

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  private handleSort(column: TableColumn): void {
    if (!column.sortable) return;

    const newDirection = this.sort?.key === column.key && this.sort.direction === 'asc' ? 'desc' : 'asc';

    this.sort = {
      key: column.key,
      direction: newDirection,
    };
  }

  private renderSortIndicator(column: TableColumn): TemplateResult | string {
    if (!column.sortable) return '';

    const isActive = this.sort?.key === column.key;
    const isAscending = isActive && this.sort?.direction === 'asc';
    const iconClasses = isActive
      ? 'ml-2 flex-none rounded-sm bg-gray-100 text-gray-900 group-hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:group-hover:bg-gray-700'
      : 'ml-2 flex-none rounded-sm text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-400';

    const svgClasses = isAscending ? 'size-5 rotate-180' : 'size-5';

    return html`
      <span class="${iconClasses}">
        <svg viewBox="0 0 20 20" fill="currentColor" data-slot="icon" aria-hidden="true" class="${svgClasses}">
          <path
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clip-rule="evenodd"
            fill-rule="evenodd"
          />
        </svg>
      </span>
    `;
  }

  private renderColumnHeader(column: TableColumn, index: number): TemplateResult {
    const alignClass =
      column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left';
    const headerClasses =
      index === 0
        ? `py-3.5 pr-3 pl-4 ${alignClass} text-sm font-semibold text-gray-900 sm:pl-0 dark:text-white`
        : `px-3 py-3.5 ${alignClass} text-sm font-semibold text-gray-900 dark:text-white`;

    if (column.sortable) {
      const flexJustify = column.align === 'right' ? 'justify-end' : column.align === 'center' ? 'justify-center' : '';
      return html`
        <th scope="col" class="${headerClasses} ${column.width || ''}">
          <a
            href="#"
            class="group ${flexJustify} inline-flex"
            @click=${(e: Event) => {
              e.preventDefault();
              this.handleSort(column);
            }}
          >
            ${column.label} ${this.renderSortIndicator(column)}
          </a>
        </th>
      `;
    }

    return html`<th scope="col" class="${headerClasses} ${column.width || ''}">${column.label}</th>`;
  }

  private renderCell(row: unknown, column: TableColumn, index: number): TemplateResult {
    const alignClass =
      column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left';
    const cellClasses =
      index === 0
        ? `py-4 pr-3 pl-4 text-sm font-medium whitespace-nowrap ${alignClass} text-gray-900 sm:pl-0 dark:text-white`
        : `px-3 py-4 text-sm whitespace-nowrap ${alignClass} text-gray-500 dark:text-gray-400`;

    const value = column.render ? column.render(row, column.key) : this.getNestedValue(row, column.key);

    return html`<td class="${cellClasses}">${value}</td>`;
  }

  private renderRow(row: unknown, _rowIndex: number): TemplateResult {
    return html`<tr>
      ${this.columns.map((column, index) => this.renderCell(row, column, index))}
    </tr>`;
  }

  protected override render(): TemplateResult {
    return html`
      <div class="relative min-w-full overflow-x-auto">
        <div class="inline-block min-w-full py-2 align-middle">
          <table class="relative min-w-full divide-y divide-gray-300 dark:divide-white/15">
            <thead class="bg-gray-50 dark:bg-gray-800">
              <tr>
                ${this.columns.map((column, index) => this.renderColumnHeader(column, index))}
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white dark:divide-white/10 dark:bg-gray-900">
              ${this.sortedData.map((row, index) => this.renderRow(row, index))}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-table': UiTable;
  }
}
