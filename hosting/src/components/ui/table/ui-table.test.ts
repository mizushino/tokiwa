import { html } from 'lit';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { proxyShadowQueries } from '@app/../test/query-shadow-root';

import type { TableColumn, UiTable } from './ui-table';

import './ui-table';

interface TestData {
  id: number;
  name: string;
  email: string;
  role: string;
}

describe('UiTable', () => {
  let element: UiTable;
  let container: HTMLElement;

  const sampleColumns: TableColumn<TestData>[] = [
    { key: 'id', label: 'ID', sortable: true, width: 'w-16' },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'role', label: 'Role' },
  ];

  const sampleData: TestData[] = [
    { id: 1, name: 'Alice', email: 'alice@example.com', role: 'Admin' },
    { id: 2, name: 'Bob', email: 'bob@example.com', role: 'User' },
    { id: 3, name: 'Charlie', email: 'charlie@example.com', role: 'User' },
  ];

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    element = proxyShadowQueries(document.createElement('ui-table') as UiTable);
    container.appendChild(element);
  });

  afterEach(() => {
    container.remove();
  });

  it('renders with default properties', async () => {
    await element.updateComplete;
    expect(element).toBeDefined();
    expect(element.columns).toEqual([]);
    expect(element.data).toEqual([]);
    expect(element.filter).toBe('');
  });

  it('renders table with columns and data', async () => {
    element.columns = sampleColumns as TableColumn[];
    element.data = sampleData;
    await element.updateComplete;

    const headers = element.querySelectorAll('th');
    expect(headers.length).toBe(4);
    expect(headers[0].textContent?.trim()).toContain('ID');
    expect(headers[1].textContent?.trim()).toContain('Name');
    expect(headers[2].textContent?.trim()).toContain('Email');
    expect(headers[3].textContent?.trim()).toContain('Role');

    const rows = element.querySelectorAll('tbody tr');
    expect(rows.length).toBe(3);
  });

  it('renders cell content correctly', async () => {
    element.columns = sampleColumns as TableColumn[];
    element.data = sampleData;
    await element.updateComplete;

    const firstRow = element.querySelector('tbody tr');
    const cells = firstRow?.querySelectorAll('td');
    expect(cells?.[0].textContent?.trim()).toBe('1');
    expect(cells?.[1].textContent?.trim()).toBe('Alice');
    expect(cells?.[2].textContent?.trim()).toBe('alice@example.com');
    expect(cells?.[3].textContent?.trim()).toBe('Admin');
  });

  it('renders sortable column headers with sort indicator', async () => {
    element.columns = sampleColumns as TableColumn[];
    element.data = sampleData;
    await element.updateComplete;

    const sortableHeaders = element.querySelectorAll('th a.group');
    expect(sortableHeaders.length).toBe(3); // ID, Name, Email are sortable

    const sortIndicator = sortableHeaders[0].querySelector('span');
    expect(sortIndicator).toBeTruthy();
  });

  it('renders non-sortable column header without link', async () => {
    element.columns = sampleColumns as TableColumn[];
    element.data = sampleData;
    await element.updateComplete;

    const roleHeader = element.querySelectorAll('th')[3];
    const link = roleHeader.querySelector('a');
    expect(link).toBeNull();
    expect(roleHeader.textContent?.trim()).toBe('Role');
  });

  it('displays active sort indicator after clicking sortable header', async () => {
    element.columns = sampleColumns as TableColumn[];
    element.data = sampleData;
    await element.updateComplete;

    const nameHeader = element.querySelectorAll('th a.group')[1] as HTMLAnchorElement;
    nameHeader.click();
    await element.updateComplete;

    const sortIndicator = nameHeader.querySelector('span');
    expect(sortIndicator).toBeTruthy();
    expect(sortIndicator?.className).toContain('bg-gray-100');
  });

  it('renders sort indicator icon after clicking header', async () => {
    element.columns = sampleColumns as TableColumn[];
    element.data = sampleData;
    await element.updateComplete;

    const nameHeader = element.querySelectorAll('th a.group')[1] as HTMLAnchorElement;
    nameHeader.click();
    await element.updateComplete;

    const icon = nameHeader.querySelector('svg');
    expect(icon).toBeTruthy();
    expect(icon?.getAttribute('viewBox')).toBe('0 0 20 20');
  });

  it('filters data based on filter property', async () => {
    element.columns = sampleColumns as TableColumn[];
    element.data = sampleData;
    element.filter = 'alice';
    await element.updateComplete;

    const rows = element.querySelectorAll('tbody tr');
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('Alice');
  });

  it('filters data case-insensitively', async () => {
    element.columns = sampleColumns as TableColumn[];
    element.data = sampleData;
    element.filter = 'ALICE';
    await element.updateComplete;

    const rows = element.querySelectorAll('tbody tr');
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('Alice');
  });

  it('filters across multiple columns', async () => {
    element.columns = sampleColumns as TableColumn[];
    element.data = sampleData;
    element.filter = 'User';
    await element.updateComplete;

    const rows = element.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2); // Bob and Charlie have 'User' role
  });

  it('shows all data when filter is empty', async () => {
    element.columns = sampleColumns as TableColumn[];
    element.data = sampleData;
    element.filter = '';
    await element.updateComplete;

    const rows = element.querySelectorAll('tbody tr');
    expect(rows.length).toBe(3);
  });

  it('respects searchable: false on columns', async () => {
    const columns: TableColumn<TestData>[] = [
      { key: 'name', label: 'Name' },
      { key: 'role', label: 'Role', searchable: false },
    ];

    element.columns = columns as TableColumn[];
    element.data = sampleData;
    element.filter = 'Admin'; // Should not match because role is not searchable
    await element.updateComplete;

    const rows = element.querySelectorAll('tbody tr');
    expect(rows.length).toBe(0);
  });

  it('uses custom render function for cells', async () => {
    const columns: TableColumn<TestData>[] = [
      {
        key: 'name',
        label: 'Name',
        render: (row: TestData) => html`<strong>${row.name.toUpperCase()}</strong>`,
      },
    ];

    element.columns = columns as TableColumn[];
    element.data = [sampleData[0]];
    await element.updateComplete;

    const nameCell = element.querySelector('tbody td');
    const strong = nameCell?.querySelector('strong');
    expect(strong?.textContent).toBe('ALICE');
  });

  it('renders column headers', async () => {
    element.columns = sampleColumns as TableColumn[];
    element.data = sampleData;
    await element.updateComplete;

    const headers = element.querySelectorAll('th');
    expect(headers.length).toBe(4);
  });

  it('renders table cells correctly', async () => {
    element.columns = sampleColumns as TableColumn[];
    element.data = sampleData;
    await element.updateComplete;

    const firstRow = element.querySelector('tbody tr');
    const cells = firstRow?.querySelectorAll('td');
    expect(cells?.length).toBe(4);
    expect(cells?.[0].textContent).toBe('1');
    expect(cells?.[1].textContent).toBe('Alice');
  });

  it('handles null or undefined cell values', async () => {
    const dataWithNull: TestData[] = [{ id: 1, name: 'Alice', email: '', role: 'Admin' } as TestData];

    element.columns = sampleColumns as TableColumn[];
    element.data = dataWithNull;
    await element.updateComplete;

    const cells = element.querySelectorAll('tbody td');
    expect(cells[2].textContent?.trim()).toBe(''); // Empty email
  });

  it('handles null values in filter', async () => {
    const dataWithNull = [
      { id: 1, name: 'Alice', email: 'alice@example.com', role: null },
      { id: 2, name: 'Bob', email: null, role: 'User' },
    ];

    element.columns = sampleColumns as TableColumn[];
    element.data = dataWithNull;
    element.filter = 'alice';
    await element.updateComplete;

    const rows = element.querySelectorAll('tbody tr');
    expect(rows.length).toBe(1); // Only Alice matches
  });

  it('renders empty table with no data', async () => {
    element.columns = sampleColumns as TableColumn[];
    element.data = [];
    await element.updateComplete;

    const headers = element.querySelectorAll('th');
    expect(headers.length).toBe(4);

    const rows = element.querySelectorAll('tbody tr');
    expect(rows.length).toBe(0);
  });

  it('sorts data internally when header is clicked', async () => {
    const unsortedData = [
      { id: 3, name: 'Charlie', email: 'charlie@example.com', role: 'User' },
      { id: 1, name: 'Alice', email: 'alice@example.com', role: 'Admin' },
      { id: 2, name: 'Bob', email: 'bob@example.com', role: 'User' },
    ];

    element.columns = sampleColumns as TableColumn[];
    element.data = unsortedData;
    await element.updateComplete;

    // Click name header to sort ascending
    const nameHeader = element.querySelectorAll('th a.group')[1] as HTMLAnchorElement;
    nameHeader.click();
    await element.updateComplete;

    // Check that rows are sorted by name
    const rows = element.querySelectorAll('tbody tr');
    expect(rows.length).toBe(3);
    expect(rows[0].textContent).toContain('Alice');
    expect(rows[1].textContent).toContain('Bob');
    expect(rows[2].textContent).toContain('Charlie');
  });

  it('toggles sort direction on repeated clicks', async () => {
    const unsortedData = [
      { id: 3, name: 'Charlie', email: 'charlie@example.com', role: 'User' },
      { id: 1, name: 'Alice', email: 'alice@example.com', role: 'Admin' },
      { id: 2, name: 'Bob', email: 'bob@example.com', role: 'User' },
    ];

    element.columns = sampleColumns as TableColumn[];
    element.data = unsortedData;
    await element.updateComplete;

    const nameHeader = element.querySelectorAll('th a.group')[1] as HTMLAnchorElement;

    // First click: ascending
    nameHeader.click();
    await element.updateComplete;
    let rows = element.querySelectorAll('tbody tr');
    expect(rows[0].textContent).toContain('Alice');
    expect(rows[2].textContent).toContain('Charlie');

    // Second click: descending
    nameHeader.click();
    await element.updateComplete;
    rows = element.querySelectorAll('tbody tr');
    expect(rows[0].textContent).toContain('Charlie');
    expect(rows[2].textContent).toContain('Alice');
  });

  it('supports nested keys and alignment classes', async () => {
    const columns: TableColumn[] = [
      { key: 'profile.name', label: 'Name', align: 'center' },
      { key: 'stats.score', label: 'Score', sortable: true, align: 'right' },
    ];

    element.columns = columns;
    element.data = [
      { profile: { name: 'Alice' }, stats: { score: 10 } },
      { profile: { name: 'Bob' }, stats: { score: 5 } },
    ];
    await element.updateComplete;

    const headers = element.querySelectorAll('th');
    expect(headers[0].className).toContain('text-center');
    expect(headers[1].className).toContain('text-right');

    const cells = element.querySelectorAll('tbody td');
    expect(cells[0].className).toContain('text-center');
    expect(cells[1].className).toContain('text-right');
    expect(cells[0].textContent?.trim()).toBe('Alice');
    expect(cells[1].textContent?.trim()).toBe('10');
  });
});
