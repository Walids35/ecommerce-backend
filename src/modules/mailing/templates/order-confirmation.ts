import { OrderConfirmationData } from '../dto/mailing.dto';

export function generateOrderConfirmationEmail(data: OrderConfirmationData) {
  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.productName}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">$${item.unitPrice}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">$${item.subtotal}</td>
      </tr>
    `
    )
    .join('');

  return {
    subject: `Order Confirmation - ${data.orderNumber}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Thank You for Your Order!</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hello <strong>${data.customerName}</strong>,</p>

    <p style="font-size: 16px; margin-bottom: 30px;">
      Your order has been successfully received and is being processed.
      Your order number is <strong style="color: #667eea;">${data.orderNumber}</strong>
    </p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h2 style="color: #667eea; margin-top: 0; font-size: 20px; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Order Details</h2>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background: #f5f5f5;">
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #667eea;">Product</th>
            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #667eea;">Qty</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #667eea;">Price</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #667eea;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <table style="width: 100%; margin-top: 20px;">
        <tr>
          <td style="padding: 8px; text-align: right; color: #666;">Subtotal:</td>
          <td style="padding: 8px; text-align: right; font-weight: bold; width: 120px;">$${data.subtotal}</td>
        </tr>
        <tr>
          <td style="padding: 8px; text-align: right; color: #666;">Shipping:</td>
          <td style="padding: 8px; text-align: right; font-weight: bold;">$${data.shippingCost}</td>
        </tr>
        <tr>
          <td style="padding: 8px; text-align: right; color: #666;">Tax:</td>
          <td style="padding: 8px; text-align: right; font-weight: bold;">$${data.taxAmount}</td>
        </tr>
        <tr style="border-top: 2px solid #667eea;">
          <td style="padding: 12px 8px; text-align: right; font-size: 18px; font-weight: bold; color: #667eea;">Total:</td>
          <td style="padding: 12px 8px; text-align: right; font-size: 18px; font-weight: bold; color: #667eea;">$${data.totalPrice}</td>
        </tr>
      </table>
    </div>

    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h3 style="color: #667eea; margin-top: 0; font-size: 18px;">Shipping Address</h3>
      <p style="margin: 5px 0; color: #666;">
        ${data.shippingAddress.streetAddress}<br>
        ${data.shippingAddress.city}, ${data.shippingAddress.postalCode}
      </p>
    </div>

    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h3 style="color: #667eea; margin-top: 0; font-size: 18px;">Payment Method</h3>
      <p style="margin: 5px 0; color: #666; text-transform: capitalize;">${data.paymentMethod}</p>
    </div>

    <div style="text-align: center; margin-top: 30px;">
      <a href="${data.orderTrackingUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Track Your Order</a>
    </div>

    <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; text-align: center;">
      If you have any questions, please don't hesitate to contact us.<br>
      Thank you for shopping with us!
    </p>
  </div>
</body>
</html>
    `,
  };
}
