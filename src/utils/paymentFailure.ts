/**
 * Student-facing text for the `reason` code the payment callback adds to a
 * failed `testkart://payment/callback` deep link. The copy mirrors
 * `helpers/paymentFailureReason.tsx` in the Floot web project; keep them in step.
 * Only known codes map to text, so a crafted link cannot put its own words in the alert.
 */
const MESSAGES: Record<string, string> = {
  payment_captured:
    "PayU shows this payment as received. Please contact support so we can complete your order.",
  cancelled: "The payment was cancelled on the payment page.",
  left_payment_page:
    "The payment page was closed or timed out before the payment was made.",
  not_confirmed: "Your bank or UPI app did not confirm the payment in time.",
  not_started: "The payment was not started.",
  authentication_failed:
    "Your bank could not verify the payment. Check the OTP or PIN and try again.",
  debit_failed:
    "Your bank could not debit the amount. Check your balance or try another payment method.",
  limit_exceeded:
    "The amount is over your card, UPI or account limit. Try another payment method.",
  card_declined:
    "Your card was declined. It may not be enabled for online payments.",
  upi_failed:
    "The UPI payment did not go through. Check your UPI ID and approve the request in your UPI app in time.",
  bank_declined:
    "Your bank declined the payment. Try again or use another payment method.",
  technical_error:
    "The payment could not be processed because of a technical error. Please try again.",
  unknown: "The payment could not be completed. Please try again.",
};

export const DEFAULT_PAYMENT_FAILURE_MESSAGE =
  "Your payment could not be completed. Please try again.";

export function paymentFailureMessage(reason: string | null | undefined): string {
  return reason && Object.prototype.hasOwnProperty.call(MESSAGES, reason)
    ? MESSAGES[reason]
    : DEFAULT_PAYMENT_FAILURE_MESSAGE;
}
