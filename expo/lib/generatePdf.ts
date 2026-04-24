import { Platform, Linking } from 'react-native';

interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
  currency: string;
}

interface InvoiceData {
  orderId: string;
  date: string;
  buyerName: string;
  items: InvoiceItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  currency: string;
  paymentMethod: string;
  deliveryAddress?: string;
}

function fmt(amount: number, currency: string): string {
  if (currency === 'XOF') return `${amount.toLocaleString('fr-FR')} FCFA`;
  return `${amount.toLocaleString('fr-FR')} ${currency}`;
}

function paymentLabel(method: string): string {
  const labels: Record<string, string> = {
    orange_money: 'Orange Money',
    wave: 'Wave',
    free_money: 'Free Money',
    paiement_livraison: 'Paiement à la livraison',
    card: 'Carte bancaire',
  };
  return labels[method] || method;
}

// #13 Génération facture HTML → impression/PDF natif du navigateur
export async function generateAndDownloadPDF(data: InvoiceData): Promise<void> {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    shareInvoiceWhatsApp(data);
    return;
  }

  const date = new Date(data.date).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const itemsHTML = data.items.map(item => `
    <tr>
      <td>${item.name}</td>
      <td style="text-align:center">${item.quantity}</td>
      <td style="text-align:right">${fmt(item.price, item.currency)}</td>
      <td style="text-align:right">${fmt(item.price * item.quantity, item.currency)}</td>
    </tr>
  `).join('');

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Facture AgriLien — ${data.orderId.slice(-10).toUpperCase()}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; color: #1a1a1a; font-size: 13px; }
    .header { background: #1B6B2A; color: white; padding: 28px 32px; display: flex; justify-content: space-between; align-items: flex-start; }
    .brand { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
    .brand-sub { font-size: 11px; opacity: 0.8; margin-top: 4px; }
    .invoice-meta { text-align: right; }
    .invoice-meta h2 { font-size: 18px; font-weight: 700; }
    .invoice-meta p { font-size: 11px; opacity: 0.85; margin-top: 2px; }
    .body { padding: 28px 32px; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 24px; }
    .info-block h3 { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
    .info-block p { font-size: 13px; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    thead tr { background: #1B6B2A; color: white; }
    thead th { padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 600; }
    thead th:not(:first-child) { text-align: right; }
    tbody tr:nth-child(even) { background: #f5fbf6; }
    tbody td { padding: 9px 12px; border-bottom: 1px solid #e8f0e9; font-size: 13px; }
    .totals { margin-left: auto; width: 280px; }
    .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
    .total-row.grand { background: #1B6B2A; color: white; padding: 10px 14px; border-radius: 8px; margin-top: 6px; font-size: 15px; font-weight: 700; }
    .divider { border: none; border-top: 1px solid #e0ece2; margin: 8px 0; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 2px solid #1B6B2A; text-align: center; color: #888; font-size: 11px; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">🌾 AgriLien</div>
      <div class="brand-sub">La marketplace agricole du Sénégal et du Mali</div>
    </div>
    <div class="invoice-meta">
      <h2>FACTURE</h2>
      <p>N° ${data.orderId.slice(-10).toUpperCase()}</p>
      <p>Date : ${date}</p>
    </div>
  </div>

  <div class="body">
    <div class="info-row">
      <div class="info-block">
        <h3>Facturé à</h3>
        <p><strong>${data.buyerName}</strong></p>
        ${data.deliveryAddress ? `<p>${data.deliveryAddress}</p>` : ''}
        <p>Paiement : ${paymentLabel(data.paymentMethod)}</p>
      </div>
      <div class="info-block" style="text-align:right">
        <h3>AgriLien</h3>
        <p>dist-mu-five-46.vercel.app</p>
        <p>Sénégal · Mali</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Produit</th>
          <th style="text-align:right">Qté</th>
          <th style="text-align:right">Prix unitaire</th>
          <th style="text-align:right">Total</th>
        </tr>
      </thead>
      <tbody>${itemsHTML}</tbody>
    </table>

    <div class="totals">
      <div class="total-row"><span>Sous-total</span><span>${fmt(data.subtotal, data.currency)}</span></div>
      <div class="total-row"><span>Livraison</span><span>${data.deliveryFee === 0 ? 'Gratuit' : fmt(data.deliveryFee, data.currency)}</span></div>
      <hr class="divider">
      <div class="total-row grand"><span>TOTAL</span><span>${fmt(data.total, data.currency)}</span></div>
    </div>

    <div class="footer">
      <p>Merci pour votre confiance ! 🌾 AgriLien — dist-mu-five-46.vercel.app</p>
    </div>
  </div>
</body>
</html>`;

  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 500);
}

// Partage WhatsApp avec récapitulatif texte
export function shareInvoiceWhatsApp(data: InvoiceData): void {
  const itemsText = data.items
    .map(i => `  • ${i.name} x${i.quantity} — ${fmt(i.price * i.quantity, i.currency)}`)
    .join('\n');

  const text =
    `🧾 *Facture AgriLien*\n` +
    `N° ${data.orderId.slice(-10).toUpperCase()}\n` +
    `Date : ${new Date(data.date).toLocaleDateString('fr-FR')}\n\n` +
    `*Articles :*\n${itemsText}\n\n` +
    `Sous-total : ${fmt(data.subtotal, data.currency)}\n` +
    `Livraison : ${data.deliveryFee === 0 ? 'Gratuit' : fmt(data.deliveryFee, data.currency)}\n` +
    `*TOTAL : ${fmt(data.total, data.currency)}*\n\n` +
    `Paiement : ${paymentLabel(data.paymentMethod)}\n` +
    `Merci pour votre confiance ! 🌾`;

  const url = Platform.OS === 'web'
    ? `https://wa.me/?text=${encodeURIComponent(text)}`
    : `whatsapp://send?text=${encodeURIComponent(text)}`;
  void Linking.openURL(url);
}
