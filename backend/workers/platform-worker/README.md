# Oxinov platform worker

Target boundary for retryable control-plane work such as notification delivery, verified billing
events, KYC integrations, outbox delivery, and scheduled jobs. It is added as a runtime only when
an approved platform feature needs asynchronous processing.
