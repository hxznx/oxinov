# SOC assets

Oxinov emits normalized security events using `event-schema.json` and the action names in `EVENT-CATALOG.md`. Synthetic examples live under `examples/`. A collector forwards validated events to the selected SIEM. Detection rules under `detections/sigma/` create findings; high-confidence findings open the corresponding runbook.

The initial SIEM recommendation is OpenSearch Security Analytics or a compatible managed service because it supports Sigma detections, findings, alerts, and correlation. Amazon GuardDuty Runtime Monitoring supplies ECS Fargate runtime findings. Falco can be added to later EKS/EC2 environments when its deployment and operating model is approved. Wazuh is an optional alternative when endpoint agents, file-integrity monitoring, host inventory, or compliance dashboards are required.

Do not send passwords, tokens, session cookies, payment credentials, raw request bodies, private messages, exam answers, or AI prompts to the SOC pipeline.
