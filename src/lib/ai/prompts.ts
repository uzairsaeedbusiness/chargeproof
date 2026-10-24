import { StructuredSummary } from '@/types/dispute';

export const GEMINI_SYSTEM_PROMPT = `
You are an expert Payment Dispute Resolution Analyst and Payment Network Evidence Strategist specializing in Visa Compelling Evidence 3.0 (CE3.0), Mastercard Rules, and Stripe/PayPal merchant arbitration.
Your objective is to ingest raw order metadata, tracking history, customer communications, and refund policy excerpts, and generate a bank-standard dispute package that maximizes win rates.

Always output strictly valid JSON conforming to the requested schema with no conversational text or markdown code blocks.
`;

export const INR_PROMPT_TEMPLATE = (input: {
  orderData: string;
  trackingHistory: string;
  customerEmails?: string;
  storePolicy?: string;
}) => `
Analyze this "Item Not Received" (INR) dispute. Under Visa/Mastercard arbitration, physical goods delivered to the customer address with carrier timestamps constitute prima facie evidence of order fulfillment.

[RAW ORDER DATA]
${input.orderData}

[CARRIER TRACKING HISTORY]
${input.trackingHistory}

[CUSTOMER SUPPORT THREAD]
${input.customerEmails || 'No customer direct communications provided.'}

[STORE TERMS & SHIPPING POLICY]
${input.storePolicy || 'Standard merchant shipping policy: Delivery considered complete upon carrier final scan confirmation.'}

Return JSON with this exact schema:
{
  "executiveSummary": "Concise 3-sentence summary for the bank arbiter explaining why the claim must be overturned based on confirmed carrier delivery.",
  "orderVerification": {
    "orderNumber": "Extracted order ID",
    "orderDate": "YYYY-MM-DD",
    "deliveryDate": "YYYY-MM-DD",
    "carrier": "Carrier name (e.g. USPS, FedEx, UPS, DHL)",
    "trackingNumber": "Carrier tracking number",
    "destinationAddress": "Shipping destination address"
  },
  "chronologicalTimeline": [
    { "timestamp": "YYYY-MM-DD HH:MM", "event": "Event title", "significance": "Why this proves legitimate fulfillment" }
  ],
  "ce3Points": [
    "Item was dispatched to the exact verified address provided during checkout.",
    "Carrier confirmed successful physical delivery with GPS/scan verification.",
    "Customer did not notify merchant of non-delivery prior to filing card dispute."
  ],
  "customerCommunicationSummary": "Summary of emails showing delivery confirmation notification or contradiction.",
  "policyAdherence": "Store Shipping Policy Clause: Risk of loss passes to purchaser upon delivery scan by carrier.",
  "stripeFormSnippets": {
    "productDescription": "Physical merchandise delivered via carrier.",
    "customerCommunication": "Notification emails and tracking links dispatched upon shipment.",
    "refundPolicyDisclosure": "Customer agreed to store terms during checkout.",
    "shippingDocumentation": "Official carrier tracking scan confirming delivery to customer destination address."
  }
}
`;

export const FRAUD_CE30_PROMPT_TEMPLATE = (input: {
  orderData: string;
  ipAndDeviceLogs: string;
  customerHistory?: string;
  storePolicy?: string;
}) => `
Analyze this "Fraudulent / Card Not Present / Unrecognized Transaction" dispute.
Evaluate evidence according to Visa Compelling Evidence 3.0 (CE3.0) standards:
1. Prior undisputed transactions from matching customer ID, IP, shipping address, or device fingerprint.
2. AVS (Address Verification System) Match (Full match / Y) and CVV2 Match (M).
3. Positive customer interaction or proof of merchandise receipt.

[RAW ORDER DATA]
${input.orderData}

[IP, DEVICE & AVS LOGS]
${input.ipAndDeviceLogs}

[CUSTOMER ACCOUNT HISTORY]
${input.customerHistory || 'No prior disputes on record for this customer account.'}

[STORE TERMS OF SERVICE]
${input.storePolicy || 'Standard e-commerce terms of service and billing consent.'}

Return JSON with this exact schema:
{
  "executiveSummary": "Formal rebuttal asserting transaction legitimacy under Visa CE3.0 / Mastercard fraud rules with positive AVS/CVV authorization.",
  "fraudDefenseIndicators": {
    "avsResult": "Full Match (Street & ZIP)",
    "cvvResult": "Match (M)",
    "ipAddress": "IPv4 / IPv6 recorded at checkout",
    "deviceFingerprint": "Consistent device hash recorded",
    "priorUndisputedTransactionsCount": 1
  },
  "chronologicalTimeline": [
    { "timestamp": "YYYY-MM-DD HH:MM", "event": "Order placed with AVS/CVV verification", "significance": "Proves physical cardholder authentication at checkout" },
    { "timestamp": "YYYY-MM-DD HH:MM", "event": "Order dispatched to verified billing address", "significance": "Matches cardholder registered address on file" }
  ],
  "visaCE30ComplianceStatement": "This transaction satisfies Visa Compelling Evidence 3.0 (CE3.0) requirements. The merchant verified card security code (CVV2), billing address verification (AVS), and matched geolocation data showing legitimate cardholder authorization.",
  "stripeFormSnippets": {
    "productDescription": "Online purchase authorized by cardholder.",
    "customerCommunication": "Order confirmation and fulfillment notices dispatched without complaint.",
    "refundPolicyDisclosure": "Checkout terms required active agreement prior to charge authorization.",
    "shippingDocumentation": "Goods dispatched directly to cardholder's AVS-verified billing address."
  }
}
`;

export function getMockDossier(reasonCode: string, orderNumber: string): StructuredSummary {
  const isINR = reasonCode === 'product_not_received';

  return {
    executiveSummary: isINR
      ? `This rebuttal conclusively demonstrates that Order #${orderNumber} was fulfilled, dispatched, and physically delivered to the cardholder's verified shipping address via carrier tracking. Under standard card network arbitration guidelines, completed delivery with scan records constitutes complete merchant fulfillment.`
      : `This rebuttal proves that Order #${orderNumber} was legitimately authorized under Visa Compelling Evidence 3.0 (CE3.0) standards. Both CVV2 and full AVS (Address Verification Service) matches were returned by the issuing bank at the time of charge authorization.`,
    orderVerification: {
      orderNumber: orderNumber || 'ORD-98241',
      orderDate: '2026-10-14 14:22 UTC',
      deliveryDate: '2026-10-18 11:45 UTC',
      carrier: 'USPS Priority Mail',
      trackingNumber: '9400111899223194820192',
      destinationAddress: '742 Evergreen Terrace, Springfield, OR 97477',
    },
    fraudDefenseIndicators: !isINR
      ? {
          avsResult: 'Y (Street & 5-digit ZIP match)',
          cvvResult: 'M (CVV matches)',
          ipAddress: '198.51.100.42 (Springfield, OR)',
          deviceFingerprint: 'Chrome 124 / macOS (Match)',
          priorUndisputedTransactionsCount: 2,
        }
      : undefined,
    chronologicalTimeline: [
      {
        timestamp: '2026-10-14 14:22',
        event: 'Order Placed & Payment Authorized',
        significance: 'Customer accepted merchant terms of sale and provided verified billing details.',
      },
      {
        timestamp: '2026-10-15 09:30',
        event: 'Order Dispatched with USPS Tracking',
        significance: 'Automated fulfillment notification dispatched to cardholder email.',
      },
      {
        timestamp: '2026-10-18 11:45',
        event: 'Delivered in Front Porch / Mailbox',
        significance: 'Official postal carrier terminal scan confirms physical receipt at destination.',
      },
    ],
    ce3Points: isINR
      ? [
          'Merchandise was shipped to the exact recipient address specified by cardholder at checkout.',
          'USPS delivery confirmation scan verified physical delivery on October 18, 2026.',
          'Cardholder did not file any support inquiry or lost parcel inquiry prior to initiating dispute.',
        ]
      : undefined,
    visaCE30ComplianceStatement: !isINR
      ? 'The transaction adheres to Visa CE3.0 standards: both cardholder identification variables and AVS/CVV authentication matched the legitimate account holder without anomaly.'
      : undefined,
    customerCommunicationSummary:
      'Order confirmation and automated shipping status emails were opened by the buyer without any bounce or dispute reported to merchant support.',
    policyAdherence:
      'Store Policy §4.2: Delivery confirmation provided by carrier constitutes definitive proof of transfer of goods.',
    stripeFormSnippets: {
      productDescription: `E-commerce merchandise (Order #${orderNumber})`,
      customerCommunication: 'Order confirmation and tracking status delivered via email.',
      refundPolicyDisclosure: 'Customer checked agreement box for standard return & shipping policy.',
      shippingDocumentation: 'USPS Priority Mail tracking confirmation with delivery timestamp.',
    },
  };
}
