<#import "template.ftl" as layout>
<#--
  Step 2 of sign-in: the six-digit code emailed by the email-otp-authenticator extension (FR-ID-2202).
  Replaces the extension's own template; the field and button names (email-otp, login, resend-email) are the
  extension's contract and must not change. Code length and lifetime come from configure-realm.sh
  (code-length 6, code-lifetime 600); update oxCodeLead in messages_en.properties if they change.
-->
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('email-otp'); section>
    <#if section = "header">
        ${msg("oxCodeTitle")}
    <#elseif section = "form">
        <p class="ox-lead">${msg("oxCodeLead")}</p>
        <form id="kc-otp-login-form" class="${properties.kcFormClass!}" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post">
            <div class="${properties.kcFormGroupClass!}">
                <label for="email-otp" class="${properties.kcLabelClass!}">${msg("loginEmailOtp")}</label>
                <input id="email-otp" name="email-otp" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6"
                       autocomplete="one-time-code" dir="ltr" autofocus
                       class="${properties.kcInputClass!} ox-code-input"
                       aria-describedby="email-otp-help<#if messagesPerField.existsError('email-otp')> input-error-email-otp-code</#if>"
                       aria-invalid="<#if messagesPerField.existsError('email-otp')>true<#else>false</#if>" />
                <p id="email-otp-help" class="${properties.kcInputHelperTextAfterClass!}">${msg("oxCodeHelp")}</p>
                <#if messagesPerField.existsError('email-otp')>
                    <p id="input-error-email-otp-code" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                        ${kcSanitize(messagesPerField.get('email-otp'))?no_esc}
                    </p>
                </#if>
            </div>

            <#if deviceTrustEnabled?? && deviceTrustEnabled>
                <div class="${properties.kcCheckClass!}">
                    <input class="${properties.kcCheckInputClass!}" type="checkbox" id="trust-device" name="trust-device" value="true" />
                    <label class="${properties.kcCheckLabelClass!}" for="trust-device">${msg("dontAskForCodePermanently")}</label>
                </div>
            </#if>

            <div id="kc-form-buttons" class="${properties.kcFormButtonsClass!}">
                <button class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!}" name="login" id="kc-login" type="submit">${msg("oxSignIn")}</button>
                <button class="${properties.kcButtonClass!} ${properties.kcButtonSecondaryClass!} ${properties.kcButtonBlockClass!}" name="resend-email" id="kc-resend-email" type="submit" formnovalidate>${msg("doResendEmail")}</button>
            </div>
        </form>
    </#if>
</@layout.registrationLayout>
