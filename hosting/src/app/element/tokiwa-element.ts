import { LitElement, type CSSResultGroup } from 'lit';

import tailwindCssText from './tailwind.css?inline';

const tailwindSheet = new CSSStyleSheet();
tailwindSheet.replaceSync(tailwindCssText);

export class TokiwaElement extends LitElement {
  static override styles: CSSResultGroup = [tailwindSheet];
}
