<#import "footer.ftl" as loginFooter>
<#--
  Oxinov layout for every sign-in page (sign in, email code, create account, email confirmation, errors, sign-out).
  Keeps the base theme's contract: the same macro, parameters, and nested sections, and its session scripts.
  English only (ADR-020); customers never see a password field (FR-ID-2204).
-->
<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=true displayRequiredFields=false>
<!DOCTYPE html>
<html class="${properties.kcHtmlClass!}" lang="${lang}">
<head>
    <meta charset="utf-8">
    <#if properties.meta?has_content>
        <#list properties.meta?split(' ') as meta>
            <meta name="${meta?split('==')[0]}" content="${meta?split('==')[1]}"/>
        </#list>
    </#if>
    <title><#if pageId == "register">${msg("registerTitle")}<#else>${title!}</#if></title>
    <link rel="icon" type="image/svg+xml" href="${url.resourcesPath}/img/oxinov-symbol.svg" />
    <#if properties.styles?has_content>
        <#list properties.styles?split(' ') as style>
            <link href="${url.resourcesPath}/${style}" rel="stylesheet" />
        </#list>
    </#if>
    <#if scripts??>
        <#list scripts as script>
            <script src="${script}" type="text/javascript"></script>
        </#list>
    </#if>
    <script type="module">
        <#outputformat "JavaScript">
        import { startSessionPolling } from ${(url.resourcesPath + "/js/authChecker.js")?c};
        startSessionPolling(${url.ssoLoginInOtherTabsUrl?c});
        </#outputformat>
    </script>
    <#if authenticationSession??>
        <script type="module">
            <#outputformat "JavaScript">
            import { checkAuthSession } from ${(url.resourcesPath + "/js/authChecker.js")?c};
            checkAuthSession(${authenticationSession.authSessionIdHash?c});
            </#outputformat>
        </script>
    </#if>
</head>

<body class="${properties.kcBodyClass!} ${bodyClass}" data-page-id="login-${pageId}">
<a class="ox-skip" href="#kc-content">${msg("oxSkipToForm")}</a>
<div class="${properties.kcLoginClass!}">
    <header id="kc-header" class="${properties.kcHeaderClass!}">
        <a class="ox-brand-link" href="${properties.oxHomeUrl!}" aria-label="${msg("oxHomeLabel")}">
            <img class="ox-logo ox-logo-dark" src="${url.resourcesPath}/img/oxinov-symbol.svg" alt="" width="40" height="40" />
            <img class="ox-logo ox-logo-light" src="${url.resourcesPath}/img/oxinov-symbol-light.svg" alt="" width="40" height="40" />
            <span class="${properties.kcHeaderWrapperClass!}" translate="no">OXINOV</span>
        </a>
    </header>

    <main class="${properties.kcFormCardClass!}" aria-labelledby="kc-page-title">
        <div class="${properties.kcFormHeaderClass!}">
            <h1 id="kc-page-title"><#nested "header"></h1>
            <#if auth?has_content && auth.showUsername() && !auth.showResetCredentials()>
                <#nested "show-username">
                <p id="kc-username" class="ox-identity">
                    <span>${msg("oxSigningInAs")}</span>
                    <strong id="kc-attempted-username" dir="ltr">${auth.attemptedUsername}</strong>
                    <a id="reset-login" href="${url.loginRestartFlowUrl}">${msg("oxUseDifferentEmail")}</a>
                </p>
            </#if>
            <#if displayRequiredFields>
                <p class="ox-required-note"><span class="required" aria-hidden="true">*</span> ${msg("requiredFields")}</p>
            </#if>
        </div>

        <div id="kc-content">
            <#-- App-initiated actions should not see warnings about the action they are completing. -->
            <#if displayMessage && message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
                <div class="${properties.kcAlertClass!} ox-alert-${message.type}" role="<#if message.type = 'error'>alert<#else>status</#if>">
                    <span class="${properties.kcAlertTitleClass!}">${kcSanitize(message.summary)?no_esc}</span>
                </div>
            </#if>

            <#nested "form">

            <#if auth?has_content && auth.showTryAnotherWayLink()>
                <form id="kc-select-try-another-way-form" action="${url.loginAction}" method="post">
                    <input type="hidden" name="tryAnotherWay" value="on"/>
                    <button type="submit" class="ox-link-button" id="try-another-way">${msg("doTryAnotherWay")}</button>
                </form>
            </#if>

            <#nested "socialProviders">

            <#if displayInfo>
                <div id="kc-info" class="${properties.kcSignUpClass!}">
                    <div id="kc-info-wrapper" class="${properties.kcInfoAreaWrapperClass!}">
                        <#nested "info">
                    </div>
                </div>
            </#if>
        </div>
        <@loginFooter.content/>
    </main>

    <p class="ox-help-line"><a href="${properties.oxHelpUrl!}">${msg("oxTroubleSigningIn")}</a></p>

    <footer class="ox-footer">
        <nav aria-label="${msg("oxFooterLabel")}">
            <a href="${properties.oxPrivacyUrl!}">${msg("oxPrivacy")}</a>
            <a href="${properties.oxTermsUrl!}">${msg("oxTerms")}</a>
            <a href="${properties.oxHomeUrl!}">oxinov.com</a>
        </nav>
        <p>&copy; Ox Inov Pvt. Ltd.</p>
    </footer>
</div>
</body>
</html>
</#macro>
