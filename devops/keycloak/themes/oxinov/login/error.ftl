<#import "template.ftl" as layout>
<#-- Errors always offer a way back and a support reference; never technical detail (secure error handling). -->
<@layout.registrationLayout displayMessage=false; section>
    <#if section = "header">
        ${kcSanitize(msg("errorTitle"))?no_esc}
    <#elseif section = "form">
        <div id="kc-error-message">
            <p class="ox-lead">${kcSanitize(message.summary)?no_esc}</p>
            <#if traceId??>
                <p class="ox-help" id="traceId">${msg("traceIdSupportMessage", traceId)}</p>
            </#if>
            <#if !skipLink??>
                <div class="${properties.kcFormButtonsClass!}">
                    <#if client?? && client.baseUrl?has_content>
                        <a id="backToApplication" class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!}" href="${client.baseUrl}">${msg("backToApplication")}</a>
                    <#else>
                        <a id="backToApplication" class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!}" href="${properties.oxHomeUrl!}">${msg("oxBackToOxinov")}</a>
                    </#if>
                </div>
            </#if>
        </div>
    </#if>
</@layout.registrationLayout>
