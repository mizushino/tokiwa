export function getSafeLoginRedirect(search: string, origin: string): string {
  const redirect = new URLSearchParams(search).get('redirect');
  if (!redirect?.startsWith('/') || redirect.startsWith('//')) {
    return '/';
  }

  try {
    const redirectUrl = new URL(redirect, origin);
    if (redirectUrl.origin !== new URL(origin).origin) {
      return '/';
    }
    return `${redirectUrl.pathname}${redirectUrl.search}${redirectUrl.hash}`;
  } catch {
    return '/';
  }
}
