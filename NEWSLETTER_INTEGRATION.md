# Newsletter Integration Guide

This guide will help you integrate email newsletters into your Fàdè store.

## Quick Start: Resend (Recommended - Easiest Setup)

### Why Resend?
- ✅ Free tier: 3,000 emails/month
- ✅ Super fast setup (5 minutes)
- ✅ Best developer experience
- ✅ Great deliverability
- ✅ Perfect for Next.js

### Setup Steps:

1. **Sign up at [resend.com](https://resend.com)**

2. **Get your API key:**
   - Go to API Keys in dashboard
   - Create a new key
   - Copy it (you'll only see it once!)

3. **Install Resend:**
   ```bash
   npm install resend
   ```

4. **Add to `.env`:**
   ```env
   RESEND_API_KEY=re_123456789abcdef
   ```

5. **Create API route** `app/api/newsletter/send/route.ts`:
   ```typescript
   import { Resend } from 'resend'
   import { prisma } from '@/lib/prisma'
   import { NextResponse } from 'next/server'
   import { requireAdmin } from '@/lib/admin'

   const resend = new Resend(process.env.RESEND_API_KEY)

   export async function POST(request: Request) {
     try {
       await requireAdmin()
       
       const { subject, html, text } = await request.json()
       
       // Get all subscribers
       const subscribers = await prisma.user.findMany({
         where: { marketingEmails: true },
         select: { email: true, name: true }
       })
       
       // Send to each subscriber
       const results = await Promise.all(
         subscribers.map(user =>
           resend.emails.send({
             from: 'Fàdè <newsletter@yourdomain.com>',
             to: user.email,
             subject,
             html,
             text,
           })
         )
       )
       
       return NextResponse.json({ 
         success: true, 
         sent: results.length 
       })
     } catch (error) {
       return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
     }
   }
   ```

6. **Done!** You can now send newsletters.

---

## Alternative Options

### 1. SendGrid
**Best for:** High volume emails

**Setup:**
- Free tier: 100 emails/day
- Good for: E-commerce
- [Sign up →](https://sendgrid.com)

**Steps:**
1. Create account
2. Verify sender email
3. Get API key
4. Install: `npm install @sendgrid/mail`
5. Add to `.env`: `SENDGRID_API_KEY=SG...`

---

### 2. Mailchimp
**Best for:** Marketing automation

**Setup:**
- Free tier: 500 contacts
- Good for: Newsletters + marketing
- [Sign up →](https://mailchimp.com)

**Steps:**
1. Create account
2. Create audience
3. Get API key
4. Install: `npm install @mailchimp/mailchimp_marketing`
5. Add to `.env`: `MAILCHIMP_API_KEY=...`

---

### 3. ConvertKit
**Best for:** Creators, sequences

**Setup:**
- Free tier: 1,000 subscribers
- Good for: Email sequences
- [Sign up →](https://convertkit.com)

---

## Testing Your Integration

Create a test newsletter sender:

```typescript
// app/api/newsletter/test/route.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET() {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Fàdè <newsletter@yourdomain.com>',
      to: 'your-email@example.com',
      subject: 'Test Newsletter',
      html: '<h1>Test Email</h1><p>Newsletter integration is working!</p>'
    })
    
    if (error) throw error
    
    return Response.json({ success: true, id: data?.id })
  } catch (error) {
    return Response.json({ error: 'Failed' }, { status: 500 })
  }
}
```

Then visit: `http://localhost:3000/api/newsletter/test`

---

## Email Templates

For beautiful newsletter templates, check out:
- [MJML](https://mjml.io) - Email framework
- [Resend Templates](https://resend.com/templates) - Pre-made templates
- [Email on Acid](https://www.emailonacid.com/) - Templates & testing

---

## Production Checklist

- [ ] Verify your sender domain
- [ ] Set up SPF record
- [ ] Set up DKIM
- [ ] Test email deliverability
- [ ] Add unsubscribe link (required by law)
- [ ] Handle bounces and unsubscribes

---

## Need Help?

- Resend Docs: https://resend.com/docs
- Next.js Email: https://nextjs.org/docs/guides/email
- Email Best Practices: https://www.mailgun.com/blog/email-deliverability-best-practices


