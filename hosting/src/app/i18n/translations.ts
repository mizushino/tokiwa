/**
 * Global shared translations for common UI labels and messages.
 */
export const globalTranslations: Record<'en' | 'ja', Record<string, string>> = {
  en: {
    submit: 'Submit',
    cancel: 'Cancel',
    loading: 'Loading…',
    error: 'Error',
    success: 'Success',
    required: 'Required',
    delete: 'Delete',
    confirm: 'Confirm',
    close: 'Close',
    save: 'Save',
    updated: 'Updated',
    created: 'Created',
    search: 'Search',
    send: 'Send',
    retry: 'Retry',

    name: 'Name',
    email: 'Email address',
    subject: 'Subject',
    about: 'Message',

    sign_in: 'Sign in',
    sign_out: 'Sign out',
    password: 'Password',

    events: 'Events',
    shop: 'Shop',
    news: 'News',
    contact: 'Contact',
    terms: 'Terms of Use',
    privacy: 'Privacy Policy',

    profile: 'Profile',
    purchase_history: 'Purchase History',
    logout: 'Logout',
    switch_to_english: 'Switch to English',
    switch_to_japanese: 'Switch to Japanese',

    ticket_purchase: 'Ticket Purchase',
    digital_ticket: 'Digital Ticket',
    price: 'Price',
    sales_begin: 'Sales begin',
    coming_soon: 'Coming Soon',
    includes: 'Includes',
    viewing_details: 'Viewing Details',
    planned_items: 'Planned Items',
    terms_important: 'Terms of Use / Important Information',

    performance_details: 'Performance Details',
    performers: 'Performers',
    date_time: 'Date & Time',
    schedule: 'Schedule',
    format: 'Format',
    audio_subtitles: 'Audio & Subtitles',
    cast: 'Cast',

    announcement: 'Announcement',
    update: 'Update',
    maintenance: 'Maintenance',

    switch_to_single_row_layout: 'Switch to single row layout',
    switch_to_grid_layout: 'Switch to grid layout',
    single_row_layout: 'Single row layout',
    grid_layout: 'Grid layout',
    end_viewing: 'End Viewing',
  },
  ja: {
    submit: '送信',
    cancel: 'キャンセル',
    loading: '読み込み中…',
    error: 'エラー',
    success: '成功',
    required: '必須',
    delete: '削除',
    confirm: '確認',
    close: '閉じる',
    save: '保存',
    updated: '更新しました',
    created: '作成しました',
    search: '検索',
    send: '送信',
    retry: '再試行',

    name: 'お名前',
    email: 'メールアドレス',
    subject: '件名',
    about: 'お問合せ内容',

    sign_in: 'ログイン',
    sign_out: 'ログアウト',
    password: 'パスワード',

    contact: 'お問合せ',
    news: 'ニュース',
    event: 'イベント',
    shop: 'オンラインショップ',
    terms: '利用規約',
    privacy: 'プライバシーポリシー',

    profile: 'プロフィール',
    purchase_history: '購入履歴',
    logout: 'ログアウト',
    switch_to_english: '英語表示に切り替え',
    switch_to_japanese: '日本語表示に切り替え',

    ticket_purchase: 'チケット購入',
    digital_ticket: 'デジタルチケット',
    price: 'Price',
    sales_begin: 'Sales begin',
    coming_soon: 'Coming Soon',
    includes: 'チケット内容',
    viewing_details: '視聴詳細',
    planned_items: '予定商品',
    terms_important: 'ご利用にあたって',

    performance_details: '公演概要',
    performers: '出演者',
    date_time: '開催日時',
    schedule: 'タイムテーブル',
    format: '配信形式',
    audio_subtitles: '言語',
    cast: '出演者',

    announcement: 'お知らせ',
    update: '更新情報',
    maintenance: 'メンテナンス',

    switch_to_single_row_layout: 'シングルロウレイアウトに切り替え',
    switch_to_grid_layout: 'グリッドレイアウトに切り替え',
    single_row_layout: 'シングルロウレイアウト',
    grid_layout: 'グリッドレイアウト',
    end_viewing: '視聴を終了',
  },
};

/**
 * Resolve a shared translation without going through PageElement.
 */
export function tGlobal(code: string, lang: 'en' | 'ja'): string {
  return globalTranslations[lang]?.[code] || code;
}
