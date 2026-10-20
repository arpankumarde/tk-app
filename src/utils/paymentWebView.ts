// PayU skips its UPI app launch when the user agent carries Android's "; wv" WebView marker,
// so the named app buttons (GPay, PhonePe, ...) silently do nothing. Hide the marker from the page.
export const HIDE_WEBVIEW_UA_JS = `
(function () {
  var ua = navigator.userAgent;
  try {
    Object.defineProperty(navigator, "userAgent", {
      get: function () { return ua.replace("; wv", ""); }
    });
  } catch (e) {}
})();
true;
`;
