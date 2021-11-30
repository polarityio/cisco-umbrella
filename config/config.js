module.exports = {
  /**
   * Name of the integration which is displayed in the Polarity integrations user interface
   *
   * @type String
   * @required
   */
  name: 'Cisco Umbrella (OpenDNS)',
  /**
   * The acronym that appears in the notification window when information from this integration
   * is displayed.  Note that the acronym is included as part of each "tag" in the summary information
   * for the integration.  As a result, it is best to keep it to 4 or less characters.  The casing used
   * here will be carried forward into the notification window.
   *
   * @type String
   * @required
   */
  acronym: 'ODNS',
  /**
   * Description for this integration which is displayed in the Polarity integrations user interface
   *
   * @type String
   * @optional
   */
  description: 'Provides domain status and categorization',
  entityTypes: ['domain'],
  defaultColor: 'light-pink',
  /**
   * An array of style files (css or less) that will be included for your integration. Any styles specified in
   * the below files can be used in your custom template.
   *
   * @type Array
   * @optional
   */
  styles: ['./styles/umbrella.less'],
  /**
   * Provide custom component logic and template for rendering the integration details block.  If you do not
   * provide a custom template and/or component then the integration will display data as a table of key value
   * pairs.
   *
   * @type Object
   * @optional
   */
  block: {
    component: {
      file: './components/umbrella-block.js'
    },
    template: {
      file: './templates/umbrella-block.hbs'
    }
  },
  request: {
    // Provide the path to your certFile. Leave an empty string to ignore this option.
    // Relative paths are relative to the METD integration's root directory
    cert: '',
    // Provide the path to your private key. Leave an empty string to ignore this option.
    // Relative paths are relative to the METD integration's root directory
    key: '',
    // Provide the key passphrase if required.  Leave an empty string to ignore this option.
    // Relative paths are relative to the METD integration's root directory
    passphrase: '',
    // Provide the Certificate Authority. Leave an empty string to ignore this option.
    // Relative paths are relative to the METD integration's root directory
    ca: '',
    // An HTTP proxy to be used. Supports proxy Auth with Basic Auth, identical to support for
    // the url parameter (by embedding the auth info in the uri)
    proxy: '',

    rejectUnauthorized: true
  },
  logging: {
    level: 'info' //trace, debug, info, warn, error, fatal
  },
  /**
   * Options that are displayed to the user/admin in the Polarity integration user-interface.  Should be structured
   * as an array of option objects.
   *
   * @type Array
   * @optional
   */
  options: [
    {
      key: 'investigateUrl',
      name: 'Cisco Umbrella Investigate API URL',
      description:
        'The URL of the Cisco Umbrella Investigate API including the schema (i.e., https://)',
      default: 'https://investigate.api.umbrella.com',
      type: 'text',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'apiKey',
      name: 'API Key',
      description: 'Valid Cisco Umbrella API Key',
      default: '',
      type: 'password',
      userCanEdit: true,
      adminOnly: false
    },
    {
      key: 'statuses',
      name: 'Return Statuses',
      description:
        'Select one of more statuses that will be returned when searching.  The default is to only return domains that have a status of "malicious".',
      default: [
        {
          value: '-1',
          display: 'Malicious'
        }
      ],
      type: 'select',
      options: [
        {
          value: '0',
          display: 'Uncategorized'
        },
        {
          value: '1',
          display: 'Benign'
        },
        {
          value: '-1',
          display: 'Malicious'
        }
      ],
      multiple: true,
      userCanEdit: true,
      adminOnly: false
    },

    {
      key: 'getWhoIsData',
      name: 'Get WHOIS Data for Domains',
      description: 'If checked, each domain will get the WHOIS information for domains that have your selected Return Statuses.',
      default: true,
      type: 'boolean',
      userCanEdit: true,
      adminOnly: false
    },
    // {
    //   key: 'allowBlocklistSubmission',
    //   name: 'Allow Blocklist Submission',
    //   description: 'Allows you to submit a domain to be blocklisted on Cisco Umbrella.',
    //   default: true,
    //   type: 'boolean',
    //   userCanEdit: true,
    //   adminOnly: false
    // },
    // {
    //   key: 'allowAllowlistSubmission',
    //   name: 'Allow Allowlist Submission',
    //   description: 'Allows you to submit a domain to be allowlisted on Cisco Umbrella.',
    //   default: true,
    //   type: 'boolean',
    //   userCanEdit: true,
    //   adminOnly: false
    // },
    {
      key: 'managementUrl',
      name: 'Cisco Umbrella Management API URL',
      description:
        'The URL of the Cisco Umbrella Management API including the schema (i.e., https://).',
      default: 'https://management.api.umbrella.com',
      type: 'text',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'networkDevicesApiKey',
      name: 'Network Device API Key',
      description:
        'An API Key that is created using the "Umbrella Network Device" option selected.',
      default: '',
      type: 'password',
      userCanEdit: true,
      adminOnly: false
    },
    {
      key: 'networkDevicesSecretKey',
      name: 'Network Device Secret Key',
      description:
        'They Secret Key that is created using the "Umbrella Network Device" option selected.',
      default: '',
      type: 'password',
      userCanEdit: true,
      adminOnly: false
    },
    {
      key: 'managementApiKey',
      name: 'Management API Key',
      description:
        'An API Key that is created using the "Umbrella Management" option selected.',
      default: '',
      type: 'password',
      userCanEdit: true,
      adminOnly: false
    },
    {
      key: 'managementSecretKey',
      name: 'Management Secret Key',
      description:
        'They Secret Key that is created using the "Umbrella Management" option selected.',
      default: '',
      type: 'password',
      userCanEdit: true,
      adminOnly: false
    }
  ]
};
