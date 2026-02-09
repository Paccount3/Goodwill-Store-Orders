# Email Integration Options for Order Notifications

This document outlines various options for sending email notifications when orders are submitted.

## Recommended Options

### 1. **Resend** (Recommended for Production)
- **Why**: Modern API, excellent developer experience, good free tier (3,000 emails/month)
- **Setup**: 
  - Sign up at https://resend.com
  - Get API key
  - Install: `npm install resend`
- **Pros**: 
  - Simple API
  - Good deliverability
  - Free tier sufficient for MVP
  - Built for transactional emails
- **Cons**: 
  - Requires account setup
  - Newer service (but well-established)

### 2. **Nodemailer with Gmail** (Best for Testing/Development)
- **Why**: Easy to set up, works with personal Gmail accounts
- **Setup**:
  - Install: `npm install nodemailer`
  - Use Gmail App Password (not regular password)
  - Configure SMTP settings
- **Pros**:
  - Free
  - Easy to test locally
  - No account limits for personal use
- **Cons**:
  - Not ideal for production
  - Gmail has sending limits (500/day for free accounts)
  - Requires App Password setup

### 3. **SendGrid** (Enterprise Option)
- **Why**: Industry standard, very reliable, good free tier (100 emails/day)
- **Setup**:
  - Sign up at https://sendgrid.com
  - Get API key
  - Install: `npm install @sendgrid/mail`
- **Pros**:
  - Very reliable
  - Good analytics
  - Free tier available
  - Enterprise-grade
- **Cons**:
  - More complex setup
  - Account verification required

### 4. **AWS SES** (Cost-Effective for Scale)
- **Why**: Very cheap ($0.10 per 1,000 emails), scalable
- **Setup**:
  - AWS account required
  - Install: `npm install @aws-sdk/client-ses`
  - Configure IAM credentials
- **Pros**:
  - Very cheap at scale
  - Highly scalable
  - Part of AWS ecosystem
- **Cons**:
  - More complex setup
  - Requires AWS account
  - Account starts in "sandbox" mode

### 5. **Mailgun** (Developer-Friendly)
- **Why**: Good API, 5,000 free emails/month for 3 months
- **Setup**:
  - Sign up at https://mailgun.com
  - Get API key
  - Install: `npm install mailgun.js`
- **Pros**:
  - Good free tier
  - Developer-friendly
  - Good documentation
- **Cons**:
  - Free tier limited to 3 months
  - Requires domain verification

## Implementation Example (Resend)

```typescript
// app/api/orders/email/route.ts
import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const order = await request.json()
    
    const { data, error } = await resend.emails.send({
      from: 'orders@yourcompany.com',
      to: 'fulfillment@yourcompany.com',
      subject: `New Order #${order.id} - ${order.orderType}`,
      html: `
        <h2>New Order Submitted</h2>
        <p><strong>Order ID:</strong> #${order.id}</p>
        <p><strong>Type:</strong> ${order.orderType}</p>
        <p><strong>Store:</strong> ${order.store.name}</p>
        <p><strong>Manager:</strong> ${order.managerName}</p>
        <p><strong>Date:</strong> ${new Date(order.orderDate).toLocaleDateString()}</p>
        <p><strong>Subtotal:</strong> $${(order.subtotalCents / 100).toFixed(2)}</p>
        <h3>Items:</h3>
        <ul>
          ${order.orderLines.map((line: any) => 
            `<li>${line.productNameSnapshot} - Qty: ${line.orderQuantity} - $${(line.lineTotalCents / 100).toFixed(2)}</li>`
          ).join('')}
        </ul>
        ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ''}
      `,
    })

    if (error) {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
```

Then call it after order creation:
```typescript
// In handleConfirmSubmit
const order = await res.json()
// Send email
await fetch('/api/orders/email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(order),
})
```

## Environment Variables

Add to `.env.local`:
```
RESEND_API_KEY=re_xxxxxxxxxxxxx
# or
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
# or
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
```

## Recommendation

For this MVP, I recommend **Resend** because:
1. Simple setup
2. Good free tier (3,000 emails/month)
3. Modern, clean API
4. Built specifically for transactional emails
5. Easy to migrate from later if needed

For quick testing, **Nodemailer with Gmail** works well but should be replaced for production.
