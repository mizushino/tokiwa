/**
 * Global shared translations for common UI labels and messages.
 */
export const globalTranslations: Record<'en' | 'ja', Record<string, string>> = {
  en: {
    cancel: 'Cancel',
    loading: 'Loading…',
    error: 'Error',
    success: 'Success',
    delete: 'Delete',
    confirm: 'Confirm',
    save: 'Save',
    confirm_keyword_message: 'Type {keyword} to confirm.',
    confirm_keyword_error: 'Please type "{keyword}".',
    not_found: 'Not Found',

    name: 'Name',
    email: 'Email address',
    password: 'Password',
    logout: 'Logout',
  },
  ja: {
    cancel: 'キャンセル',
    loading: '読み込み中…',
    error: 'エラー',
    success: '成功',
    delete: '削除',
    confirm: '確認',
    save: '保存',
    confirm_keyword_message: '確認のため{keyword}と入力してください。',
    confirm_keyword_error: '「{keyword}」と入力してください',
    not_found: '見つかりません',

    name: 'お名前',
    email: 'メールアドレス',
    password: 'パスワード',
    logout: 'ログアウト',
  },
};

export function tGlobal(code: string, lang: 'en' | 'ja'): string {
  return globalTranslations[lang]?.[code] || code;
}
