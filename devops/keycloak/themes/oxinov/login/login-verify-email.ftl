<#import "template.ftl" as layout>
<#-- New accounts confirm their email address with a link before first sign-in completes (FR-ID-2202). -->
<@layout.registrationLayout displayInfo=true; section>
    <#if section = "header">
        ${msg("emailVerifyTitle")}
    <#elseif section = "form">
        <p class="ox-lead">
            <#if verifyEmail??>
                ${msg("emailVerifyInstruction1", verifyEmail)}
            <#else>
                ${msg("emailVerifyInstruction4", user.email)}
            </#if>
        </p>
        <ul class="ox-tips">
            <li>${msg("oxVerifyTipExpiry")}</li>
            <li>${msg("oxVerifyTipSpam")}</li>
            <li>${msg("oxVerifyTipSameBrowser")}</li>
        </ul>
        <#if isAppInitiatedAction??>
            <form id="kc-verify-email-form" class="${properties.kcFormClass!}" action="${url.loginAction}" method="post">
                <div class="${properties.kcFormButtonsClass!}">
                    <#if verifyEmail??>
                        <button class="${properties.kcButtonClass!} ${properties.kcButtonSecondaryClass!} ${properties.kcButtonBlockClass!}" type="submit">${msg("emailVerifyResend")}</button>
                    <#else>
                        <button class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!}" type="submit">${msg("emailVerifySend")}</button>
                    </#if>
                    <button class="${properties.kcButtonClass!} ${properties.kcButtonSecondaryClass!} ${properties.kcButtonBlockClass!}" type="submit" name="cancel-aia" value="true" formnovalidate>${msg("doCancel")}</button>
                </div>
            </form>
        </#if>
    <#elseif section = "info">
        <#if !isAppInitiatedAction??>
            <p>${msg("emailVerifyInstruction2")} <a href="${url.loginAction}">${msg("oxResendLink")}</a></p>
        </#if>
    </#if>
</@layout.registrationLayout>
