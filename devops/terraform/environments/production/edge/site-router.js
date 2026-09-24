// CloudFront Function (cloudfront-js-2.0, viewer request) for the oxinov.com static export.
// Terraform substitutes the company domain into APEX before publishing (site.tf).
var APEX = '__APEX_DOMAIN__';

function queryString(querystring) {
  var parts = [];
  for (var key in querystring) {
    var entry = querystring[key];
    var values = entry.multiValue ? entry.multiValue : [entry];
    for (var i = 0; i < values.length; i++) {
      parts.push(values[i].value === '' ? key : key + '=' + values[i].value);
    }
  }
  return parts.length ? '?' + parts.join('&') : '';
}

function redirect(location) {
  return {
    statusCode: 301,
    statusDescription: 'Moved Permanently',
    headers: { location: { value: location } },
  };
}

function handler(event) {
  var request = event.request;
  var host = request.headers.host ? request.headers.host.value : APEX;
  var uri = request.uri;

  // One canonical address: www.oxinov.com/... -> oxinov.com/...
  if (host !== APEX) {
    return redirect('https://' + APEX + uri + queryString(request.querystring));
  }

  // The export uses trailing slashes: /about/ is stored as /about/index.html.
  if (uri.endsWith('/')) {
    request.uri = uri + 'index.html';
  } else if (uri.lastIndexOf('.') < uri.lastIndexOf('/')) {
    return redirect(uri + '/' + queryString(request.querystring));
  }
  return request;
}
