<#import "template.ftl" as layout>
<#-- Confirms a new account's email address (FR-ID-2202). The link is escaped by FreeMarker; texts are plain. -->
<@layout.emailLayout>
<p style="margin:0 0 16px;">${msg("oxVerifyWelcome")}</p>
<p style="margin:0 0 20px;">${msg("oxVerifyIntro")}</p>
<p style="margin:0 0 20px;"><a href="${link}" style="display:inline-block;padding:12px 24px;background:#0077A3;color:#FFFFFF;font-weight:bold;text-decoration:none;">${msg("oxVerifyButton")}</a></p>
<p style="margin:0 0 16px;">${msg("oxVerifyExpiry", linkExpirationFormatter(linkExpiration))}</p>
<p style="margin:0 0 16px;color:#4A5568;font-size:14px;">${msg("oxVerifyIgnore")}</p>
<p style="margin:0;color:#4A5568;font-size:12px;word-break:break-all;">${msg("oxVerifyPlainLink")} ${link}</p>
</@layout.emailLayout>
