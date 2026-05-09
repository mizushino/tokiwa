export function proxyShadowQueries<T extends HTMLElement>(element: T): T {
  const hostQuerySelector = element.querySelector.bind(element);
  const hostQuerySelectorAll = element.querySelectorAll.bind(element);

  element.querySelector = ((selectors: string) => {
    return element.shadowRoot?.querySelector(selectors) ?? hostQuerySelector(selectors);
  }) as typeof element.querySelector;

  element.querySelectorAll = ((selectors: string) => {
    const shadowMatches = element.shadowRoot?.querySelectorAll(selectors);
    return shadowMatches && shadowMatches.length > 0 ? shadowMatches : hostQuerySelectorAll(selectors);
  }) as typeof element.querySelectorAll;

  return element;
}
