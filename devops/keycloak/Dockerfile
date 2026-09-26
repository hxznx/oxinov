# syntax=docker/dockerfile:1.7
# Oxinov identity server (id.oxinov.com): Keycloak plus the reviewed email one-time-code extension (ADR-016).
# The extension is fetched by exact release URL and SHA-256 so a changed file fails the build.
# Keycloak stays on the minor version the extension is built for; upgrade both together.
ARG KEYCLOAK_VERSION=26.7.4

FROM quay.io/keycloak/keycloak:${KEYCLOAK_VERSION}@sha256:82a77884f3af238beab1e7afd63b5f530e1b5c0590bd7aa60b40a40463e29b2c AS builder
ENV KC_DB=postgres \
    KC_HEALTH_ENABLED=true \
    KC_METRICS_ENABLED=true
ADD --chown=keycloak:keycloak \
    --checksum=sha256:deb048514e780b698fb8c649903c2ceea9669523779279b9fe22e7220dd3d42a \
    https://github.com/for-keycloak/email-otp-authenticator/releases/download/v1.5.0/email-otp-authenticator-v1.5.0-kc-26.7.3.jar \
    /opt/keycloak/providers/email-otp-authenticator.jar
RUN /opt/keycloak/bin/kc.sh build

FROM quay.io/keycloak/keycloak:${KEYCLOAK_VERSION}@sha256:82a77884f3af238beab1e7afd63b5f530e1b5c0590bd7aa60b40a40463e29b2c
COPY --from=builder /opt/keycloak/ /opt/keycloak/
# The upstream image already runs as the unprivileged keycloak user (UID 1000); state it explicitly.
USER 1000
ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
