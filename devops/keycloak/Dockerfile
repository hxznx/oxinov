# syntax=docker/dockerfile:1.7
# Oxinov identity server (id.oxinov.com): Keycloak plus the reviewed email one-time-code extension (ADR-016).
# The extension is fetched by exact release URL and SHA-256 so a changed file fails the build.
# Keycloak stays on the minor version the extension is built for; upgrade both together.
ARG KEYCLOAK_VERSION=26.7.3

FROM quay.io/keycloak/keycloak:${KEYCLOAK_VERSION}@sha256:29be7252db0a106f1cd2ac17b9a56ff2668073da645638a38b9fc67deeb2d6c4 AS builder
ENV KC_DB=postgres \
    KC_HEALTH_ENABLED=true \
    KC_METRICS_ENABLED=true
ADD --chown=keycloak:keycloak \
    --checksum=sha256:deb048514e780b698fb8c649903c2ceea9669523779279b9fe22e7220dd3d42a \
    https://github.com/for-keycloak/email-otp-authenticator/releases/download/v1.5.0/email-otp-authenticator-v1.5.0-kc-26.7.3.jar \
    /opt/keycloak/providers/email-otp-authenticator.jar
RUN /opt/keycloak/bin/kc.sh build

FROM quay.io/keycloak/keycloak:${KEYCLOAK_VERSION}@sha256:29be7252db0a106f1cd2ac17b9a56ff2668073da645638a38b9fc67deeb2d6c4
COPY --from=builder /opt/keycloak/ /opt/keycloak/
ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
