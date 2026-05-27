import { Routes } from '@lit-labs/router';
import { html, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

import { navigate, PageElement } from '@app/page';

import pageMetadata from './page.json';

import './helloworld';
import './counter';
import './firestore';
import './functions';

@customElement('default-index')
export class DefaultIndex extends PageElement {
  protected pageMetadata = pageMetadata;

  protected routes = new Routes(
    this,
    [
      { path: '', render: () => html`<default-helloworld></default-helloworld>` },
      { path: 'helloworld/', render: () => html`<default-helloworld></default-helloworld>` },
      { path: 'counter/', render: () => html`<default-counter></default-counter>` },
      { path: 'firestore/', render: () => html`<default-firestore></default-firestore>` },
      { path: 'functions/', render: () => html`<default-functions></default-functions>` },
    ],
    { fallback: { render: () => html`` } }
  );

  protected override render(): TemplateResult {
    return html`
      <div class="min-h-full w-full bg-white text-gray-900 dark:bg-gray-900 dark:text-white dark:scheme-dark">
        <h1 class="p-2">Example</h1>
        <div class="m-2 rounded border border-gray-300 p-4 dark:border-white/15">${this.routes.outlet()}</div>
        <hr class="border-gray-300 dark:border-white/15" />
        <div class="p-2">
          <button ${navigate('/')}>[Top]</button>
          <button ${navigate('/helloworld/')}>[HelloWorld]</button>
          <button ${navigate('/counter/')}>[Counter]</button>
          <button ${navigate('/firestore/')}>[Firestore]</button>
          <button ${navigate('/functions/')}>[Functions]</button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'default-index': DefaultIndex;
  }
}
