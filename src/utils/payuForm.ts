export interface PayuFormData {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  surl: string;
  furl: string;
  hash: string;
  payuUrl: string;
  udf1?: string;
}

// PayU field values land inside HTML attributes, so quotes/angle brackets in a
// title (productinfo) or name would otherwise break out of the input tag.
const escapeAttr = (value: string | undefined) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const field = (name: string, value: string | undefined) =>
  `<input type="hidden" name="${name}" value="${escapeAttr(value)}" />`;

/**
 * Auto-submitting PayU checkout form. PayU has no native SDK wired into this
 * app, so every payment (cart + bundles) posts this form from a WebView.
 */
export const buildPayuForm = (data: PayuFormData) => `
<!DOCTYPE html>
<html>
<body onload="document.forms[0].submit()">
  <form method="POST" action="${escapeAttr(data.payuUrl)}">
    ${field("key", data.key)}
    ${field("txnid", data.txnid)}
    ${field("amount", data.amount)}
    ${field("productinfo", data.productinfo)}
    ${field("firstname", data.firstname)}
    ${field("email", data.email)}
    ${field("phone", data.phone)}
    ${field("surl", data.surl)}
    ${field("furl", data.furl)}
    ${field("hash", data.hash)}
    ${data.udf1 ? field("udf1", data.udf1) : ""}
  </form>
</body>
</html>
`;

export default buildPayuForm;
