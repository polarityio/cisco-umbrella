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

### Cisco Umbrella Management API URL
The URL of the Cisco Umbrella Management API including the schema (i.e., https://).

### Network Device API Key
An API Key that is created using the "Umbrella Network Device" option selected.

### Network Device Secret Key
They Secret Key that is created using the "Umbrella Network Device" option selected.

### Management API Key
An API Key that is created using the "Umbrella Management" option selected.

### Management Secret Key
They Secret Key that is created using the "Umbrella Management" option selected.


## Installation Instructions

Installation instructions for integrations are provided on the [PolarityIO GitHub Page](https://polarityio.github.io/).

## Polarity

Polarity is a memory-augmentation platform that improves and accelerates analyst decision making.  For more information about the Polarity platform please see:

https://polarity.io/
