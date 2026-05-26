import type { CSSResultGroup } from 'lit';

import tailwindCssText from './tailwind.css?inline';

const tailwindStyleSheet = new CSSStyleSheet();
tailwindStyleSheet.replaceSync(tailwindCssText);

export const tailwindCSS: CSSResultGroup = tailwindStyleSheet;
