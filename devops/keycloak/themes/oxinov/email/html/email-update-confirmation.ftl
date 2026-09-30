<#import "template.ftl" as layout>
<#-- Confirms a new email address before it replaces the old one (account page, "Update email"). -->
<@layout.emailLayout>
<p style="margin:0 0 16px;">${msg("oxUpdateEmailIntro", newEmail)}</p>
<p style="margin:0 0 20px;"><a href="${link}" style="display:inline-block;padding:12px 24px;background:#0077A3;color:#FFFFFF;font-weight:bold;text-decoration:none;">${msg("oxUpdateEmailButton")}</a></p>
<p style="margin:0 0 16px;">${msg("oxVerifyExpiry", linkExpirationFormatter(linkExpiration))}</p>
<p style="margin:0 0 16px;color:#4A5568;font-size:14px;">${msg("oxUpdateEmailIgnore")}</p>
<p style="margin:0;color:#4A5568;font-size:12px;word-break:break-all;">${msg("oxVerifyPlainLink")} ${link}</p>
</@layout.emailLayout>
