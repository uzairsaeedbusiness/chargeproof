import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { StructuredSummary } from '@/types/dispute';

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 9.5,
    fontFamily: 'Helvetica',
    color: '#1E293B',
    lineHeight: 1.4,
  },
  header: {
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#2563EB',
    paddingBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 4,
  },
  badge: {
    backgroundColor: '#EFF6FF',
    color: '#1D4ED8',
    padding: '3 8',
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 6,
    fontSize: 8.5,
    fontWeight: 'bold',
  },
  section: {
    marginTop: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  calloutBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  calloutText: {
    fontSize: 9,
    color: '#334155',
    lineHeight: 1.4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 4,
  },
  tableCellLabel: {
    width: '35%',
    color: '#64748B',
    fontWeight: 'bold',
  },
  tableCellValue: {
    width: '65%',
    color: '#0F172A',
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  timelineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563EB',
    marginRight: 8,
    marginTop: 3,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTime: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  timelineDesc: {
    fontSize: 8.5,
    color: '#475569',
    marginTop: 1,
  },
  bulletList: {
    marginTop: 4,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bulletDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#059669',
    marginRight: 6,
    marginTop: 4,
  },
  bulletText: {
    fontSize: 9,
    color: '#1E293B',
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 36,
    right: 36,
    textAlign: 'center',
    fontSize: 8,
    color: '#94A3B8',
    borderTopWidth: 0.5,
    borderTopColor: '#E2E8F0',
    paddingTop: 6,
  },
});

interface DossierPDFProps {
  orderNumber: string;
  disputeAmount: number;
  currency: string;
  reasonCode: string;
  customerName: string;
  carrier?: string;
  trackingNumber?: string;
  deliveryStatus?: string;
  summary: StructuredSummary;
}

export const DisputeDossierPDF: React.FC<DossierPDFProps> = ({
  orderNumber,
  disputeAmount,
  currency,
  reasonCode,
  customerName,
  carrier,
  trackingNumber,
  deliveryStatus,
  summary,
}) => (
  <Document>
    {/* Page 1: Executive Rebuttal & Fulfillment Authentication */}
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>OFFICIAL PAYMENT DISPUTE REBUTTAL DOSSIER</Text>
        <Text style={styles.subtitle}>
          Submitted for Card Issuer Arbitration Review & Merchant Protection Validation
        </Text>
        <Text style={styles.badge}>
          CATEGORY: {reasonCode.replace(/_/g, ' ').toUpperCase()} • CLAIM AMOUNT: ${disputeAmount} {currency}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Executive Dispute Rebuttal</Text>
        <View style={styles.calloutBox}>
          <Text style={styles.calloutText}>{summary.executiveSummary}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Transaction & Identity Verification</Text>
        <View style={styles.tableRow}>
          <Text style={styles.tableCellLabel}>Order ID:</Text>
          <Text style={styles.tableCellValue}>{orderNumber}</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableCellLabel}>Cardholder Name:</Text>
          <Text style={styles.tableCellValue}>{customerName}</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableCellLabel}>Disputed Charge:</Text>
          <Text style={styles.tableCellValue}>${disputeAmount} {currency}</Text>
        </View>
        {carrier && (
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLabel}>Fulfillment Carrier:</Text>
            <Text style={styles.tableCellValue}>{carrier}</Text>
          </View>
        )}
        {trackingNumber && (
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLabel}>Tracking Number:</Text>
            <Text style={styles.tableCellValue}>{trackingNumber}</Text>
          </View>
        )}
        {deliveryStatus && (
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLabel}>Carrier Delivery Status:</Text>
            <Text style={styles.tableCellValue}>{deliveryStatus}</Text>
          </View>
        )}
      </View>

      {summary.fraudDefenseIndicators && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. AVS & CVV2 Payment Security Signals</Text>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLabel}>Address Verification (AVS):</Text>
            <Text style={styles.tableCellValue}>{summary.fraudDefenseIndicators.avsResult}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLabel}>Card Security Code (CVV2):</Text>
            <Text style={styles.tableCellValue}>{summary.fraudDefenseIndicators.cvvResult}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLabel}>Checkout IP Address:</Text>
            <Text style={styles.tableCellValue}>{summary.fraudDefenseIndicators.ipAddress}</Text>
          </View>
        </View>
      )}

      {summary.ce3Points && summary.ce3Points.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Card Network Fulfillment Proof Points</Text>
          <View style={styles.bulletList}>
            {summary.ce3Points.map((pt, i) => (
              <View key={i} style={styles.bulletItem}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{pt}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <Text style={styles.footer}>ChargeProof Rebuttal System • Confidential Merchant Evidence • Page 1 of 3</Text>
    </Page>

    {/* Page 2: Chronological Timeline Audit Trail */}
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>CHRONOLOGICAL FULFILLMENT AUDIT TRAIL</Text>
        <Text style={styles.subtitle}>
          Timestamped Sequence of Checkout, Dispatch, and Carrier Delivery Scans
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fulfillment Timeline</Text>
        {summary.chronologicalTimeline.map((item, idx) => (
          <View key={idx} style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTime}>
                [{item.timestamp}] {item.event}
              </Text>
              <Text style={styles.timelineDesc}>{item.significance}</Text>
            </View>
          </View>
        ))}
      </View>

      {summary.customerCommunicationSummary && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Communication Audit</Text>
          <View style={styles.calloutBox}>
            <Text style={styles.calloutText}>{summary.customerCommunicationSummary}</Text>
          </View>
        </View>
      )}

      <Text style={styles.footer}>ChargeProof Rebuttal System • Confidential Merchant Evidence • Page 2 of 3</Text>
    </Page>

    {/* Page 3: Policy Enforcement & Legal Disclosures */}
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>TERMS OF SERVICE & REGULATORY COMPLIANCE</Text>
        <Text style={styles.subtitle}>
          Customer Consent, Return Policy Disclosure & Legal Representation
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Merchant Shipping & Refund Policy Agreement</Text>
        <View style={styles.calloutBox}>
          <Text style={styles.calloutText}>
            {summary.policyAdherence ||
              'Customer affirmatively agreed to merchant Terms of Sale upon checkout. Goods were dispatched per specified carrier standards.'}
          </Text>
        </View>
      </View>

      {summary.visaCE30ComplianceStatement && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Visa Compelling Evidence 3.0 (CE3.0) Assertion</Text>
          <View style={styles.calloutBox}>
            <Text style={styles.calloutText}>{summary.visaCE30ComplianceStatement}</Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Merchant Affirmation</Text>
        <Text style={{ fontSize: 9, color: '#475569', lineHeight: 1.5, marginTop: 4 }}>
          I hereby certify under penalty of perjury that the attached fulfillment records, tracking documentation,
          and communication logs are true, unaltered records maintained in the ordinary course of business.
          The transaction represents an authorized purchase with verifiable delivery to the cardholder.
        </Text>
      </View>

      <Text style={styles.footer}>ChargeProof Rebuttal System • Confidential Merchant Evidence • Page 3 of 3</Text>
    </Page>
  </Document>
);
