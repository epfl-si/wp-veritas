import { SiteType } from '@/types/site';
import { LANGUAGES } from './languages';

export const WP_CATEGORIES = {
	DEFAULT: {
		NAME: 'Default',
		LABEL: 'Default',
		getPlugins: (site: SiteType) => ({
			'epfl-404': {},
			enlighter: {
				wp_options: [
					{
						name: 'enlighter-options',
						value: {
							'translation-enabled': true,
							'enlighterjs-init': 'inline',
							'enlighterjs-assets-js': true,
							'enlighterjs-assets-themes': true,
							'enlighterjs-assets-themes-external': false,
							'enlighterjs-selector-block': 'pre.EnlighterJSRAW',
							'enlighterjs-selector-inline': 'code.EnlighterJSRAW',
							'enlighterjs-indent': 4,
							'enlighterjs-ampersandcleanup': true,
							'enlighterjs-linehover': true,
							'enlighterjs-rawcodedbclick': false,
							'enlighterjs-textoverflow': 'break',
							'enlighterjs-linenumbers': true,
							'enlighterjs-theme': 'enlighter',
							'enlighterjs-retaincss': false,
							'toolbar-visibility': 'show',
							'toolbar-button-raw': true,
							'toolbar-button-copy': true,
							'toolbar-button-window': true,
							'tinymce-backend': false,
							'tinymce-frontend': false,
							'tinymce-formats': true,
							'tinymce-autowidth': false,
							'tinymce-tabindentation': false,
							'tinymce-keyboardshortcuts': false,
							'tinymce-font': 'sourcecodepro',
							'tinymce-fontsize': '0.7em',
							'tinymce-lineheight': '1.4em',
							'tinymce-color': '#000000',
							'tinymce-bgcolor': '#f9f9f9',
							'gutenberg-backend': true,
							'quicktag-backend': false,
							'quicktag-frontend': false,
							'quicktag-mode': 'html',
							'shortcode-mode': 'disabled',
							'shortcode-inline': true,
							'shortcode-type-generic': false,
							'shortcode-type-language': false,
							'shortcode-type-group': false,
							'shortcode-filter-content': true,
							'shortcode-filter-excerpt': true,
							'shortcode-filter-widget': false,
							'shortcode-filter-comment': false,
							'shortcode-filter-commentexcerpt': false,
							'gfm-enabled': false,
							'gfm-inline': true,
							'gfm-language': 'raw',
							'gfm-filter-content': true,
							'gfm-filter-excerpt': true,
							'gfm-filter-widget': false,
							'gfm-filter-comment': false,
							'gfm-filter-commentexcerpt': false,
							'compat-enabled': false,
							'compat-crayon': false,
							'compat-type1': false,
							'compat-type2': false,
							'compat-filter-content': true,
							'compat-filter-excerpt': true,
							'compat-filter-widget': false,
							'compat-filter-comment': false,
							'compat-filter-commentexcerpt': false,
							'cache-custom': false,
							'cache-path': '',
							'cache-url': '',
							'dynamic-resource-invocation': true,
							'ext-infinite-scroll': false,
							'ext-ajaxcomplete': false,
							'bbpress-shortcode': false,
							'bbpress-markdown': false,
						},
					},
				],
			},
			pushgateway: {},
			accred: {
				wp_options: [
					{ name: 'plugin:epfl_accred:administrator_group', value: 'WP-SuperAdmin' },
					{ name: 'plugin:epfl_accred:subscriber_group', value: '*' },
					{ name: 'plugin:epfl_accred:unit_id', value: site.unitId },
				],
			},
			'epfl-cache-control': {
				wp_options: [
					{ name: 'cache_control_front_page_max_age', value: 300 },
					{ name: 'cache_control_pages_max_age', value: 300 },
					{ name: 'cache_control_categories_max_age', value: 300 },
					{ name: 'cache_control_singles_max_age', value: 300 },
					{ name: 'cache_control_home_max_age', value: 300 },
					{ name: 'cache_control_tags_max_age', value: 300 },
					{ name: 'cache_control_authors_max_age', value: 300 },
					{ name: 'cache_control_dates_max_age', value: 300 },
					{ name: 'cache_control_feeds_max_age', value: 300 },
					{ name: 'cache_control_attachment_max_age', value: 300 },
					{ name: 'cache_control_search_max_age', value: 300 },
					{ name: 'cache_control_notfound_max_age', value: 300 },
					{ name: 'cache_control_redirect_permanent_max_age', value: 300 },
				],
			},
			'epfl-coming-soon': {
				wp_options: [
					{
						name: 'epfl_csp_options',
						value: {
							status: 'on',
							theme_maintenance: 'on',
							status_code: 'no',
							page_title: 'Coming soon',
							page_content: '&nbsp;  &nbsp; <p style="text-align: center;"><img class="img-fluid aligncenter" src="https://web2018.epfl.ch/5.0.2/icons/epfl-logo.svg" alt="Logo EPFL" width="388" height="113" /></p>  <h3 style="text-align: center; color: #ff0000; font-family: Helvetica, Arial, sans-serif;">Something new is coming...</h3> <p style="position: absolute; bottom: 0; left: 0; width: 100%; text-align: center;"><a href="wp-admin/">Connexion / Login</a></p>',
						},
					},
				],
			},
			'EPFL-Content-Filter': {},
			'epfl-remote-content-shortcode': {},
			'EPFL-settings': {},
			tequila: {
				wp_options: [
					{ name: 'plugin:epfl_tequila:has_dual_auth', value: 0 },
					{ name: 'plugin:epfl:tequila_allowed_request_hosts', value: '10.180.21.0/24' },
				],
			},
			'ewww-image-optimizer': {
				wp_options: [
					{ name: 'exactdn_all_the_things', value: '' },
					{ name: 'exactdn_lossy', value: '' },
					{ name: 'ewww_image_optimizer_tracking_notice', value: '1' },
					{ name: 'ewww_image_optimizer_enable_help_notice', value: '1' },
					{ name: 'ewww_image_optimizer_cloud_key', value: '' },
					{ name: 'ewww_image_optimizer_jpg_quality', value: '' },
					{ name: 'ewww_image_optimizer_include_media_paths', value: '1' },
					{ name: 'ewww_image_optimizer_aux_paths', value: '' },
					{ name: 'ewww_image_optimizer_exclude_paths', value: '' },
					{ name: 'ewww_image_optimizer_allow_tracking', value: '' },
					{ name: 'ewww_image_optimizer_maxmediawidth', value: '2048' },
					{ name: 'ewww_image_optimizer_maxmediaheight', value: '2048' },
					{ name: 'ewww_image_optimizer_resize_existing', value: '1' },
					{ name: 'ewww_image_optimizer_disable_resizes', value: '' },
					{ name: 'ewww_image_optimizer_disable_resizes_opt', value: '' },
					{ name: 'ewww_image_optimizer_jpg_background', value: '' },
					{ name: 'ewww_image_optimizer_webp_paths', value: '' },
					{ name: 'ewww_image_optimizer_dismiss_media_notice', value: '1' },
					{ name: 'ewww_image_optimizer_debug', value: '' },
				],
			},
			'find-my-blocks': {},
			'flowpaper-lite-pdf-flipbook': {},
			polylang: {
				wp_options: [
					{ name: 'widget_polylang', value: { _multiwidget: 1 } },
					{ name: 'polylang_settings', value: { wizard: false } },
					{ name: 'polylang_wizard_done', value: true },
					{ name: 'pll_dismissed_notices', value: ['wizard'] },
					{ name: 'polylang_wpml_strings', value: [] },
					{
						name: 'polylang',
						value: {
							browser: 0,
							rewrite: 1,
							hide_default: 1,
							force_lang: 1,
							redirect_lang: 0,
							media_support: false,
							uninstall: 0,
							sync: [],
							post_types: [],
							taxonomies: [],
							domains: [],
							version: '3.6.7',
							first_activation: Math.floor(new Date().getTime() / 1000),
							default_lang: (site.languages && site.languages[0]) || 'en',
						},
					},
				],
				polylang: {
					languages: (site.languages ?? []).map((l) => ({ slug: l, ...Object.values(LANGUAGES).find((lang) => lang.locale === l) })),
				},
			},
			redirection: {
				wp_options: [
					{
						name: 'redirection_options',
						value: {
							support: false,
							token: '',
							monitor_post: 1,
							monitor_types: {
								0: 'post',
								1: 'page',
							},
							associated_redirect: '',
							auto_target: '',
							expire_redirect: 7,
							expire_404: 7,
							log_external: false,
							log_header: false,
							track_hits: true,
							modules: {},
							redirect_cache: 1,
							ip_logging: 0,
							ip_headers: {},
							ip_proxy: {},
							last_group_id: 1,
							rest_api: 0,
							https: false,
							headers: {},
							database: '4.2',
							relocate: '',
							preferred_domain: '',
							aliases: {},
							permalinks: {},
							cache_key: 0,
							plugin_update: 'prompt',
							update_notice: 0,
							flag_query: 'exact',
							flag_case: true,
							flag_trailing: true,
							flag_regex: false,
						},
					},
				],
			},
			'tinymce-advanced': {},
			'very-simple-meta-description': {},
			'wp-gutenberg-epfl': {},
			'wp-media-folder': {
				wp_options: [
					{ name: 'wpmf_use_taxonomy', value: 1 },
					{ name: 'wpmf_gallery_image_size_value', value: '["thumbnail","medium","large","full"]' },
					{ name: 'wpmf_padding_masonry', value: 5 },
					{ name: 'wpmf_padding_portfolio', value: 10 },
					{ name: 'wpmf_usegellery', value: 0 },
					{ name: 'wpmf_useorder', value: 1 },
					{ name: 'wpmf_create_folder', value: 'role' },
					{ name: 'wpmf_option_override', value: 1 },
					{ name: 'wpmf_option_duplicate', value: 0 },
					{ name: 'wpmf_active_media', value: 0 },
					{ name: 'wpmf_folder_option2', value: 1 },
					{ name: 'wpmf_option_searchall', value: 1 },
					{ name: 'wpmf_usegellery_lightbox', value: 0 },
					{ name: 'wpmf_media_rename', value: 0 },
					{ name: 'wpmf_patern_rename', value: '{sitename} - {foldername} - #' },
					{ name: 'wpmf_rename_number', value: 0 },
					{ name: 'wpmf_option_media_remove', value: 0 },
					{
						name: 'wpmf_default_dimension',
						value: '["400x300","640x480","800x600","1024x768","1600x1200"]',
					},
					{
						name: 'wpmf_selected_dimension',
						value: '["400x300","640x480","800x600","1024x768","1600x1200"]',
					},
					{
						name: 'wpmf_weight_default',
						value: '[["0-61440","kB"],["61440-122880","kB"],["122880-184320","kB"],["184320-245760","kB"],["245760-307200","kB"]]',
					},
					{
						name: 'wpmf_weight_selected',
						value: '[["0-61440","kB"],["61440-122880","kB"],["122880-184320","kB"],["184320-245760","kB"],["245760-307200","kB"]]',
					},
					{
						name: 'wpmf_color_singlefile',
						value: '{"bgdownloadlink":"#444444","hvdownloadlink":"#888888","fontdownloadlink":"#ffffff","hoverfontcolor":"#ffffff"}',
					},
					{ name: 'wpmf_option_singlefile', value: 0 },
					{ name: 'wpmf_option_sync_media', value: 0 },
					{ name: 'wpmf_option_sync_media_external', value: 0 },
					{ name: 'wpmf_list_sync_media', value: 'array()' },
					{ name: 'wpmf_time_sync', value: 60 },
					{ name: 'wpmf_lastRun_sync', value: 1540467937 },
					{ name: 'wpmf_slider_animation', value: 'slide' },
					{ name: 'wpmf_option_mediafolder', value: 0 },
					{ name: 'wpmf_option_countfiles', value: 1 },
					{ name: 'wpmf_option_lightboximage', value: 0 },
					{ name: 'wpmf_option_hoverimg', value: 1 },
					{
						name: 'wpmf_options_format_title',
						value: {
							hyphen: 1,
							period: 0,
							plus: 0,
							ampersand: 0,
							square_brackets: 0,
							curly_brackets: 0,
							underscore: 1,
							tilde: 0,
							hash: 0,
							number: 0,
							round_brackets: 0,
							alt: 0,
							description: 0,
							caption: 0,
							capita: 'cap_all',
						},
					},
					{
						name: 'wpmf_image_watermark_apply',
						value: {
							all_size: 1,
							thumbnail: 0,
							medium: 0,
							large: 0,
							full: 0,
						},
					},
					{ name: 'wpmf_option_image_watermark', value: 0 },
					{ name: 'wpmf_watermark_position', value: 'top_left' },
					{ name: 'wpmf_watermark_image', value: '' },
					{ name: 'wpmf_watermark_image_id', value: 0 },
					{
						name: '$wpmf_gallery_settings',
						value: {
							hyphen: 1,
							period: 0,
							plus: 0,
							ampersand: 0,
							square_brackets: 0,
							curly_brackets: 0,
							underscore: 1,
							tilde: 0,
							hash: 0,
							number: 0,
							round_brackets: 0,
							alt: 0,
							description: 0,
							caption: 0,
							capita: 'cap_all',
						},
					},
					{
						name: '$wpmf_gallery_settings',
						value: {
							hide_remote_video: 0,
							gallery_settings: {
								theme: {
									default_theme: {
										columns: 3,
										size: 'medium',
										targetsize: 'large',
										link: 'file',
										orderby: 'post__in',
										order: 'ASC',
									},
									portfolio_theme: {
										columns: 3,
										size: 'medium',
										targetsize: 'large',
										link: 'file',
										orderby: 'post__in',
										order: 'ASC',
									},
									masonry_theme: {
										columns: 3,
										size: 'medium',
										targetsize: 'large',
										link: 'file',
										orderby: 'post__in',
										order: 'ASC',
									},
									slider_theme: {
										columns: 3,
										size: 'medium',
										targetsize: 'large',
										link: 'file',
										orderby: 'post__in',
										animation: 'slide',
										duration: 4000,
										order: 'ASC',
										auto_animation: 1,
									},
								},
							},
							watermark_exclude_folders: {
								0: 0,
							},
							folder_design: 'material_design',
							load_gif: 1,
							hide_tree: 1,
							watermark_margin: {
								top: 0,
								right: 0,
								bottom: 0,
								left: 0,
							},
							watermark_image_scaling: 100,
							format_mediatitle: 1,
						},
					},
					{ name: '_wpmf_import_order_notice_flag', value: 'yes' },
					{ name: 'can_compress_scripts', value: 0 },
				],
			},
		}),
	},

	INSIDE: {
		NAME: 'Inside',
		LABEL: 'Inside',
		getPlugins: () => ({
			'epfl-intranet': {},
		}),
	},

	RESTAURATION: {
		NAME: 'Restauration',
		LABEL: 'Restauration',
		getPlugins: () => ({
			'epfl-restauration': {
				wp_options: [
					{ name: 'epfl_restauration_api_url', value: 'https://nutrimenu.ch/nmapi/getMenu' },
					{ name: 'epfl_restauration_api_username', value: 'epfl.getmenu@nutrimenu.ch' },
					{
						name: 'epfl_restauration_api_password',
						valueFrom: {
							secretKeyRef: {
								name: 'wp-plugin-secrets',
								key: 'restauration_api_password',
							},
						},
					},
				],
			},
		}),
	},

	LIBRARY: {
		NAME: 'Library',
		LABEL: 'Library',
		getPlugins: () => ({
			'EPFL-Library-Plugins': {},
		}),
	},

	CDHSHS: {
		NAME: 'CDHSHS',
		LABEL: 'CDHSHS',
		getPlugins: () => ({
			'epfl-courses-se': {},
		}),
	},

	WPFORMS: {
		NAME: 'WPForms',
		LABEL: 'WPForms',
		getPlugins: () => ({
			wpforms: {
				wp_options: [
					{
						name: 'wpforms_challenge',
						value: {
							status: 'skipped',
							step: 0,
							user_id: 1,
							form_id: 0,
							embed_page: 0,
							started_date_gmt: '2020-07-08 07:47:17',
							finished_date_gmt: '2020-07-08 07:47:17',
							seconds_spent: 0,
							seconds_left: 300,
							feedback_sent: false,
							feedback_contact_me: false,
						},
					},
					{
						name: 'wpforms_settings',
						value: {
							currency: 'CHF',
							'hide-announcements': true,
							'hide-admin-bar': true,
							'uninstall-data': false,
							'email-summaries-disable': false,
							'disable-css': '1',
							'global-assets': false,
							gdpr: true,
							'gdpr-disable-uuid': true,
							'gdpr-disable-details': true,
							'email-async': false,
							'email-template': 'default',
							'email-header-image': 'https://www.epfl.ch/wp-content/themes/wp-theme-2018/assets/svg/epfl-logo.svg',
							'email-background-color': '#e9eaec',
							'email-carbon-copy': false,
							'modern-markup': '0',
							'modern-markup-is-set': true,
							'stripe-webhooks-communication': 'curl',
							'stripe-card-mode': 'payment',
						},
					},
					{
						name: 'wpforms_license',
						valueEncoding: 'JSON',
						valueFrom: {
							secretKeyRef: {
								name: 'wp-plugin-secrets',
								key: 'wpforms_license_json',
							},
						},
					},
				],
			},
		}),
	},
	PAYONLINE: {
		NAME: 'Payonline',
		LABEL: 'Payonline',
		getPlugins: () => ({
			'wpforms-epfl-payonline': {
				wp_options: [
					{
						name: 'wpforms-epfl-payonline-saferpay-apiusername-test',
						valueFrom: {
							secretKeyRef: {
								name: 'wp-plugin-secrets',
								key: 'saferpay_test_apiusername',
							},
						},
					},
					{
						name: 'wpforms-epfl-payonline-saferpay-apipassword-test',
						valueFrom: {
							secretKeyRef: {
								name: 'wp-plugin-secrets',
								key: 'saferpay_test_apipassword',
							},
						},
					},
					{
						name: 'wpforms-epfl-payonline-saferpay-customerid-test',
						valueFrom: {
							secretKeyRef: {
								name: 'wp-plugin-secrets',
								key: 'saferpay_test_customerid',
							},
						},
					},
					{
						name: 'wpforms-epfl-payonline-saferpay-terminalid-test',
						valueFrom: {
							secretKeyRef: {
								name: 'wp-plugin-secrets',
								key: 'saferpay_test_terminalid',
							},
						},
					},
					{
						name: 'wpforms-epfl-payonline-saferpay-apiusername-prod',
						valueFrom: {
							secretKeyRef: {
								name: 'wp-plugin-secrets',
								key: 'saferpay_prod_apiusername',
							},
						},
					},
					{
						name: 'wpforms-epfl-payonline-saferpay-apipassword-prod',
						valueFrom: {
							secretKeyRef: {
								name: 'wp-plugin-secrets',
								key: 'saferpay_prod_apipassword',
							},
						},
					},
					{
						name: 'wpforms-epfl-payonline-saferpay-customerid-prod',
						valueFrom: {
							secretKeyRef: {
								name: 'wp-plugin-secrets',
								key: 'saferpay_prod_customerid',
							},
						},
					},
					{
						name: 'wpforms-epfl-payonline-saferpay-terminalid-prod',
						valueFrom: {
							secretKeyRef: {
								name: 'wp-plugin-secrets',
								key: 'saferpay_prod_terminalid',
							},
						},
					},
				],
			},
		}),
	},

	SURVEYS: {
		NAME: 'Surveys',
		LABEL: 'Surveys',
		getPlugins: () => ({
			'wpforms-surveys-polls': {},
		}),
	},

	DIPLOMA_VERIFICATION: {
		NAME: 'DiplomaVerification',
		LABEL: 'Diploma Verification',
		getPlugins: () => ({
			'epfl-diploma-verification': {},
		}),
	},

	PARTNER_UNIVERSITIES: {
		NAME: 'PartnerUniversities',
		LABEL: 'Partner Universities',
		getPlugins: () => ({
			'epfl-partner-universities': {},
		}),
	},

	EPFL_MENUS: {
		NAME: 'epfl-menus',
		LABEL: 'EPFL Menus',
		getPlugins: () => ({
			'epfl-menus': {},
		}),
	},
};

export const OPTIONAL_CATEGORIES = [WP_CATEGORIES.INSIDE, WP_CATEGORIES.RESTAURATION, WP_CATEGORIES.LIBRARY, WP_CATEGORIES.CDHSHS, WP_CATEGORIES.WPFORMS, WP_CATEGORIES.PAYONLINE, WP_CATEGORIES.SURVEYS, WP_CATEGORIES.DIPLOMA_VERIFICATION, WP_CATEGORIES.PARTNER_UNIVERSITIES, WP_CATEGORIES.EPFL_MENUS];
