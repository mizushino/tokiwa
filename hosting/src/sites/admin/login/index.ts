import { GoogleAuthProvider, TwitterAuthProvider } from 'firebase/auth';
import { html, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { AuthError, signInWithEmail, signInWithProvider, type AuthErrorCode } from '@app/auth';
import { PageElement } from '@app/page';

import pageMetadata from './page.json';

import '@components/ui/button/ui-button';
import '@components/ui/checkbox/ui-checkbox';
import '@components/ui/language-switcher/ui-language-switcher';

@customElement('admin-login')
export class AdminLogin extends PageElement {
  protected pageMetadata = pageMetadata;

  @state()
  private isLoading = false;

  @state()
  private errorMessage = '';

  private readonly inputClass =
    'focus:outline-primary-600 dark:focus:outline-primary-500 block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500';

  private getRedirectUrl(): string {
    const params = new URLSearchParams(window.location.search);
    return params.get('redirect') || '/';
  }

  private redirectAfterLogin(): void {
    window.location.href = this.getRedirectUrl();
  }

  private handleSubmit = async (e: Event): Promise<void> => {
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    this.isLoading = true;
    this.errorMessage = '';

    try {
      await signInWithEmail(email, password);
      this.redirectAfterLogin();
    } catch (error) {
      if (error instanceof AuthError) {
        this.errorMessage = this.getErrorMessage(error.code);
      } else {
        this.errorMessage = this.trans('err_login_failed');
      }
    } finally {
      this.isLoading = false;
    }
  };

  private handleGoogleLogin = async (): Promise<void> => {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const provider = new GoogleAuthProvider();
      await signInWithProvider(provider, undefined, true);
      this.redirectAfterLogin();
    } catch (error) {
      if (error instanceof AuthError) {
        this.errorMessage = this.getErrorMessage(error.code);
      } else {
        this.errorMessage = this.trans('err_google_login');
      }
    } finally {
      this.isLoading = false;
    }
  };

  private handleTwitterLogin = async (): Promise<void> => {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const provider = new TwitterAuthProvider();
      await signInWithProvider(provider, undefined, true);
      this.redirectAfterLogin();
    } catch (error) {
      if (error instanceof AuthError) {
        this.errorMessage = this.getErrorMessage(error.code);
      } else {
        this.errorMessage = this.trans('err_twitter_login');
      }
    } finally {
      this.isLoading = false;
    }
  };

  private getErrorMessage(code: AuthErrorCode): string {
    switch (code) {
      case 'EMAIL_REQUIRED':
        return this.trans('err_email_required');
      case 'PASSWORD_REQUIRED':
        return this.trans('err_password_required');
      case 'INVALID_CREDENTIALS':
        return this.trans('err_invalid_credentials');
      case 'LOGIN_FAILED':
        return this.trans('err_login_failed');
      case 'EMAIL_NOT_VERIFIED':
        return this.trans('err_email_not_verified');
      case 'ACCOUNT_LINKING_REQUIRED':
        return this.trans('err_account_linking');
      default:
        return this.trans('err_generic');
    }
  }

  protected renderHeader(): TemplateResult {
    return html`
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <div class="text-center">
          <i class="fa-solid fa-cube text-5xl text-primary-800 dark:text-primary-400"></i>
        </div>
        <h2 class="mt-6 text-center text-2xl/9 font-bold tracking-tight text-gray-900 dark:text-white">
          ${this.trans('sign_in_title')}
        </h2>
      </div>
    `;
  }

  protected renderEmailField(): TemplateResult {
    return html`
      <div>
        <label for="email" class="block text-sm/6 font-medium text-gray-900 dark:text-white"
          >${this.trans('email')}</label
        >
        <div class="mt-2">
          <input id="email" type="email" name="email" required autocomplete="email" class=${this.inputClass} />
        </div>
      </div>
    `;
  }

  protected renderPasswordField(): TemplateResult {
    return html`
      <div>
        <label for="password" class="block text-sm/6 font-medium text-gray-900 dark:text-white"
          >${this.trans('password')}</label
        >
        <div class="mt-2">
          <input
            id="password"
            type="password"
            name="password"
            required
            autocomplete="current-password"
            class=${this.inputClass}
          />
        </div>
      </div>
    `;
  }

  protected renderErrorMessage(): TemplateResult {
    if (!this.errorMessage) {
      return html``;
    }

    return html`
      <div class="rounded-md bg-danger-50 p-4 dark:bg-danger-900/20">
        <div class="flex">
          <div class="shrink-0">
            <svg
              class="size-5 text-danger-400 dark:text-danger-500"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-danger-800 dark:text-danger-200">${this.errorMessage}</p>
          </div>
        </div>
      </div>
    `;
  }

  protected renderForm(): TemplateResult {
    return html`
      <form @submit=${this.handleSubmit} class="space-y-6">
        ${this.renderErrorMessage()} ${this.renderEmailField()} ${this.renderPasswordField()}
        <ui-checkbox name="remember-me">${this.trans('remember_me')}</ui-checkbox>
        <!--
          Native submit button: a submit control inside a nested custom element's shadow root
          would not be associated with this form, so we keep it native and reuse the primary
          button palette. Non-submit actions (social login) use <ui-button>.
        -->
        <button
          type="submit"
          ?disabled=${this.isLoading}
          class="flex w-full justify-center rounded-md bg-primary-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-primary-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-primary-500 dark:shadow-none dark:hover:bg-primary-400 dark:focus-visible:outline-primary-500"
        >
          ${this.isLoading ? this.trans('logging_in') : this.trans('login')}
        </button>
      </form>
    `;
  }

  protected renderSocialLogin(): TemplateResult {
    return html`
      <div>
        <div class="mt-10 flex items-center gap-x-6">
          <div class="w-full flex-1 border-t border-gray-200 dark:border-white/10"></div>
          <p class="text-sm/6 font-medium text-nowrap text-gray-900 dark:text-white">
            ${this.trans('or_continue_with')}
          </p>
          <div class="w-full flex-1 border-t border-gray-200 dark:border-white/10"></div>
        </div>

        <div class="mt-6 grid grid-cols-2 gap-4">
          <ui-button variant="secondary" fullWidth ?disabled=${this.isLoading} @click=${this.handleGoogleLogin}>
            <span class="flex items-center gap-3">
              <svg viewBox="0 0 24 24" aria-hidden="true" class="h-5 w-5">
                <path
                  d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                  fill="#EA4335"
                />
                <path
                  d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                  fill="#4285F4"
                />
                <path
                  d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                  fill="#FBBC05"
                />
                <path
                  d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
                  fill="#34A853"
                />
              </svg>
              <span class="text-sm/6 font-semibold">Google</span>
            </span>
          </ui-button>

          <ui-button variant="secondary" fullWidth ?disabled=${this.isLoading} @click=${this.handleTwitterLogin}>
            <span class="flex items-center gap-3">
              <svg viewBox="0 0 24 24" aria-hidden="true" class="size-5">
                <path
                  d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                  fill="currentColor"
                />
              </svg>
              <span class="text-sm/6 font-semibold">X (Twitter)</span>
            </span>
          </ui-button>
        </div>
      </div>
    `;
  }

  protected override renderContents(): TemplateResult {
    return html`
      <div class="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8">
        ${this.renderHeader()}

        <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-120">
          <div class="flex justify-end">
            <ui-language-switcher variant="secondary"></ui-language-switcher>
          </div>
          <div
            class="mt-3 bg-white px-6 py-12 shadow-sm sm:rounded-lg sm:px-12 dark:bg-gray-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10"
          >
            ${this.renderForm()} ${this.renderSocialLogin()}
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'admin-login': AdminLogin;
  }
}
