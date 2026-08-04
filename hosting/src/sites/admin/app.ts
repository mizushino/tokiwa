import { Router } from '@lit-labs/router';
import { setupFirestore } from '@mzsn/firestore/web';
import { type FirebaseApp, type FirebaseOptions, initializeApp } from 'firebase/app';
import { browserLocalPersistence, browserPopupRedirectResolver, indexedDBLocalPersistence } from 'firebase/auth';
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type FirestoreSettings,
} from 'firebase/firestore';
import { LitElement, css, html, type CSSResultGroup, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { share } from 'lit-share';
import { URLPattern } from 'urlpattern-polyfill';

import { initializeAnalyticsIfSupported } from '@app/analytics';
import { initializeAuth, type FirebaseAuthSettings } from '@app/auth';
import { allowsDemoFirebaseConfig, getFirebaseConfig } from '@app/firebase-config';
import { type FunctionsSettings, initializeFunctions } from '@app/functions';
import { seedPreferredLanguageIfUnset, tGlobal } from '@app/i18n';
import { setPageAnalytics } from '@app/page';
import { tailwindCSS } from '@app/styles';

import './index';
import './app.css';

declare global {
  interface Window {
    URLPattern?: typeof URLPattern;
  }
}

const urlPatternPolyfill = URLPattern as unknown as typeof globalThis.URLPattern;

if (window.URLPattern === undefined) {
  Object.defineProperty(window, 'URLPattern', {
    value: urlPatternPolyfill,
    configurable: true,
    writable: true,
  });
}

@customElement('admin-app')
export class AdminApp extends LitElement {
  static override styles: CSSResultGroup = [
    tailwindCSS,
    css`
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }
    `,
  ];

  private readonly useEmulator = import.meta.env.MODE === 'emulator' || import.meta.env.VITE_USE_EMULATOR === 'true';

  private firebaseConfig = getFirebaseConfig(import.meta.env as Record<string, string | undefined>, {
    allowDemoFallback: allowsDemoFirebaseConfig(import.meta.env.MODE),
  }) as FirebaseOptions;

  private firestoreSetting = {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  } as FirestoreSettings;

  private functionsSetting = {
    region: 'asia-northeast1',
  } as FunctionsSettings;

  private authSetting = {
    persistence: [indexedDBLocalPersistence, browserLocalPersistence],
    popupRedirectResolver: browserPopupRedirectResolver,
    ...(this.useEmulator && {
      emulatorUrl: 'http://localhost:9099',
    }),
  } as FirebaseAuthSettings;

  @share() protected firebaseApp?: FirebaseApp;

  @share() private router = new Router(
    this,
    [{ path: '/*', render: () => html`<admin-index class="block h-full w-full"></admin-index>` }],
    {
      fallback: { render: () => html`${tGlobal('not_found')}` },
    }
  );

  public override connectedCallback(): void {
    super.connectedCallback();

    seedPreferredLanguageIfUnset('ja');

    const firebaseApp = initializeApp(this.firebaseConfig);
    this.firebaseApp = firebaseApp;
    const firestore = initializeFirestore(firebaseApp, this.firestoreSetting);
    if (this.useEmulator) {
      connectFirestoreEmulator(firestore, 'localhost', 8080);
    }
    setupFirestore(firestore);
    initializeFunctions(firebaseApp, this.functionsSetting);
    setPageAnalytics(undefined);
    if (!this.useEmulator && this.firebaseConfig.measurementId) {
      void initializeAnalyticsIfSupported(firebaseApp).then(setPageAnalytics);
    }
    initializeAuth(firebaseApp, this.authSetting);
  }

  protected override render(): TemplateResult {
    return this.router.outlet() as TemplateResult;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'admin-app': AdminApp;
  }
}
