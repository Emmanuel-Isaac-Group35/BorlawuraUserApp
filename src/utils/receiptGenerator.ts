import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

interface OrderDetails {
  id: string;
  service: string;
  date: string;
  time: string;
  address: string;
  wasteType: string;
  bagSize: string;
  amount: string;
  rider?: string;
  paymentMethod?: string;
}

export const generateReceipt = async (order: OrderDetails) => {
  // Generate receipt content as formatted text
  const receiptContent = `
═══════════════════════════════════════
         BORLA WURA
    Waste Management Services
═══════════════════════════════════════

           PAYMENT RECEIPT

Receipt #: ${order.id}
Date: ${new Date().toLocaleDateString('en-GB')}

───────────────────────────────────────
Service Details
───────────────────────────────────────

Service Type:      ${order.service}
Pickup Date:       ${order.date} at ${order.time}
Location:          ${order.address}
Waste Type:        ${order.wasteType}
Bag Size:          ${order.bagSize}
${order.rider ? `Rider:              ${order.rider}` : ''}

───────────────────────────────────────
Payment Summary
───────────────────────────────────────

Service Charge:    ${order.amount}
Payment Method:    ${order.paymentMethod || 'Mobile Money'}
Status:            PAID

───────────────────────────────────────
Total Amount:      ${order.amount}
───────────────────────────────────────

Thank you for choosing Borla Wura!

For support, contact us at:
support@borlawura.com | +233 24 123 4567

This is a computer-generated receipt and does
not require a signature.

═══════════════════════════════════════
  `;

  // Create a file with the receipt content
  const fileName = `Borla-Wura-Receipt-${order.id}.txt`;
  const fileUri = `${FileSystem.documentDirectory}${fileName}`;

  try {
    // Write receipt to file
    await FileSystem.writeAsStringAsync(fileUri, receiptContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Check if sharing is available and share the file
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/plain',
        dialogTitle: 'Share Receipt',
      });
    } else {
      console.log('Sharing is not available on this device');
      // Return the receipt content so it can be displayed or handled differently
      return receiptContent;
    }
  } catch (error) {
    console.error('Error generating receipt:', error);
    // Return receipt content as fallback
    return receiptContent;
  }
};
