import { msg } from '@lit/localize';

const messageLoaders: Readonly<Record<string, () => string>> = {
  'admin.access_denied_message': () =>
    msg('This page is only accessible to administrators.', { id: 'admin.access_denied_message' }),
  'admin.access_denied_title': () => msg('Access denied', { id: 'admin.access_denied_title' }),
  'admin.checking_permission': () => msg('Checking permissions…', { id: 'admin.checking_permission' }),
  'admin.description': () => msg('Manage your application through the admin panel.', { id: 'admin.description' }),
  'admin.helloworld.description': () =>
    msg('A simple Hello World example for the admin site.', { id: 'admin.helloworld.description' }),
  'admin.helloworld.hero_desc': () => msg('Admin panel sample page.', { id: 'admin.helloworld.hero_desc' }),
  'admin.helloworld.title': () => msg('Hello World - Admin Panel', { id: 'admin.helloworld.title' }),
  'admin.login.description': () => msg('Access the admin panel by logging in here.', { id: 'admin.login.description' }),
  'admin.login.err_account_linking': () =>
    msg('This account needs to be linked with your existing sign-in method.', {
      id: 'admin.login.err_account_linking',
    }),
  'admin.login.err_email_not_verified': () =>
    msg('Your email address has not been verified.', { id: 'admin.login.err_email_not_verified' }),
  'admin.login.err_email_required': () =>
    msg('Please enter your email address.', { id: 'admin.login.err_email_required' }),
  'admin.login.err_generic': () => msg('An error occurred.', { id: 'admin.login.err_generic' }),
  'admin.login.err_google_login': () =>
    msg('Google sign-in failed. Please try again.', { id: 'admin.login.err_google_login' }),
  'admin.login.err_invalid_credentials': () =>
    msg('The email address or password is incorrect.', { id: 'admin.login.err_invalid_credentials' }),
  'admin.login.err_login_failed': () =>
    msg('Sign-in failed. Please try again.', { id: 'admin.login.err_login_failed' }),
  'admin.login.err_password_required': () =>
    msg('Please enter your password.', { id: 'admin.login.err_password_required' }),
  'admin.login.err_twitter_login': () =>
    msg('Twitter sign-in failed. Please try again.', { id: 'admin.login.err_twitter_login' }),
  'admin.login.logging_in': () => msg('Signing in…', { id: 'admin.login.logging_in' }),
  'admin.login.login': () => msg('Sign in', { id: 'admin.login.login' }),
  'admin.login.or_continue_with': () => msg('Or continue with', { id: 'admin.login.or_continue_with' }),
  'admin.login.remember_me': () => msg('Remember me', { id: 'admin.login.remember_me' }),
  'admin.login.sign_in_title': () => msg('Sign in to your account', { id: 'admin.login.sign_in_title' }),
  'admin.login.title': () => msg('Login - Admin Panel', { id: 'admin.login.title' }),
  'admin.nav_dashboard': () => msg('Dashboard', { id: 'admin.nav_dashboard' }),
  'admin.nav_helloworld': () => msg('Hello World', { id: 'admin.nav_helloworld' }),
  'admin.title': () => msg('Admin Panel', { id: 'admin.title' }),
  'default.buttons.button_group': () => msg('Button Group', { id: 'default.buttons.button_group' }),
  'default.buttons.confirmation_dialog': () =>
    msg('Confirmation Dialog', { id: 'default.buttons.confirmation_dialog' }),
  'default.buttons.confirmation_message': () =>
    msg('Are you sure you want to delete this item? This action cannot be undone.', {
      id: 'default.buttons.confirmation_message',
    }),
  'default.buttons.description': () =>
    msg('A showcase of button components with various styles and states.', { id: 'default.buttons.description' }),
  'default.buttons.edit': () => msg('Edit', { id: 'default.buttons.edit' }),
  'default.buttons.form_actions': () => msg('Form Actions', { id: 'default.buttons.form_actions' }),
  'default.buttons.full_width': () => msg('Full Width', { id: 'default.buttons.full_width' }),
  'default.buttons.hero_desc': () =>
    msg('A showcase of button variants, sizes, and states.', { id: 'default.buttons.hero_desc' }),
  'default.buttons.hero_title': () => msg('Buttons', { id: 'default.buttons.hero_title' }),
  'default.buttons.rounded_buttons': () => msg('Rounded Buttons', { id: 'default.buttons.rounded_buttons' }),
  'default.buttons.rounded_desc': () =>
    msg('Full rounded buttons for all sizes', { id: 'default.buttons.rounded_desc' }),
  'default.buttons.rounded_title': () => msg('Rounded', { id: 'default.buttons.rounded_title' }),
  'default.buttons.save_changes': () => msg('Save Changes', { id: 'default.buttons.save_changes' }),
  'default.buttons.sizes_desc': () =>
    msg('Five button sizes from XS to XL with full-width option', { id: 'default.buttons.sizes_desc' }),
  'default.buttons.sizes_title': () => msg('Sizes', { id: 'default.buttons.sizes_title' }),
  'default.buttons.states_desc': () =>
    msg('Button states including disabled and loading', { id: 'default.buttons.states_desc' }),
  'default.buttons.states_title': () => msg('States', { id: 'default.buttons.states_title' }),
  'default.buttons.title': () => msg('Buttons - Sample Site', { id: 'default.buttons.title' }),
  'default.buttons.usage_desc': () => msg('Common button usage patterns', { id: 'default.buttons.usage_desc' }),
  'default.buttons.usage_title': () => msg('Usage Examples', { id: 'default.buttons.usage_title' }),
  'default.buttons.variants_desc': () =>
    msg('All available button color variants', { id: 'default.buttons.variants_desc' }),
  'default.buttons.variants_title': () => msg('Variants', { id: 'default.buttons.variants_title' }),
  'default.buttons.view': () => msg('View', { id: 'default.buttons.view' }),
  'default.checkboxes.checked_checkbox': () => msg('Checked checkbox', { id: 'default.checkboxes.checked_checkbox' }),
  'default.checkboxes.checked_disabled': () => msg('Checked & disabled', { id: 'default.checkboxes.checked_disabled' }),
  'default.checkboxes.description': () =>
    msg('A showcase of checkbox components with various sizes and states.', { id: 'default.checkboxes.description' }),
  'default.checkboxes.disabled_checkbox': () =>
    msg('Disabled checkbox', { id: 'default.checkboxes.disabled_checkbox' }),
  'default.checkboxes.email_notifications': () =>
    msg('Email notifications', { id: 'default.checkboxes.email_notifications' }),
  'default.checkboxes.feature_advanced': () =>
    msg('Enable advanced features', { id: 'default.checkboxes.feature_advanced' }),
  'default.checkboxes.feature_beta': () => msg('Enable beta features', { id: 'default.checkboxes.feature_beta' }),
  'default.checkboxes.feature_experimental': () =>
    msg('Enable experimental features', { id: 'default.checkboxes.feature_experimental' }),
  'default.checkboxes.features_title': () => msg('Select Features', { id: 'default.checkboxes.features_title' }),
  'default.checkboxes.hero_desc': () =>
    msg('A showcase of checkbox sizes, states, and interactive examples.', { id: 'default.checkboxes.hero_desc' }),
  'default.checkboxes.hero_title': () => msg('Checkboxes', { id: 'default.checkboxes.hero_title' }),
  'default.checkboxes.indeterminate_checkbox': () =>
    msg('Indeterminate checkbox', { id: 'default.checkboxes.indeterminate_checkbox' }),
  'default.checkboxes.indeterminate_disabled': () =>
    msg('Indeterminate & disabled', { id: 'default.checkboxes.indeterminate_disabled' }),
  'default.checkboxes.interactive_desc': () =>
    msg('Click checkboxes to see state updates', { id: 'default.checkboxes.interactive_desc' }),
  'default.checkboxes.interactive_title': () =>
    msg('Interactive Example', { id: 'default.checkboxes.interactive_title' }),
  'default.checkboxes.keep_logged_in': () => msg('Keep me logged in', { id: 'default.checkboxes.keep_logged_in' }),
  'default.checkboxes.large_checkbox': () => msg('Large checkbox', { id: 'default.checkboxes.large_checkbox' }),
  'default.checkboxes.large_checked': () => msg('Large checked', { id: 'default.checkboxes.large_checked' }),
  'default.checkboxes.large_disabled': () => msg('Large disabled', { id: 'default.checkboxes.large_disabled' }),
  'default.checkboxes.medium_checkbox': () => msg('Medium checkbox', { id: 'default.checkboxes.medium_checkbox' }),
  'default.checkboxes.medium_checked': () => msg('Medium checked', { id: 'default.checkboxes.medium_checked' }),
  'default.checkboxes.medium_disabled': () => msg('Medium disabled', { id: 'default.checkboxes.medium_disabled' }),
  'default.checkboxes.none_selected': () => msg('None selected', { id: 'default.checkboxes.none_selected' }),
  'default.checkboxes.normal_checkbox': () => msg('Normal checkbox', { id: 'default.checkboxes.normal_checkbox' }),
  'default.checkboxes.notifications_title': () =>
    msg('Notification Preferences', { id: 'default.checkboxes.notifications_title' }),
  'default.checkboxes.option_1': () => msg('Option 1', { id: 'default.checkboxes.option_1' }),
  'default.checkboxes.option_2': () => msg('Option 2', { id: 'default.checkboxes.option_2' }),
  'default.checkboxes.option_3': () => msg('Option 3', { id: 'default.checkboxes.option_3' }),
  'default.checkboxes.push_notifications': () =>
    msg('Push notifications', { id: 'default.checkboxes.push_notifications' }),
  'default.checkboxes.remember_me': () => msg('Remember me', { id: 'default.checkboxes.remember_me' }),
  'default.checkboxes.save_preferences': () =>
    msg('Save my preferences', { id: 'default.checkboxes.save_preferences' }),
  'default.checkboxes.selected_options': () => msg('Selected Options:', { id: 'default.checkboxes.selected_options' }),
  'default.checkboxes.sizes_desc': () =>
    msg('Three checkbox sizes: small, medium, and large', { id: 'default.checkboxes.sizes_desc' }),
  'default.checkboxes.sizes_title': () => msg('Sizes', { id: 'default.checkboxes.sizes_title' }),
  'default.checkboxes.small_checkbox': () => msg('Small checkbox', { id: 'default.checkboxes.small_checkbox' }),
  'default.checkboxes.small_checkboxes_title': () =>
    msg('Small Checkboxes', { id: 'default.checkboxes.small_checkboxes_title' }),
  'default.checkboxes.small_checked': () => msg('Small checked', { id: 'default.checkboxes.small_checked' }),
  'default.checkboxes.small_disabled': () => msg('Small disabled', { id: 'default.checkboxes.small_disabled' }),
  'default.checkboxes.sms_notifications': () =>
    msg('SMS notifications', { id: 'default.checkboxes.sms_notifications' }),
  'default.checkboxes.states_desc': () =>
    msg('All available checkbox states', { id: 'default.checkboxes.states_desc' }),
  'default.checkboxes.states_title': () => msg('States', { id: 'default.checkboxes.states_title' }),
  'default.checkboxes.terms_agree': () =>
    msg('I agree to the terms and conditions', { id: 'default.checkboxes.terms_agree' }),
  'default.checkboxes.terms_title': () => msg('Terms and Conditions', { id: 'default.checkboxes.terms_title' }),
  'default.checkboxes.title': () => msg('Checkboxes - Sample Site', { id: 'default.checkboxes.title' }),
  'default.checkboxes.usage_desc': () => msg('Common checkbox usage patterns', { id: 'default.checkboxes.usage_desc' }),
  'default.checkboxes.usage_title': () => msg('Usage Examples', { id: 'default.checkboxes.usage_title' }),
  'default.checkboxes.weekly_digest': () => msg('Weekly digest', { id: 'default.checkboxes.weekly_digest' }),
  'default.counter.card_desc': () =>
    msg("Uses Lit's @state() decorator to reactively render state changes.", { id: 'default.counter.card_desc' }),
  'default.counter.card_title': () => msg('Counter', { id: 'default.counter.card_title' }),
  'default.counter.decrement': () => msg('Decrement [-]', { id: 'default.counter.decrement' }),
  'default.counter.description': () =>
    msg('An interactive counter example showcasing state management in Lit.', { id: 'default.counter.description' }),
  'default.counter.hero_desc': () =>
    msg('A sample of a reactive counter component.', { id: 'default.counter.hero_desc' }),
  'default.counter.hero_title': () => msg('Counter', { id: 'default.counter.hero_title' }),
  'default.counter.increment': () => msg('Increment [+]', { id: 'default.counter.increment' }),
  'default.counter.reset': () => msg('Reset', { id: 'default.counter.reset' }),
  'default.counter.title': () => msg('Counter - Sample Site', { id: 'default.counter.title' }),
  'default.description': () =>
    msg('Welcome to the sample site. Explore various examples and demos.', { id: 'default.description' }),
  'default.dropdown.approve': () => msg('Approve', { id: 'default.dropdown.approve' }),
  'default.dropdown.archive': () => msg('Archive', { id: 'default.dropdown.archive' }),
  'default.dropdown.basic_desc': () =>
    msg('Standard dropdown menu with actions', { id: 'default.dropdown.basic_desc' }),
  'default.dropdown.basic_title': () => msg('Basic', { id: 'default.dropdown.basic_title' }),
  'default.dropdown.description': () =>
    msg('A showcase of dropdown components with various sizes and placements.', { id: 'default.dropdown.description' }),
  'default.dropdown.duplicate': () => msg('Duplicate', { id: 'default.dropdown.duplicate' }),
  'default.dropdown.edit': () => msg('Edit', { id: 'default.dropdown.edit' }),
  'default.dropdown.feature_and': () => msg('and', { id: 'default.dropdown.feature_and' }),
  'default.dropdown.feature_aria': () =>
    msg('Accessible with ARIA attributes', { id: 'default.dropdown.feature_aria' }),
  'default.dropdown.feature_arrows_prefix': () => msg('Use', { id: 'default.dropdown.feature_arrows_prefix' }),
  'default.dropdown.feature_arrows_suffix': () =>
    msg('arrow keys to navigate menu items', { id: 'default.dropdown.feature_arrows_suffix' }),
  'default.dropdown.feature_click_outside': () =>
    msg('Click outside to close', { id: 'default.dropdown.feature_click_outside' }),
  'default.dropdown.feature_escape_prefix': () => msg('Press', { id: 'default.dropdown.feature_escape_prefix' }),
  'default.dropdown.feature_escape_suffix': () => msg('to close', { id: 'default.dropdown.feature_escape_suffix' }),
  'default.dropdown.feature_homeend_prefix': () => msg('Use', { id: 'default.dropdown.feature_homeend_prefix' }),
  'default.dropdown.feature_homeend_suffix': () =>
    msg('to jump to first/last item', { id: 'default.dropdown.feature_homeend_suffix' }),
  'default.dropdown.feature_transitions': () =>
    msg('Smooth transition animations', { id: 'default.dropdown.feature_transitions' }),
  'default.dropdown.features': () => msg('Features', { id: 'default.dropdown.features' }),
  'default.dropdown.features_desc': () =>
    msg('Keyboard navigation and accessibility', { id: 'default.dropdown.features_desc' }),
  'default.dropdown.features_title': () => msg('Features', { id: 'default.dropdown.features_title' }),
  'default.dropdown.hero_desc': () =>
    msg('A showcase of dropdown menu components with various configurations.', { id: 'default.dropdown.hero_desc' }),
  'default.dropdown.hero_title': () => msg('Dropdown', { id: 'default.dropdown.hero_title' }),
  'default.dropdown.options': () => msg('Options', { id: 'default.dropdown.options' }),
  'default.dropdown.placements_desc': () =>
    msg('Control dropdown menu alignment', { id: 'default.dropdown.placements_desc' }),
  'default.dropdown.placements_title': () => msg('Placements', { id: 'default.dropdown.placements_title' }),
  'default.dropdown.publish': () => msg('Publish', { id: 'default.dropdown.publish' }),
  'default.dropdown.remove': () => msg('Remove', { id: 'default.dropdown.remove' }),
  'default.dropdown.save_as': () => msg('Save As…', { id: 'default.dropdown.save_as' }),
  'default.dropdown.sizes_desc': () =>
    msg('Three dropdown sizes: small, medium, and large', { id: 'default.dropdown.sizes_desc' }),
  'default.dropdown.sizes_title': () => msg('Sizes', { id: 'default.dropdown.sizes_title' }),
  'default.dropdown.title': () => msg('Dropdown - Sample Site', { id: 'default.dropdown.title' }),
  'default.dropdown.variants_desc': () =>
    msg('Dropdowns with different button styles', { id: 'default.dropdown.variants_desc' }),
  'default.dropdown.variants_title': () => msg('Button Variants', { id: 'default.dropdown.variants_title' }),
  'default.firestore.description': () =>
    msg('Firestore integration example demonstrating database operations.', { id: 'default.firestore.description' }),
  'default.firestore.hero_desc': () =>
    msg('A sample of real-time data synchronization and direct access.', { id: 'default.firestore.hero_desc' }),
  'default.firestore.hero_title': () => msg('Firestore', { id: 'default.firestore.hero_title' }),
  'default.firestore.load': () => msg('Load', { id: 'default.firestore.load' }),
  'default.firestore.load_result': () => msg('Load result', { id: 'default.firestore.load_result' }),
  'default.firestore.name_placeholder': () => msg('Enter a name…', { id: 'default.firestore.name_placeholder' }),
  'default.firestore.no_data': () => msg('No data', { id: 'default.firestore.no_data' }),
  'default.firestore.operations_desc': () =>
    msg('Access Firestore directly from the client to save and load data.', {
      id: 'default.firestore.operations_desc',
    }),
  'default.firestore.operations_title': () => msg('Firestore Operations', { id: 'default.firestore.operations_title' }),
  'default.firestore.snapshot_desc': () =>
    msg("Using lit-async's track() to reactively monitor Firestore snapshots.", {
      id: 'default.firestore.snapshot_desc',
    }),
  'default.firestore.snapshot_title': () => msg('Realtime Snapshot', { id: 'default.firestore.snapshot_title' }),
  'default.firestore.title': () => msg('Firestore - Sample Site', { id: 'default.firestore.title' }),
  'default.functions.card_desc': () =>
    msg('Calls a Firebase Cloud Functions Callable Function to update the Sample document.', {
      id: 'default.functions.card_desc',
    }),
  'default.functions.card_title': () => msg('Callable Function', { id: 'default.functions.card_title' }),
  'default.functions.description': () =>
    msg('Callable Functions integration example for the sample framework.', { id: 'default.functions.description' }),
  'default.functions.function_call_failed': () =>
    msg('Function call failed', { id: 'default.functions.function_call_failed' }),
  'default.functions.hero_desc': () =>
    msg('A sample of calling Callable Functions.', { id: 'default.functions.hero_desc' }),
  'default.functions.hero_title': () => msg('Functions', { id: 'default.functions.hero_title' }),
  'default.functions.id': () => msg('ID', { id: 'default.functions.id' }),
  'default.functions.result_placeholder': () =>
    msg('Result will appear here…', { id: 'default.functions.result_placeholder' }),
  'default.functions.run_sample': () => msg('Run Sample Function', { id: 'default.functions.run_sample' }),
  'default.functions.running': () => msg('Running…', { id: 'default.functions.running' }),
  'default.functions.title': () => msg('Functions - Sample Site', { id: 'default.functions.title' }),
  'default.helloworld.description': () =>
    msg('A simple Hello World example demonstrating basic Lit components.', { id: 'default.helloworld.description' }),
  'default.helloworld.hero_desc': () => msg('A simple Lit component sample.', { id: 'default.helloworld.hero_desc' }),
  'default.helloworld.hero_title': () => msg('Hello, World!', { id: 'default.helloworld.hero_title' }),
  'default.helloworld.title': () => msg('Hello World - Sample Site', { id: 'default.helloworld.title' }),
  'default.helloworld.welcome': () => msg('Welcome', { id: 'default.helloworld.welcome' }),
  'default.helloworld.welcome_body': () =>
    msg(
      'This is a simple "Hello, World!" sample page built with Lit. Components are composed using custom elements and Shadow DOM.',
      { id: 'default.helloworld.welcome_body' }
    ),
  'default.lit-async.description': () =>
    msg('Demonstration of using the lit-async library for handling async operations reactively in Lit.', {
      id: 'default.lit-async.description',
    }),
  'default.lit-async.fetch_quote': () => msg('Fetch Next Quote', { id: 'default.lit-async.fetch_quote' }),
  'default.lit-async.generator_desc': () =>
    msg('Binds an async generator. Re-renders reactively whenever a new value is yielded.', {
      id: 'default.lit-async.generator_desc',
    }),
  'default.lit-async.generator_stopped': () => msg('Generator Stopped', { id: 'default.lit-async.generator_stopped' }),
  'default.lit-async.hero_desc': () =>
    msg(
      'lit-async is a lightweight collection of directives and decorators for handling asynchronous operations directly in your Lit templates without boilerplate.',
      { id: 'default.lit-async.hero_desc' }
    ),
  'default.lit-async.hero_title': () => msg('lit-async Demo', { id: 'default.lit-async.hero_title' }),
  'default.lit-async.loading_helper_desc': () =>
    msg('The loading helper yields a placeholder value (like a spinner or text) until the promise resolves.', {
      id: 'default.lit-async.loading_helper_desc',
    }),
  'default.lit-async.loading_promise': () => msg('Loading promise...', { id: 'default.lit-async.loading_promise' }),
  'default.lit-async.pause': () => msg('Pause', { id: 'default.lit-async.pause' }),
  'default.lit-async.promise_desc': () =>
    msg('Binds a Promise directly in the template. The template automatically updates when the Promise resolves.', {
      id: 'default.lit-async.promise_desc',
    }),
  'default.lit-async.resume': () => msg('Resume', { id: 'default.lit-async.resume' }),
  'default.lit-async.seconds_elapsed': () => msg('seconds elapsed', { id: 'default.lit-async.seconds_elapsed' }),
  'default.lit-async.simulating_slow': () =>
    msg('Simulating slow network request (2s)…', { id: 'default.lit-async.simulating_slow' }),
  'default.lit-async.title': () => msg('Lit-Async - Sample Site', { id: 'default.lit-async.title' }),
  'default.lit-async.trigger_slow': () => msg('Trigger Slow Request', { id: 'default.lit-async.trigger_slow' }),
  'default.modal.confirm_message': () =>
    msg('Are you sure you want to proceed?', { id: 'default.modal.confirm_message' }),
  'default.modal.confirm_title': () => msg('Confirm Action', { id: 'default.modal.confirm_title' }),
  'default.modal.delete_message': () =>
    msg('Are you sure you want to delete this item? This action cannot be undone.', {
      id: 'default.modal.delete_message',
    }),
  'default.modal.delete_title': () => msg('Delete Item', { id: 'default.modal.delete_title' }),
  'default.modal.description': () =>
    msg('Demonstration of the functional and component APIs for ui-modal.', { id: 'default.modal.description' }),
  'default.modal.error_message': () =>
    msg('Something went wrong. Please try again.', { id: 'default.modal.error_message' }),
  'default.modal.hero_desc': () =>
    msg('Demonstrates the Modal API with semantic methods: success(), info(), error(), and confirm().', {
      id: 'default.modal.hero_desc',
    }),
  'default.modal.hero_title': () => msg('Modal API', { id: 'default.modal.hero_title' }),
  'default.modal.info_message': () =>
    msg('This is some important information for you.', { id: 'default.modal.info_message' }),
  'default.modal.information': () => msg('Information', { id: 'default.modal.information' }),
  'default.modal.last_action': () => msg('Last Action:', { id: 'default.modal.last_action' }),
  'default.modal.semantic_desc': () =>
    msg('Use Modal.success(), Modal.info(), Modal.error(), or Modal.confirm() for common use cases', {
      id: 'default.modal.semantic_desc',
    }),
  'default.modal.semantic_title': () => msg('Semantic API (Recommended)', { id: 'default.modal.semantic_title' }),
  'default.modal.single_arg_button': () =>
    msg('Single Argument (message only)', { id: 'default.modal.single_arg_button' }),
  'default.modal.single_arg_desc': () =>
    msg('When only one argument is provided, it is treated as the message (title becomes empty)', {
      id: 'default.modal.single_arg_desc',
    }),
  'default.modal.single_arg_message': () =>
    msg('This message has no title', { id: 'default.modal.single_arg_message' }),
  'default.modal.single_arg_title': () => msg('Single Argument API', { id: 'default.modal.single_arg_title' }),
  'default.modal.success_message': () =>
    msg('Your operation completed successfully!', { id: 'default.modal.success_message' }),
  'default.modal.title': () => msg('Modal - Sample Site', { id: 'default.modal.title' }),
  'default.modal.unsaved_message': () =>
    msg('You have unsaved changes. Do you want to discard them?', { id: 'default.modal.unsaved_message' }),
  'default.modal.unsaved_title': () => msg('Unsaved Changes', { id: 'default.modal.unsaved_title' }),
  'default.nav_buttons': () => msg('Buttons', { id: 'default.nav_buttons' }),
  'default.nav_checkboxes': () => msg('Checkboxes', { id: 'default.nav_checkboxes' }),
  'default.nav_counter': () => msg('Counter', { id: 'default.nav_counter' }),
  'default.nav_dropdown': () => msg('Dropdown', { id: 'default.nav_dropdown' }),
  'default.nav_firestore': () => msg('Firestore', { id: 'default.nav_firestore' }),
  'default.nav_functions': () => msg('Functions', { id: 'default.nav_functions' }),
  'default.nav_helloworld': () => msg('Hello World', { id: 'default.nav_helloworld' }),
  'default.nav_home': () => msg('Home', { id: 'default.nav_home' }),
  'default.nav_lit_async': () => msg('Lit-Async', { id: 'default.nav_lit_async' }),
  'default.nav_modal': () => msg('Modal', { id: 'default.nav_modal' }),
  'default.site_title': () => msg('Sample Site', { id: 'default.site_title' }),
  'default.title': () => msg('Home - Sample Site', { id: 'default.title' }),
  'global.cancel': () => msg('Cancel', { id: 'global.cancel' }),
  'global.confirm': () => msg('Confirm', { id: 'global.confirm' }),
  'global.confirm_keyword_error': () => msg('Please type "{keyword}".', { id: 'global.confirm_keyword_error' }),
  'global.confirm_keyword_message': () => msg('Type {keyword} to confirm.', { id: 'global.confirm_keyword_message' }),
  'global.delete': () => msg('Delete', { id: 'global.delete' }),
  'global.email': () => msg('Email address', { id: 'global.email' }),
  'global.error': () => msg('Error', { id: 'global.error' }),
  'global.loading': () => msg('Loading…', { id: 'global.loading' }),
  'global.logout': () => msg('Logout', { id: 'global.logout' }),
  'global.name': () => msg('Name', { id: 'global.name' }),
  'global.not_found': () => msg('Not Found', { id: 'global.not_found' }),
  'global.password': () => msg('Password', { id: 'global.password' }),
  'global.save': () => msg('Save', { id: 'global.save' }),
  'global.success': () => msg('Success', { id: 'global.success' }),
};

export const messageIds = Object.freeze(Object.keys(messageLoaders));

export function translateMessage(id: string): string | undefined {
  return messageLoaders[id]?.();
}
