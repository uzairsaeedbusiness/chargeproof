'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  FileText,
  CheckCircle2,
  Copy,
  Download,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Clock,
  Truck,
  CreditCard,
  AlertTriangle,
  RotateCcw,
  Edit3,
  Plus,
  Trash2,
  FileCheck,
  CheckSquare,
  Square,
  Eye,
} from 'lucide-react';
import { StructuredSummary, TimelineEvent } from '@/types/dispute';

export default function Home() {
  const [reasonCode, setReasonCode] = useState<'product_not_received' | 'fraudulent'>('product_not_received');
  const [orderNumber, setOrderNumber] = useState('ORD-88219');
  const [customerName, setCustomerName] = useState('Jonathan Miller');
  const [disputeAmount, setDisputeAmount] = useState('189.50');
  const [currency, setCurrency] = useState('USD');
  const [carrier, setCarrier] = useState('USPS Priority Mail');
  const [trackingNumber, setTrackingNumber] = useState('9400111899223194820192');
  const [deliveryStatus, setDeliveryStatus] = useState('Delivered (Front Porch)');
  const [orderData, setOrderData] = useState(
    'Item: Ergonomic Office Chair V2, SKU: EOC-BLK, Qty: 1, Destination: 742 Evergreen Terrace, Springfield, OR 97477'
  );
  const [customerEmails, setCustomerEmails] = useState(
    'Customer submitted claim stating parcel was not received. Shipping confirmation was delivered on Oct 14.'
  );
  const [storePolicy, setStorePolicy] = useState(
    'Section 4.1: Merchant fulfillment obligations are deemed satisfied upon documented carrier scan at recipient address.'
  );

  const [loading, setLoading] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState(2);
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [dossierResult, setDossierResult] = useState<StructuredSummary | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Merchant Review & Edit State
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');

  // Legal Shielding & Download Modal
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [certifiedAccurate, setCertifiedAccurate] = useState(false);

  const checkoutUrl =
    process.env.NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL ||
    'https://chargeproof.lemonsqueezy.com/buy/demo-variant';

  const loadSampleINR = () => {
    setReasonCode('product_not_received');
    setOrderNumber('ORD-91044');
    setCustomerName('Sarah Jenkins');
    setDisputeAmount('240.00');
    setCarrier('FedEx Home Delivery');
    setTrackingNumber('78129384719283');
    setDeliveryStatus('Delivered to Front Door, Signed: S. Jenkins');
    setOrderData('Order #ORD-91044: Premium Wool Blanket (Navy), Qty: 2, Shipped to 104 Willow Creek Rd, Denver, CO 80203');
    setCustomerEmails('Buyer opened dispute on Day 12 without replying to tracking email dispatched on Oct 10.');
    setStorePolicy('Terms §6: Shipping protection policy requires delivery scan verification as final delivery proof.');
  };

  const loadSampleFraud = () => {
    setReasonCode('fraudulent');
    setOrderNumber('ORD-74412');
    setCustomerName('Marcus Vance');
    setDisputeAmount('420.00');
    setCarrier('UPS Ground');
    setTrackingNumber('1Z9999999999999999');
    setDeliveryStatus('Delivered to Billing Address');
    setOrderData('Order #ORD-74412: Mechanical Gaming Keyboard + Wrist Rest. Customer IP: 198.51.100.42. AVS: Full Match Y, CVV: Match M.');
    setCustomerEmails('No customer inquiry received prior to chargeback. Customer account logged in from consistent IP address.');
    setStorePolicy('Terms §2: Card authorization requires CVV2 matching and AVS confirmation at checkout.');
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creditsRemaining <= 0 && !isUnlimited) {
      setShowUpgradeModal(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/disputes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber,
          customerName,
          disputeAmount: parseFloat(disputeAmount) || 0,
          currency,
          reasonCode,
          carrier,
          trackingNumber,
          deliveryStatus,
          orderData,
          customerEmails,
          storePolicy,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setDossierResult(data.structuredSummary);
        setActiveTab('preview');
        setCertifiedAccurate(false);
        if (data.creditsRemaining !== undefined) {
          setCreditsRemaining(data.creditsRemaining);
        }
        if (data.isUnlimited !== undefined) {
          setIsUnlimited(data.isUnlimited);
        }
      } else {
        alert(data.error || 'Failed to generate dispute dossier');
        if (res.status === 402) {
          setShowUpgradeModal(true);
        }
      }
    } catch {
      alert('Network error generating dossier. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!dossierResult || !certifiedAccurate) return;
    setDownloadingPdf(true);
    try {
      const res = await fetch('/api/disputes/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber,
          disputeAmount: parseFloat(disputeAmount) || 0,
          currency,
          reasonCode,
          customerName,
          carrier,
          trackingNumber,
          deliveryStatus,
          summary: dossierResult,
        }),
      });

      if (!res.ok) throw new Error('PDF generation failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ChargeProof_Dossier_${orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setShowDownloadModal(false);
    } catch {
      alert('Error downloading PDF dossier');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Timeline Event Editing Handlers
  const handleUpdateTimeline = (index: number, field: keyof TimelineEvent, value: string) => {
    if (!dossierResult) return;
    const updated = [...dossierResult.chronologicalTimeline];
    updated[index] = { ...updated[index], [field]: value };
    setDossierResult({ ...dossierResult, chronologicalTimeline: updated });
  };

  const handleAddTimelineEvent = () => {
    if (!dossierResult) return;
    const newEvent: TimelineEvent = {
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
      event: 'Additional Fulfillment or Policy Event',
      significance: 'Verified event logged by merchant records.',
    };
    setDossierResult({
      ...dossierResult,
      chronologicalTimeline: [...dossierResult.chronologicalTimeline, newEvent],
    });
  };

  const handleDeleteTimelineEvent = (index: number) => {
    if (!dossierResult) return;
    const updated = dossierResult.chronologicalTimeline.filter((_, i) => i !== index);
    setDossierResult({ ...dossierResult, chronologicalTimeline: updated });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 px-4 py-2 text-xs font-medium text-white flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 mx-auto">
          <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
          <span>
            <strong>Visa CE3.0 & Carrier Audit Engine:</strong> Turn lost disputes into won revenue in 60 seconds.
          </span>
        </div>
        <div className="hidden md:flex items-center gap-4 text-xs">
          <span className="bg-blue-900/60 px-2.5 py-0.5 rounded-full border border-blue-400/30">
            {isUnlimited ? 'Unlimited Plan Active' : `${creditsRemaining} Free Dossiers Left`}
          </span>
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="underline hover:text-blue-200 transition font-semibold"
          >
            Upgrade ($49/mo)
          </button>
        </div>
      </div>

      {/* Main Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                ChargeProof <span className="text-[10px] bg-blue-500/20 text-blue-400 font-mono px-1.5 py-0.5 rounded border border-blue-500/30">MICRO-SAAS</span>
              </span>
              <p className="text-[11px] text-slate-400 leading-none">Automated E-Commerce Chargeback Defense</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-semibold text-slate-200">
                {isUnlimited ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Unlimited Plan
                  </span>
                ) : (
                  <span>
                    Credit Balance: <strong className="text-blue-400">{creditsRemaining} / 2 Free</strong>
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500">Zero upfront credit card</p>
            </div>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3.5 py-2 rounded-md shadow-sm transition flex items-center gap-1.5"
            >
              <span>Unlock Unlimited</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Subheader */}
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-4 text-center">
        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white max-w-2xl mx-auto">
          Win Bank Chargebacks in 60 Seconds with AI
        </h1>
        <p className="mt-2 text-sm text-slate-400 max-w-xl mx-auto">
          Compile official 3-page Visa CE3.0 & Carrier Audit dossiers with pre-formatted Stripe, PayPal & Shopify response snippets.
        </p>

        {/* Quick Sample Fill Buttons */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-slate-500 mr-1">Test with realistic samples:</span>
          <button
            type="button"
            onClick={loadSampleINR}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-full border border-slate-700 transition flex items-center gap-1.5"
          >
            <Truck className="w-3.5 h-3.5 text-blue-400" />
            <span>Load "Item Not Received" Sample ($240)</span>
          </button>
          <button
            type="button"
            onClick={loadSampleFraud}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-full border border-slate-700 transition flex items-center gap-1.5"
          >
            <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
            <span>Load "Visa CE3.0 Fraud" Sample ($420)</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <main className="max-w-6xl mx-auto px-4 pb-16 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Intake Form (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                Dispute Intake Details
              </h2>
              <span className="text-[11px] text-slate-400">Step 1: Input</span>
            </div>

            {/* Category Toggle */}
            <div className="mt-4">
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Dispute Reason Code
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReasonCode('product_not_received')}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border text-left transition ${
                    reasonCode === 'product_not_received'
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="font-semibold text-white">Item Not Received</p>
                  <p className="text-[10px] text-slate-400">Carrier delivery scan audit</p>
                </button>
                <button
                  type="button"
                  onClick={() => setReasonCode('fraudulent')}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border text-left transition ${
                    reasonCode === 'fraudulent'
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="font-semibold text-white">Fraud / Unrecognized</p>
                  <p className="text-[10px] text-slate-400">Visa CE3.0 & AVS/CVV</p>
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleGenerate} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Order #</label>
                  <input
                    type="text"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Amount ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={disputeAmount}
                    onChange={(e) => setDisputeAmount(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Carrier</label>
                  <input
                    type="text"
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    placeholder="USPS, FedEx, UPS..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Tracking Number</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. 9400111899..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Delivery Scan Status</label>
                <input
                  type="text"
                  value={deliveryStatus}
                  onChange={(e) => setDeliveryStatus(e.target.value)}
                  placeholder="e.g. Delivered to mailbox / front porch"
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Order Metadata / Items
                </label>
                <textarea
                  rows={2}
                  value={orderData}
                  onChange={(e) => setOrderData(e.target.value)}
                  placeholder="Paste line items, destination address, and timestamps..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Customer Email Thread or Notes
                </label>
                <textarea
                  rows={2}
                  value={customerEmails}
                  onChange={(e) => setCustomerEmails(e.target.value)}
                  placeholder="Paste customer emails, delivery confirmation notifications, or dispute claims..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-2.5 px-4 rounded-lg text-xs shadow-md shadow-blue-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>Analyzing & Compiling Evidence Dossier...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Bank-Ready Rebuttal (1 Credit)</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Output Dossier, Review/Edit & Snippets (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {!dossierResult ? (
            <div className="h-full min-h-[420px] bg-slate-900/40 border border-dashed border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-full bg-blue-900/30 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-white">Your Dispute Dossier Will Appear Here</h3>
              <p className="mt-1 text-xs text-slate-400 max-w-sm">
                Fill the dispute details or click one of the sample buttons on the top right, then hit{' '}
                <strong>"Generate Bank-Ready Rebuttal"</strong>.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3 text-left max-w-md w-full">
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-xs">
                  <div className="font-semibold text-blue-400 flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 3-Page PDF Dossier
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Includes carrier delivery scan, timeline, terms citation, and merchant affidavit.
                  </p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-xs">
                  <div className="font-semibold text-indigo-400 flex items-center gap-1.5 mb-1">
                    <Copy className="w-3.5 h-3.5" /> 1-Click Form Copy
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Pre-formatted text blocks that copy right into Stripe or PayPal claim boxes.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Dossier Header Card with Review & Edit Tabs */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                        EVIDENCE COMPILED
                      </span>
                      <span className="text-xs text-slate-400">Order #{orderNumber}</span>
                    </div>
                    <h2 className="text-base font-bold text-white mt-1">Official Rebuttal Evidence Packet</h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                      <button
                        onClick={() => setActiveTab('preview')}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
                          activeTab === 'preview'
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Eye className="w-3 h-3" />
                        <span>Preview</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('edit')}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
                          activeTab === 'edit'
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Review & Edit</span>
                      </button>
                    </div>

                    <button
                      onClick={() => setShowDownloadModal(true)}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </button>
                  </div>
                </div>

                {/* Tab: Preview Mode */}
                {activeTab === 'preview' ? (
                  <div className="space-y-4 mt-4">
                    {/* Executive Summary */}
                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3" /> Bank Arbiter Executive Summary
                        </h4>
                        <button
                          onClick={() => setActiveTab('edit')}
                          className="text-[11px] text-slate-400 hover:text-blue-400 flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{dossierResult.executiveSummary}</p>
                    </div>

                    {/* Timeline */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> Chronological Fulfillment Audit Trail
                        </h4>
                        <button
                          onClick={() => setActiveTab('edit')}
                          className="text-[11px] text-slate-400 hover:text-blue-400 flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" /> Modify Events
                        </button>
                      </div>
                      <div className="space-y-2">
                        {dossierResult.chronologicalTimeline.map((item, idx) => (
                          <div key={idx} className="bg-slate-950 border border-slate-800/80 p-2.5 rounded-md text-xs">
                            <div className="flex items-center justify-between font-semibold text-slate-200">
                              <span>{item.event}</span>
                              <span className="text-[10px] text-blue-400 font-mono">{item.timestamp}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">{item.significance}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Tab: Review & Edit Mode (Merchant Ownership) */
                  <div className="space-y-4 mt-4 bg-slate-950/60 border border-blue-500/30 rounded-xl p-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Step 2: Customize Evidence Before Export</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Edits automatically update in the generated PDF</span>
                    </div>

                    {/* Edit Executive Summary */}
                    <div>
                      <label className="text-xs font-medium text-slate-300 block mb-1">
                        Executive Summary (Arbiter Rebuttal Text)
                      </label>
                      <textarea
                        rows={4}
                        value={dossierResult.executiveSummary}
                        onChange={(e) =>
                          setDossierResult({ ...dossierResult, executiveSummary: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-md p-2.5 text-xs text-white focus:outline-none focus:border-blue-500 leading-relaxed resize-y"
                      />
                    </div>

                    {/* Edit Chronological Timeline */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-slate-300">
                          Chronological Timeline Bullet Points
                        </label>
                        <button
                          type="button"
                          onClick={handleAddTimelineEvent}
                          className="text-[11px] bg-slate-800 hover:bg-slate-700 text-blue-400 px-2.5 py-1 rounded border border-slate-700 flex items-center gap-1 transition"
                        >
                          <Plus className="w-3 h-3" /> Add Event
                        </button>
                      </div>

                      <div className="space-y-3">
                        {dossierResult.chronologicalTimeline.map((item, idx) => (
                          <div key={idx} className="bg-slate-950 border border-slate-800 p-3 rounded-lg space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <input
                                type="text"
                                value={item.timestamp}
                                onChange={(e) => handleUpdateTimeline(idx, 'timestamp', e.target.value)}
                                placeholder="Timestamp (e.g. 2026-10-15 09:30)"
                                className="w-1/3 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-blue-300 font-mono focus:outline-none focus:border-blue-500"
                              />
                              <input
                                type="text"
                                value={item.event}
                                onChange={(e) => handleUpdateTimeline(idx, 'event', e.target.value)}
                                placeholder="Event title"
                                className="w-2/3 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white font-medium focus:outline-none focus:border-blue-500"
                              />
                              <button
                                type="button"
                                onClick={() => handleDeleteTimelineEvent(idx)}
                                title="Remove event"
                                className="text-slate-500 hover:text-red-400 p-1 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <input
                              type="text"
                              value={item.significance}
                              onChange={(e) => handleUpdateTimeline(idx, 'significance', e.target.value)}
                              placeholder="Fulfillment significance (e.g. Documented carrier physical scan at doorstep)"
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setActiveTab('preview')}
                        className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Save & View Dossier Preview</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 1-Click Form Snippets Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Copy className="w-4 h-4 text-indigo-400" />
                      1-Click Form Snippets (Stripe / PayPal)
                    </h3>
                    <p className="text-[11px] text-slate-400">Click any card to copy into the payment portal</p>
                  </div>
                </div>

                <div className="mt-3 space-y-3">
                  {Object.entries(dossierResult.stripeFormSnippets).map(([fieldKey, textValue]) => {
                    const labelMap: Record<string, string> = {
                      productDescription: 'Product & Service Description',
                      customerCommunication: 'Customer Communication Proof',
                      refundPolicyDisclosure: 'Refund & Terms Disclosure',
                      shippingDocumentation: 'Shipping & Delivery Tracking Documentation',
                    };
                    const isCopied = copiedKey === fieldKey;

                    return (
                      <div
                        key={fieldKey}
                        onClick={() => copyToClipboard(textValue, fieldKey)}
                        className="group bg-slate-950 border border-slate-800 hover:border-blue-500/50 p-3 rounded-lg cursor-pointer transition relative"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-slate-200">{labelMap[fieldKey] || fieldKey}</span>
                          <span className="text-[10px] font-medium text-slate-500 group-hover:text-blue-400 transition flex items-center gap-1">
                            {isCopied ? (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Copied!
                              </span>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" /> Click to copy
                              </>
                            )}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2">{textValue}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Mandatory Legal Certification & Download Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowDownloadModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-xs font-mono"
            >
              ✕
            </button>
            <div className="w-12 h-12 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto mb-3">
              <FileCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white text-center">Confirm Evidence & Merchant Certification</h3>
            <p className="text-xs text-slate-400 mt-1 text-center max-w-md mx-auto">
              Please review the official merchant certification before downloading the compiled 3-page rebuttal PDF.
            </p>

            {/* Disclaimer Box */}
            <div className="mt-4 bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-left">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 mb-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Notice & Limitation of Liability</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                ChargeProof is an automated evidence compilation utility. We do not provide legal, financial, or dispute arbitration representation. Final decisions are made solely by the card issuing bank. In no event shall ChargeProof be liable for disputed funds or lost claims.
              </p>
            </div>

            {/* Mandatory Checkbox */}
            <div
              onClick={() => setCertifiedAccurate(!certifiedAccurate)}
              className="mt-4 flex items-start gap-3 p-3 rounded-lg border border-slate-800 bg-slate-950/80 cursor-pointer hover:border-slate-700 transition"
            >
              <div className="mt-0.5 text-blue-400">
                {certifiedAccurate ? (
                  <CheckSquare className="w-4 h-4 text-blue-500" />
                ) : (
                  <Square className="w-4 h-4 text-slate-600" />
                )}
              </div>
              <label className="text-xs text-slate-300 leading-relaxed cursor-pointer select-none">
                <strong>I certify under penalty of perjury</strong> that the order details, tracking information, and customer communications provided are accurate, unaltered, and true records of merchant fulfillment.
              </label>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowDownloadModal(false)}
                className="w-1/3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold py-2.5 rounded-lg transition"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={!certifiedAccurate || downloadingPdf}
                className="w-2/3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-2.5 px-4 rounded-lg text-xs shadow-md shadow-blue-600/30 transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {downloadingPdf ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>Generating Dossier PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Confirm & Download 3-Page PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Paywall Modal (Lemon Squeezy Wired) */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-center shadow-2xl relative">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-xs font-mono"
            >
              ✕
            </button>
            <div className="w-12 h-12 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Unlock Unlimited Dispute Dossiers</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Recover hundreds of dollars in lost chargebacks every month. Unlimited PDF dossiers, Visa CE3.0 templates, and webhook automation.
            </p>

            <div className="mt-5 bg-slate-950 border border-slate-800 p-4 rounded-xl text-left">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-black text-white">$49</span>
                  <span className="text-xs text-slate-400"> / month</span>
                </div>
                <span className="text-[11px] bg-blue-500/20 text-blue-300 font-semibold px-2 py-0.5 rounded">
                  Merchant of Record
                </span>
              </div>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Unlimited dispute dossiers (INR & Fraud CE3.0)
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Bank-grade 3-page PDF dossier generation
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Global sales tax & VAT handled automatically
                </li>
              </ul>
            </div>

            <div className="mt-5 space-y-2">
              <a
                href={checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-2.5 px-4 rounded-lg text-xs shadow-md transition flex items-center justify-center gap-2"
              >
                <span>Upgrade via Lemon Squeezy Checkout ($49/mo)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => {
                  setIsUnlimited(true);
                  setShowUpgradeModal(false);
                }}
                className="w-full text-xs text-slate-400 hover:text-white py-1.5 transition"
              >
                (Demo Mode: Click to activate unlimited tier locally)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer with Legal Disclaimer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 px-4 text-center text-xs text-slate-500 space-y-3">
        <div className="max-w-4xl mx-auto space-y-2">
          <p className="font-medium text-slate-400">
            ChargeProof • Built for independent e-commerce founders & small agency operators.
          </p>
          <p className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-900 pt-3">
            <strong>Disclaimer:</strong> ChargeProof is an automated evidence compilation utility. We do not provide legal, financial, or dispute arbitration representation. Final decisions are made solely by the card issuing bank. In no event shall ChargeProof be liable for disputed funds or lost claims.
          </p>
          <p className="text-[10px] text-slate-600">
            Visa Compelling Evidence 3.0 (CE3.0) & Card Network Arbitration Compliant • 90-Day Evidence Retention
          </p>
        </div>
      </footer>
    </div>
  );
}
