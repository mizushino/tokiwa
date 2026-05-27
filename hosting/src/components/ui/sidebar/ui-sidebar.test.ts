import type { User } from 'firebase/auth';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { proxyShadowQueries } from '@app/../test/query-shadow-root';
import * as NavigateModule from '@app/page';

import type { SidebarNavItem, UiSidebar } from './ui-sidebar';

import './ui-sidebar';

describe('UiSidebar', () => {
  let element: UiSidebar;
  let container: HTMLElement;
  let navigateToSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    element = proxyShadowQueries(document.createElement('ui-sidebar') as UiSidebar);
    container.appendChild(element);

    navigateToSpy = vi.spyOn(NavigateModule.Navigate, 'to').mockResolvedValue();
  });

  afterEach(() => {
    container.remove();
    vi.clearAllMocks();
  });

  it('renders with default properties', async () => {
    await element.updateComplete;
    expect(element).toBeDefined();
    expect(element.navItems).toEqual([]);
  });

  it('renders default Font Awesome icon', async () => {
    await element.updateComplete;
    const icon = element.querySelector('i.fa-solid.fa-cube');
    expect(icon).toBeTruthy();
    expect(icon?.className).toContain('text-primary-500');
  });

  it('renders custom logo via slot', async () => {
    const img = document.createElement('img');
    img.setAttribute('slot', 'logo');
    img.src = 'https://example.com/logo.png';
    img.alt = 'Custom Logo';
    element.appendChild(img);
    await element.updateComplete;

    const customLogo = element.querySelector('img[slot="logo"]') as HTMLImageElement;
    expect(customLogo).toBeTruthy();
    expect(customLogo.src).toBe('https://example.com/logo.png');
  });

  it('renders navigation items', async () => {
    const navItems: SidebarNavItem[] = [
      { label: 'Dashboard', href: '/dashboard', active: true },
      { label: 'Settings', href: '/settings' },
    ];
    element.navItems = navItems;
    await element.updateComplete;

    const links = element.querySelectorAll('a[href^="/"]');
    expect(links.length).toBeGreaterThanOrEqual(2);
    expect(links[0].textContent?.trim()).toContain('Dashboard');
    expect(links[1].textContent?.trim()).toContain('Settings');
  });

  it('renders navigation item with badge', async () => {
    const navItems: SidebarNavItem[] = [{ label: 'Notifications', href: '/notifications', badge: 5 }];
    element.navItems = navItems;
    await element.updateComplete;

    const badge = element.querySelector('span[aria-hidden="true"]');
    expect(badge?.textContent).toBe('5');
  });

  it('renders divider items', async () => {
    const navItems: SidebarNavItem[] = [
      { label: 'Main', divider: true },
      { label: 'Dashboard', href: '/dashboard' },
    ];
    element.navItems = navItems;
    await element.updateComplete;

    const divider = element.querySelector('.text-gray-400');
    expect(divider?.textContent).toContain('Main');
  });

  it('does not render profile when no user', async () => {
    element.currentUser = null;
    await element.updateComplete;

    const profileLink = element.querySelector('a[href="#"]');
    expect(profileLink).toBeNull();
  });

  it('renders user profile when currentUser is set', async () => {
    const mockUser = {
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: 'https://example.com/avatar.jpg',
    } as User;

    element.currentUser = mockUser;
    await element.updateComplete;

    const profileLink = element.querySelector('a[href="#"]');
    expect(profileLink).toBeTruthy();
    expect(profileLink?.textContent).toContain('Test User');

    const avatar = profileLink?.querySelector('img') as HTMLImageElement;
    expect(avatar.src).toBe('https://example.com/avatar.jpg');
  });

  it('renders fallback avatar when no photoURL', async () => {
    const mockUser = {
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: null,
    } as User;

    element.currentUser = mockUser;
    await element.updateComplete;

    const avatar = element.querySelector('a[href="#"] img') as HTMLImageElement;
    expect(avatar.src).toContain('gravatar.com');
  });

  it('emits userclick event when profile is clicked', async () => {
    const mockUser = {
      displayName: 'Test User',
      email: 'test@example.com',
    } as User;

    element.currentUser = mockUser;
    await element.updateComplete;

    const eventHandler = vi.fn();
    element.addEventListener('userclick', eventHandler);

    const profileLink = element.querySelector('a[href="#"]') as HTMLAnchorElement;
    profileLink.click();

    expect(eventHandler).toHaveBeenCalledOnce();
  });

  it('highlights active navigation item based on pathname', async () => {
    const originalPathname = window.location.pathname;
    Object.defineProperty(window, 'location', {
      value: { ...window.location, pathname: '/dashboard' },
      writable: true,
    });

    const navItems: SidebarNavItem[] = [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Settings', href: '/settings' },
    ];
    element.navItems = navItems;
    await element.updateComplete;

    const links = element.querySelectorAll('a[href^="/"]');
    const activeLink = links[0] as HTMLAnchorElement;
    const inactiveLink = links[1] as HTMLAnchorElement;

    expect(activeLink.className.length).toBeGreaterThan(0);
    expect(inactiveLink.className.length).toBeGreaterThan(0);
    expect(activeLink.className).not.toBe(inactiveLink.className);

    Object.defineProperty(window, 'location', {
      value: { ...window.location, pathname: originalPathname },
      writable: true,
    });
  });

  it('does not navigate when href is "#"', async () => {
    const navItems: SidebarNavItem[] = [{ label: 'Non-link', href: '#' }];
    element.navItems = navItems;
    await element.updateComplete;

    const link = element.querySelector('a[href="#"]') as HTMLAnchorElement;
    expect(link).toBeTruthy();

    link.click();
    await element.updateComplete;
    expect(navigateToSpy).not.toHaveBeenCalled();
  });

  it('does not navigate when href is undefined', async () => {
    const navItems: SidebarNavItem[] = [{ label: 'No link', divider: false }];
    element.navItems = navItems;
    await element.updateComplete;

    const link = element.querySelector('a') as HTMLAnchorElement;
    if (link) {
      link.click();
      await element.updateComplete;
      expect(navigateToSpy).not.toHaveBeenCalled();
    }
  });

  it('navigates to href when valid link is clicked', async () => {
    const navItems: SidebarNavItem[] = [{ label: 'Dashboard', href: '/dashboard' }];
    element.navItems = navItems;
    await element.updateComplete;

    const link = element.querySelector('a[href="/dashboard"]') as HTMLAnchorElement;
    expect(link).toBeTruthy();

    link.click();
    await element.updateComplete;
    expect(navigateToSpy).toHaveBeenCalledWith('/dashboard');
  });

  it('renders user email when displayName is not set', async () => {
    const mockUser = {
      email: 'test@example.com',
      displayName: null,
    } as User;

    element.currentUser = mockUser;
    await element.updateComplete;

    const profileLink = element.querySelector('a[href="#"]');
    expect(profileLink?.textContent).toContain('test@example.com');
  });

  it('renders "User" when both displayName and email are not set', async () => {
    const mockUser = {
      displayName: null,
      email: null,
    } as User;

    element.currentUser = mockUser;
    await element.updateComplete;

    const profileLink = element.querySelector('a[href="#"]');
    expect(profileLink?.textContent).toContain('User');
  });
});
