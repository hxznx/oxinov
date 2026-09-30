<#import "template.ftl" as layout>
<#--
  Step 1 of sign-in: the email address only. A six-digit code follows (login-email-otp.ftl); there is no
  password step for customers (FR-ID-2202, FR-ID-2204). Google appears here once its client exists (FR-ID-2201).
-->
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username') displayInfo=(realm.registrationAllowed && !registrationDisabled??); section>
    <#if section = "header">
        ${msg("loginAccountTitle")}
    <#elseif section = "form">
        <p class="ox-lead">${msg("oxSignInLead")}</p>
        <form id="kc-form-login" class="${properties.kcFormClass!}" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post" novalidate>
            <#if !usernameHidden??>
                <div class="${properties.kcFormGroupClass!}">
                    <label for="username" class="${properties.kcLabelClass!}">${msg("email")}</label>
                    <input id="username" name="username" type="email" inputmode="email" dir="ltr"
                           class="${properties.kcInputClass!}" value="${(login.username!'')}"
                           autocomplete="email" autocapitalize="none" spellcheck="false" autofocus required
                           aria-describedby="username-help<#if messagesPerField.existsError('username')> input-error-username</#if>"
                           aria-invalid="<#if messagesPerField.existsError('username')>true<#else>false</#if>" />
                    <p id="username-help" class="${properties.kcInputHelperTextAfterClass!}">${msg("oxEmailHelp")}</p>
                    <#if messagesPerField.existsError('username')>
                        <p id="input-error-username" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                            ${kcSanitize(messagesPerField.get('username'))?no_esc}
                        </p>
                    </#if>
                </div>
            </#if>

            <#if realm.rememberMe && !usernameHidden??>
                <div class="${properties.kcCheckClass!}">
                    <input class="${properties.kcCheckInputClass!}" id="rememberMe" name="rememberMe" type="checkbox" <#if login.rememberMe??>checked</#if> />
                    <label class="${properties.kcCheckLabelClass!}" for="rememberMe">${msg("rememberMe")}</label>
                </div>
            </#if>

            <div id="kc-form-buttons" class="${properties.kcFormButtonsClass!}">
                <button class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!}" name="login" id="kc-login" type="submit">${msg("oxContinue")}</button>
            </div>
        </form>
    <#elseif section = "info">
        <#if realm.registrationAllowed && !registrationDisabled??>
            <p id="kc-registration">${msg("noAccount")} <a href="${url.registrationUrl}">${msg("oxCreateAccountLink")}</a></p>
        </#if>
    <#elseif section = "socialProviders">
        <#if social?? && social.providers?has_content>
            <div id="kc-social-providers" class="${properties.kcFormSocialAccountSectionClass!}">
                <p class="ox-divider"><span>${msg("oxOr")}</span></p>
                <ul class="${properties.kcFormSocialAccountListClass!}">
                    <#list social.providers as p>
                        <li>
                            <a id="social-${p.alias}" class="${properties.kcFormSocialAccountListButtonClass!}" href="${p.loginUrl}">${msg("oxContinueWith", p.displayName!)}</a>
                        </li>
                    </#list>
                </ul>
            </div>
        </#if>
    </#if>
</@layout.registrationLayout>
