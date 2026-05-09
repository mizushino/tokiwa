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
      { path: '', render: () => this.renderIndex() },
      { path: 'helloworld/', render: () => html`<default-helloworld></default-helloworld>` },
      { path: 'counter/', render: () => html`<default-counter></default-counter>` },
      { path: 'firestore/', render: () => html`<default-firestore></default-firestore>` },
      { path: 'functions/', render: () => html`<default-functions></default-functions>` },
    ],
    { fallback: { render: () => html`Not Found` } }
  );

  protected renderIndex(): TemplateResult {
    return html`
      <div class="space-y-2 p-2">
        <h1>Sample</h1>
        <p>新しいフレームワーク用の最小サンプルです。</p>
        <h1>Index</h1>
      </div>
    `;
  }

  protected override render(): TemplateResult {
    return html`
      <div class="min-h-full w-full bg-white dark:bg-gray-900 dark:text-white dark:scheme-dark">
        <h1 class="p-2">Example</h1>
        <div class="m-2 border p-2">${this.routes.outlet()}</div>
        <hr />
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
