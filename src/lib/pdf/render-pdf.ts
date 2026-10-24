import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { DisputeDossierPDF } from '@/components/pdf/dossier-document';
import { StructuredSummary } from '@/types/dispute';

interface RenderDossierPDFParams {
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

export async function generateDossierPDFBuffer(params: RenderDossierPDFParams): Promise<Buffer> {
  const element = React.createElement(DisputeDossierPDF, params);
  const buffer = await renderToBuffer(element as any);
  return buffer;
}
