<#import "template.ftl" as layout>
<#-- Sign-out confirmation, shown when an app asks Keycloak to sign out without an ID token hint. -->
<@layout.registrationLayout; section>
    <#if section = "header">
        ${msg("logoutConfirmTitle")}
    <#elseif section = "form">
        <div id="kc-logout-confirm">
            <p class="ox-lead">${msg("logoutConfirmHeader")}</p>
            <form class="${properties.kcFormClass!}" action="${url.logoutConfirmAction}" onsubmit="confirmLogout.disabled = true; return true;" method="POST">
                <input type="hidden" name="session_code" value="${logoutConfirm.code}">
                <div id="kc-form-buttons" class="${properties.kcFormButtonsClass!}">
                    <button class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!}" name="confirmLogout" id="kc-logout" type="submit">${msg("doLogout")}</button>
                    <#if !logoutConfirm.skipLink && (client.baseUrl)?has_content>
                        <a class="${properties.kcButtonClass!} ${properties.kcButtonSecondaryClass!} ${properties.kcButtonBlockClass!}" href="${client.baseUrl}">${msg("oxStaySignedIn")}</a>
                    </#if>
                </div>
            </form>
        </div>
    </#if>
</@layout.registrationLayout>
