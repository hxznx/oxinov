# Kubernetes templates

These manifests describe the future frontend and backend topology. They remain templates until the container registry, ingress controller, TLS issuer, secret integration, persistent storage, monitoring discovery, namespaces, resource targets, and production cloud provider are selected.

Do not commit Kubernetes `Secret` values. Deployment credentials must come from the selected secrets manager and CI environment.
