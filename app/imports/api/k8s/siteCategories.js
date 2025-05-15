class WPVeritasCategory {
    constructor(opts) {
    Object.assign(this, opts);
  }
}

const knownLanguages = {
  'en': { 'name' : 'English', 'locale' : 'en_US', 'rtl' : 0, 'term_group' : 0, 'flag' : 'us'},
  'fr': { 'name' : 'Français', 'locale' : 'fr_FR', 'rtl' : 0, 'term_group' : 1, 'flag' : 'fr'},
  'de': { 'name' : 'Deutsch', 'locale' : 'de_DE', 'rtl' : 0, 'term_group' : 2, 'flag' : 'de'},
  'it': { 'name' : 'Italiano', 'locale' : 'it_IT', 'rtl' : 0, 'term_group' : 3, 'flag' : 'it'},
  'es': { 'name' : 'Español', 'locale' : 'es_ES', 'rtl' : 0, 'term_group' : 4, 'flag' : 'es'},
  'el': { 'name' : 'Ελληνικά', 'locale' : 'el', 'rtl' : 0, 'term_group' : 5, 'flag' : 'gr'},
  'ro': { 'name' : 'Română', 'locale' : 'ro_RO', 'rtl' : 0, 'term_group' : 6, 'flag' : 'ro'},
}

export class DefaultCategory extends WPVeritasCategory {
  get plugins () {
    return {
      "epfl-404": {
      },
      enlighter: {
        wp_options: { // TODO
        }
      },
      "wp-plugin-pushgateway": {
      },
      accred: {
        wp_options: {
        }
      },
      "epfl-cache-control": {
        wp_options: {
        }
      },
      "epfl-coming-soon": {
        wp_options: {
        }
      },
      "EPFL-Content-Filter": {
      },
      "epfl-remote-content-shortcode": {
      },
      "EPFL-settings": {
      },
      "tequila": {
        wp_options: {
        }
      },
      "ewww-image-optimizer": {
        wp_options: {
        }
      },
      "find-my-blocks": {
      },
      "flowpaper-lite-pdf-flipbook": {
      },
      polylang: {
        wp_options: [
          { name: "widget_polylang",
            phpSerializedValue: { '_multiwidget': 1 }
          },
          { name: "polylang_settings",
            phpSerializedValue: { 'wizard': false }
          },
          { name: "polylang_wizard_done",
            value: true
          },
          { name: "pll_dismissed_notices",
            phpSerializedValue: ['wizard'],
          },
          { name: "polylang_wpml_strings",
            phpSerializedValue: [],
          },
          { name: "polylang",
            phpSerializedValue: {
              browser: 0,
              rewrite: 1,
              hide_default: 1,
              force_lang: 1,
              redirect_lang: 0,
              media_support: false,
              uninstall:  0,
              sync: [],
              post_types: [],
              taxonomies: [],
              domains: [],
              version: '3.5.4',
              first_activation: Math.floor(new Date() / 1000),
              default_lang: this.languages[0]
            }
          },
        ],
        polylang: {
          languages: this.languages.map((l) => ({ slug: l, ...knownLanguages[l] }))
        }
      },
      redirection: {
      },
      "tinymce-advanced": {
      },
      "very-simple-meta-description": {
      },
      "wp-gutenberg-epfl": {
      },
      "wp-media-folder" : {
        wp_options: { // TODO
        }
      },
    }
  }
}

export class CategoryWPForms extends WPVeritasCategory {
  get plugins () {
    return {
      wpforms: {
        wp_options: [
          { name: "wpforms_challenge", phpSerializedValue: {
            'status': 'skipped',
            'step': 0,
            'user_id': 1,
            'form_id': 0,
            'embed_page': 0,
            'started_date_gmt': '2020-07-08 07:47:17',
            'finished_date_gmt': '2020-07-08 07:47:17',
            'seconds_spent': 0,
            'seconds_left': 300,
            'feedback_sent': false,
            'feedback_contact_me': false,
          } },
          { name: "wpforms_settings", phpSerializedValue: {
            'currency': 'CHF',
            'hide-announcements': true,
            'hide-admin-bar': true,
            'uninstall-data': false,
            'email-summaries-disable': false,
            'disable-css': '1',
            'global-assets': false,
            'gdpr': true,
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
          } },
          { name: "wpforms_license",
            valueFrom: { secretKeyRef: {
              name: "wp-plugin-secrets",
              key: "wpforms_license_phpserialized"
            } }
          }
        ]
      },
      'wpforms-epfl-payonline': {
        wp_options: [
          { name: "wpforms-epfl-payonline-saferpay-apiusername-test",
            valueFrom: { secretKeyRef : {
              name: "wp-plugin-secrets",
              key: "saferpay_test_apiusername"
            } } },
          { name: "wpforms-epfl-payonline-saferpay-apipassword-test",
            valueFrom: { secretKeyRef : {
              name: "wp-plugin-secrets",
              key: "saferpay_test_apipassword"
            } } },
          { name: "wpforms-epfl-payonline-saferpay-customerid-test",
            valueFrom: { secretKeyRef : {
              name: "wp-plugin-secrets",
              key: "saferpay_test_customerid"
            } } },
          { name: "wpforms-epfl-payonline-saferpay-terminalid-test",
            valueFrom: { secretKeyRef : {
              name: "saferpay_test_terminalid",
              key: "saferpay_test_apiusername"
            } } },

          { name: "wpforms-epfl-payonline-saferpay-apiusername-prod",
            valueFrom: { secretKeyRef : {
              name: "wp-plugin-secrets",
              key: "saferpay_prod_apiusername"
            } } },
          { name: "wpforms-epfl-payonline-saferpay-apipassword-prod",
            valueFrom: { secretKeyRef : {
              name: "wp-plugin-secrets",
              key: "saferpay_prod_apipassword"
            } } },
          { name: "wpforms-epfl-payonline-saferpay-customerid-prod",
            valueFrom: { secretKeyRef : {
              name: "wp-plugin-secrets",
              key: "saferpay_prod_customerid"
            } } },
          { name: "wpforms-epfl-payonline-saferpay-terminalid-prod",
            valueFrom: { secretKeyRef : {
              name: "wp-plugin-secrets",
              key: "saferpay_prod_apiusername"
            } } },
        ]
      },
    }
  }
}

CategoryWPForms.label = "WPForms"

export class CategoryRestauration extends WPVeritasCategory {
  get plugins () {
    return {
      "epfl-restauration": {
        wp_options: [
          { name: "epfl_restauration_api_url", value: "https://nutrimenu.ch/nmapi/getMenu" },
          { name: "epfl_restauration_api_username", value: "epfl.getmenu@nutrimenu.ch" },
          { name: "epfl_restauration_api_password",
            valueFrom: { secretKeyRef : {
              name: "wp-plugin-secrets",
              key: "restauration_api_password"
            } } },
        ]
      }
    }
  }
}

CategoryRestauration.label = "Restauration"

// TODO: there are more categories.

export const OptionalCategories = [CategoryWPForms, CategoryRestauration]
