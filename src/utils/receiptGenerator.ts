import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

interface OrderDetails {
  id: string;
  service: string;
  date: string;
  time: string;
  address: string;
  wasteType: string;
  bagSize: string;
  rider?: string;
  status?: string;
}

export const generateReceipt = async (order: OrderDetails) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Confirmation</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #333;
          margin: 0;
          padding: 20px;
          line-height: 1.5;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #10b981;
          margin-bottom: 10px;
        }
        .subtitle {
          font-size: 16px;
          color: #666;
        }
        .receipt-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          border-bottom: 1px solid #eee;
          padding-bottom: 20px;
        }
        .receipt-details {
          margin-bottom: 30px;
        }
        .row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
        }
        .label {
          color: #666;
          font-weight: 500;
        }
        .value {
          font-weight: 600;
        }
        .footer {
          text-align: center;
          margin-top: 60px;
          color: #999;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">BORLA WURA</div>
        <div class="subtitle">Booking Confirmation</div>
      </div>

      <div class="receipt-info">
        <div>
          <div class="label">Booking Number</div>
          <div class="value">#${order.id}</div>
        </div>
        <div style="text-align: right;">
          <div class="label">Date</div>
          <div class="value">${new Date().toLocaleDateString('en-GB')}</div>
        </div>
      </div>

      <div class="receipt-details">
        <div class="row">
          <span class="label">Service Type</span>
          <span class="value">${order.service}</span>
        </div>
        <div class="row">
          <span class="label">Pickup Date & Time</span>
          <span class="value">${order.date} at ${order.time}</span>
        </div>
        <div class="row">
          <span class="label">Location</span>
          <span class="value">${order.address}</span>
        </div>
        <div class="row">
          <span class="label">Waste Type</span>
          <span class="value">${order.wasteType}</span>
        </div>
        <div class="row">
          <span class="label">Bag Size</span>
          <span class="value">${order.bagSize}</span>
        </div>
        ${order.rider ? `
        <div class="row">
          <span class="label">Rider</span>
          <span class="value">${order.rider}</span>
        </div>
        ` : ''}
      </div>

      <div class="footer">
        <p>Thank you for choosing Borla Wura!</p>
        <p>For support, contact us at: borlawuraapp@gmail.com</p>
        <p>This is a computer-generated receipt.</p>
      </div>
    </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false
    });

    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });

  } catch (error) {
    console.error('Error generating PDF receipt:', error);
  }
};
