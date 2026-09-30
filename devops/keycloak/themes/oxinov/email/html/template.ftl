<#macro emailLayout>
<html lang="${locale.language}">
<body style="margin:0;padding:0;background:#F4F7FB;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7FB;padding:24px 12px;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#FFFFFF;border:1px solid #D5DCE8;">
        <tr>
          <td style="padding:20px 28px;border-bottom:3px solid #0077A3;font-family:Arial,Helvetica,sans-serif;font-size:18px;letter-spacing:4px;font-weight:bold;color:#0A0A12;">OXINOV</td>
        </tr>
        <tr>
          <td style="padding:28px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#0A0A12;">
            <#nested>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 28px;border-top:1px solid #D5DCE8;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#4A5568;">
            ${msg("oxEmailFooterLine1")}<br/>${msg("oxEmailFooterLine2")} <a href="mailto:support@oxinov.com" style="color:#0077A3;">support@oxinov.com</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>
</#macro>
