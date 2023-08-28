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
  acronym: 'UMB',
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
    proxy: ''
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
      key: 'umbrellaUrl',
      name: 'Cisco Umbrella API URL',
      description:
        'The URL of the Cisco Umbrella API including the schema (i.e., https://).  Defaults to "https://api.umbrella.com".',
      default: 'https://api.umbrella.com',
      type: 'text',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'investigateUrl',
      name: 'Cisco Umbrella Investigate API URL',
      description:
        'The URL of the Cisco Umbrella Investigate API including the schema (i.e., https://).  Defaults to "https://investigate.api.umbrella.com".',
      default: 'https://investigate.api.umbrella.com',
      type: 'text',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'apiKey',
      name: 'Cisco Umbrella API Key',
      description: 'Valid Cisco Umbrella API Key',
      default: '',
      type: 'password',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'secretKey',
      name: 'Cisco Umbrella API Key Secret',
      description: 'Valid Cisco Umbrella API Key Secret',
      default: '',
      type: 'password',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'investigateApiKey',
      name: 'Cisco Umbrella Investigate API key',
      description: 'Valid Cisco Umbrella Investigate API key',
      default: '',
      type: 'password',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'statuses',
      name: 'Return Statuses',
      description:
        'Select one of more statuses that will be returned when searching.  The default is to all available domains.',
      default: [
        {
          value: '-1',
          display: 'Malicious'
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
      userCanEdit: false,
      adminOnly: true
    },

    {
      key: 'getWhoIsData',
      name: 'Get WHOIS Data',
      description:
        'If checked, each domain will get the WHOIS information for domains that have your selected Return Statuses. Must be set to "Users can view only".',
      default: true,
      type: 'boolean',
      userCanEdit: false,
      adminOnly: false
    },
    {
      key: 'allowBlocklistSubmission',
      name: 'Allow Blocklist Submission',
      description:
        'Allows you to submit a domain to be blocklisted on Cisco Umbrella.  Must be set to "Users can view only".',
      default: true,
      type: 'boolean',
      userCanEdit: false,
      adminOnly: false
    },
    {
      key: 'allowAllowlistSubmission',
      name: 'Allow Allowlist Submission',
      description:
        'Allows you to submit a domain to be allowlisted on Cisco Umbrella. Must be set to "Users can view only".',
      default: true,
      type: 'boolean',
      userCanEdit: false,
      adminOnly: false
    }
  ]
};
