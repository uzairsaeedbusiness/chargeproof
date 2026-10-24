export type DisputeReasonCode = 'product_not_received' | 'fraudulent' | 'unrecognized' | 'other';

export type DisputeStatus = 'draft' | 'generated' | 'submitted' | 'won' | 'lost';

export interface TimelineEvent {
  timestamp: string;
  event: string;
  significance: string;
}

export interface FormSnippets {
  productDescription: string;
  customerCommunication: string;
  refundPolicyDisclosure: string;
  shippingDocumentation: string;
}

export interface StructuredSummary {
  executiveSummary: string;
  orderVerification?: {
    orderNumber: string;
    orderDate: string;
    deliveryDate: string;
    carrier: string;
    trackingNumber: string;
    destinationAddress: string;
  };
  fraudDefenseIndicators?: {
    avsResult: string;
    cvvResult: string;
    ipAddress: string;
    deviceFingerprint?: string;
    priorUndisputedTransactionsCount: number;
  };
  chronologicalTimeline: TimelineEvent[];
  ce3Points?: string[];
  visaCE30ComplianceStatement?: string;
  customerCommunicationSummary?: string;
  policyAdherence?: string;
  stripeFormSnippets: FormSnippets;
}

export interface DisputeRecord {
  id: string;
  user_id: string;
  order_number: string;
  customer_name: string;
  dispute_amount: number;
  currency: string;
  reason_code: DisputeReasonCode;
  carrier?: string;
  tracking_number?: string;
  delivery_status?: string;
  status: DisputeStatus;
  created_at: string;
  updated_at: string;
}

export interface EvidenceDossierRecord {
  id: string;
  dispute_id: string;
  user_id: string;
  pdf_storage_path?: string;
  structured_summary: StructuredSummary;
  form_snippets: FormSnippets;
  created_at: string;
}

export interface UsageCredits {
  user_id: string;
  free_credits_remaining: number;
  is_unlimited: boolean;
  total_dossiers_generated: number;
}
