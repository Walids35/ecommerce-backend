import { OrderStatusUpdateData } from '../dto/mailing.dto';

export function generateOrderStatusUpdateEmail(data: OrderStatusUpdateData) {
  const statusColors: Record<string, string> = {
    pending: '#fbbf24',
    confirmed: '#3b82f6',
    processing: '#8b5cf6',
    shipped: '#10b981',
    delivered: '#059669',
    cancelled: '#ef4444',
  };

  const statusColor = statusColors[data.newStatus] || '#667eea';

  return {
    subject: `Order ${data.orderNumber} - ${data.statusMessage}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, ${statusColor} 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">${data.statusMessage}</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hello <strong>${data.customerName}</strong>,</p>

    <p style="font-size: 16px; margin-bottom: 30px;">
      Your order <strong style="color: ${statusColor};">${data.orderNumber}</strong> status has been updated.
    </p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h2 style="color: ${statusColor}; margin-top: 0; font-size: 20px; border-bottom: 2px solid ${statusColor}; padding-bottom: 10px;">Status Update</h2>

      <div style="display: flex; justify-content: space-between; align-items: center; padding: 20px 0;">
        <div style="text-align: center; flex: 1;">
          ${data.oldStatus ? `
          <div style="font-size: 14px; color: #666; margin-bottom: 5px;">Previous Status</div>
          <div style="font-size: 16px; font-weight: bold; color: #999; text-transform: capitalize;">${data.oldStatus}</div>
          ` : ''}
        </div>
        <div style="text-align: center; flex: 1;">
          <div style="font-size: 14px; color: #666; margin-bottom: 5px;">Current Status</div>
          <div style="font-size: 18px; font-weight: bold; color: ${statusColor}; text-transform: capitalize;">${data.newStatus}</div>
        </div>
      </div>

      <p style="margin-top: 20px; color: #666; font-size: 14px;">
        Updated on: ${new Date(data.updatedAt).toLocaleString('en-US', {
          dateStyle: 'long',
          timeStyle: 'short'
        })}
      </p>
    </div>

    <div style="text-align: center; margin-top: 30px;">
      <a href="${data.orderTrackingUrl}" style="display: inline-block; background: linear-gradient(135deg, ${statusColor} 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">View Order Details</a>
    </div>

    <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; text-align: center;">
      Thank you for your patience!<br>
      If you have any questions, please contact our support team.
    </p>
  </div>
</body>
</html>
    `,
  };
}
