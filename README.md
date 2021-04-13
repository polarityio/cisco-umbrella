# Polarity Cisco Umbrella (OpenDNS) Integration

Provides categorization information for domains.  Will report whether a domain is uncategorized, malicious or benign and includes content and security category details.

| ![image](images/overlay.png) |
|---|
|*Cisco Umbrella* |

## Options

### Cisco Umbrella Investigate API URL

The URL of the Cisco Umbrella Investigate API including the schema (i.e., https://)

Defaults to `https://investigate.api.umbrella.com`

### API Key

Valid Cisco Umbrella API Key

### Return Statuses

Select one of more statuses that will be returned. The default is to only return domains that have a status of "malicious".

Valid values are: `Malicious`, `Benign`, and `Uncategorized`


### Allow Blocklist Submission
Allows you to submit a domain to be blocklisted on Cisco Umbrella.

### Cisco Umbrella Enforcement API URL
The URL of the Cisco Umbrella Enforcement API including the schema (i.e., https://).

### Customer Key
Your Customer Key which can be found/generated in the Dashboard under Policies/Integrations.

### Event Types
A Comma-Separated List of Event Types for when submitting domains to your Blocklist.

## Installation Instructions

Installation instructions for integrations are provided on the [PolarityIO GitHub Page](https://polarityio.github.io/).

## Polarity

Polarity is a memory-augmentation platform that improves and accelerates analyst decision making.  For more information about the Polarity platform please see:

https://polarity.io/
