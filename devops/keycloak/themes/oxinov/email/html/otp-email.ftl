<#import "template.ftl" as layout>
<#-- The six-digit sign-in code (email-otp-authenticator; variables `otp` and `ttlMinutes`). FR-ID-2202. -->
<@layout.emailLayout>
<p style="margin:0 0 16px;">${kcSanitize(msg("emailOtpYourAccessCode"))?no_esc}</p>
<p style="margin:0 0 16px;font-family:'Courier New',Courier,monospace;font-size:32px;font-weight:bold;letter-spacing:8px;color:#0077A3;">${otp}</p>
<p style="margin:0 0 16px;">${kcSanitize(msg("emailOtpExpiration", ttlMinutes))?no_esc}</p>
<p style="margin:0;color:#4A5568;font-size:14px;">${kcSanitize(msg("oxEmailOtpIgnore"))?no_esc}</p>
</@layout.emailLayout>
