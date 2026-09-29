---
name: oxinov-ansible
description: Handle requests for Ansible or host configuration management at Oxinov - explains that no Ansible hosts exist today, where node configuration actually lives (bootstrap-node.sh, Terraform user data), and what must be true before Ansible is introduced. Use when asked to write playbooks, inventories, or configure hosts.
---

# Oxinov and Ansible

Plan larger or cross-cutting infrastructure changes first with the oxinov-devops-architecture skill (tool ownership, today's production against the reference architecture, and the production safety rules).

Source: [devops/ansible](../../../devops/ansible/README.md), [deployment](../../../docs/10-devops/deployment.md).

## Today

**Oxinov does not use Ansible.** `devops/ansible/` is a reserved folder with no inventory, playbooks, or target hosts. The one production node is configured by:

| What | Where |
| --- | --- |
| First boot | `devops/terraform/environments/production/starter/user-data.sh.tftpl` |
| k3s, Helm, secrets, and node setup (idempotent, versions pinned by SHA-256) | `devops/kubernetes/scripts/bootstrap-node.sh` |
| Operating system updates | Amazon Linux 2023 automatic security updates |
| Commands on the node | Systems Manager, through `oxctl` and `devops/scripts/ssm-run.sh` |

There is no SSH to the node, which Ansible normally needs.

## When asked for a host change

1. Put it in `bootstrap-node.sh` (or the Terraform user data for first-boot only), keeping it idempotent and pinned.
2. Rehearse with `bash devops/kubernetes/scripts/rehearse-local.sh` and check with `bash devops/scripts/check-delivery.sh`.
3. Never change the node by hand without writing the change back into the script.

## Before introducing Ansible

Ansible becomes worth it only when there are several hosts to keep alike (for example, more nodes outside Kubernetes). It needs, in one change approved by the owner:

- an ADR explaining why the scripts and Terraform are no longer enough
- a connection method without SSH keys or open ports (for example the Systems Manager connection plugin)
- inventory credentials kept in a secret store, never in Git
- playbooks that are idempotent, pinned, and checked in CI (`ansible-lint`)

Do not write playbooks for hosts that do not exist.
