import { translateMessage } from './messages';

export function tGlobal(code: string): string {
  return translateMessage(`global.${code}`) ?? code;
}
