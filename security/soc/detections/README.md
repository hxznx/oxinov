# Detection rules

Rules use portable Sigma YAML and the normalized fields in `../event-schema.json`. Each rule needs an owner, severity, false-positive notes, test events, and a linked response runbook before production activation.

Threshold and multi-event correlation are configured in the selected SIEM. The starter Sigma rules intentionally match individual high-signal events and avoid relying on vendor-specific aggregation syntax.
