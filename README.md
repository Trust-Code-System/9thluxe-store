# Fádé Essence - Luxury E-Commerce Platform

A modern, full-featured e-commerce platform built with Next.js 16, TypeScript, and Prisma. Fádé Essence specializes in luxury perfumes, offering a premium shopping experience with comprehensive admin management capabilities.

## 🎯 Project Overview

Fádé Essence is a complete e-commerce solution featuring:
- **Customer-facing storefront** with product browsing, cart management, and checkout
- **Admin dashboard** for product, order, and inventory management
- **User authentication** with NextAuth.js v5
- **Payment integration** with Paystack
- **Email notifications** via Resend
- **Inventory management** with low stock alerts
- **Order tracking** and status management
- **Newsletter campaigns** with rich text editor
- **SEO optimization** with dynamic sitemaps and metadata

## ✨ Key Features

### 🛍️ Customer Features

#### Shopping Experience
- **Product Catalog**: Browse luxury perfumes
- **Product Search**: Real-time search across products
- **Product Filtering**: Filter by category, brand, price, and tags (New, Bestseller, Limited)
- **Product Details**: Comprehensive product pages with galleries, specifications, and reviews
- **Related Products**: Smart product recommendations
- **Brand Collections**: Dedicated pages for each brand
- **Featured Collections**: Curated collections (Featured, New Arrivals, Bestsellers, Limited Edition)

#### Cart & Checkout
- **Shopping Cart**: Persistent cart using Zustand with localStorage
- **Cart Management**: Add, update quantities, remove items with stock validation
- **Coupon Codes**: Apply discount codes (e.g., FADE10 for 10% off)
- **Checkout Flow**: Multi-step checkout with shipping and payment
- **Address Management**: Save and manage shipping addresses
- **Delivery Options**: Multiple delivery methods
- **Payment Integration**: Secure payment processing via Paystack

#### User Account
- **User Registration**: Sign up with email and password
- **User Authentication**: Secure login with NextAuth.js
- **Account Dashboard**: View order history, wishlist, and addresses
- **Order Tracking**: Track order status (Pending → Paid → Shipped → Delivered)
- **Order Reviews**: Review and rate purchased products
- **Wishlist**: Save favorite products for later
- **Profile Settings**: Update name, email, and notification preferences
- **Address Book**: Manage multiple shipping addresses

#### Additional Features
- **Product Reviews**: Read and write product reviews with ratings
- **Newsletter Subscription**: Subscribe to marketing emails
- **Help Center**: FAQ, contact, shipping info, and returns policy
- **Social Media Integration**: Links to Instagram, X (Twitter), WhatsApp, TikTok, and Facebook
- **Responsive Design**: Fully responsive across all devices
- **Dark Mode**: Theme toggle for light/dark mode

### 👨‍💼 Admin Features

#### Product Management
- **Product CRUD**: Create, read, update, and delete products
- **Bulk Operations**: Manage multiple products efficiently
- **Image Upload**: Upload up to 4 product images with client-side compression
- **Product Categories**: Organize products by category (Perfumes)
- **Product Tags**: Mark products as New, Bestseller, Limited, or Featured
- **Brand Management**: Add and manage product brands
- **Collections**: Group products into collections
- **Product Search**: Search products by name or brand
- **Soft Deletion**: Products with orders are soft-deleted to preserve order history

#### Order Management
- **Order Dashboard**: View all orders with filtering and search
- **Order Details**: Comprehensive order information with customer details
- **Order Status Updates**: Update order status (Pending → Paid → Shipped → Delivered)
- **Order Notifications**: Automatic notifications when orders are paid
- **Order Export**: Export orders to CSV
- **Payment Verification**: Verify Paystack payments and update order status

#### Inventory Management
- **Stock Tracking**: Track product stock levels
- **Low Stock Alerts**: Automatic alerts for products with stock ≤ 10 units
- **Stock Validation**: Prevent adding out-of-stock items to cart
- **Inventory Dashboard**: Centralized view of all inventory status

#### Category & Collection Management
- **Category CRUD**: Create, edit, and delete product categories
- **Auto-Slug Generation**: Automatic URL-friendly slug generation
- **Category Linking**: Link categories to product types
- **Collection Management**: Create and manage product collections

#### Newsletter Management
- **Campaign Creation**: Create newsletter campaigns with rich text editor
- **HTML Editor**: WYSIWYG editor with image upload support
- **Campaign Management**: Edit, duplicate, delete, and send campaigns
- **Subscriber Management**: View, search, and manage newsletter subscribers
- **Subscriber Stats**: Track subscriber count and growth

#### Notifications
- **Admin Notifications**: Real-time notifications for new orders
- **Notification Center**: View and manage all admin notifications
- **Unread Badge**: Visual indicator for unread notifications

#### Global Search
- **Unified Search**: Search across products, orders, and customers
- **Debounced Search**: Optimized search with debouncing
- **Search Results**: Grouped results by type with quick links

#### Analytics & Reporting
- **Dashboard Stats**: Overview of products, orders, and revenue
- **Product Statistics**: Total products, active products, low stock items
- **Order Analytics**: Order status breakdown and trends

### 🔐 Security Features

- **Authentication**: Secure user authentication with NextAuth.js
- **Route Protection**: Protected admin and account routes
- **Input Validation**: Zod schema validation for all forms
- **XSS Prevention**: Input sanitization
- **Rate Limiting**: API rate limiting to prevent abuse
- **CSRF Protection**: Built-in Next.js CSRF protection
- **Secure Cookies**: HTTP-only cookies for sensitive data
- **Password Hashing**: bcrypt password hashing

### 📧 Email Features

- **Order Confirmations**: Automatic email receipts after payment
- **Order Status Updates**: Email notifications for order status changes
- **Newsletter Campaigns**: Send marketing emails to subscribers
- **Email Templates**: Beautiful HTML email templates
- **Resend Integration**: Professional email delivery via Resend

### 🔍 SEO & Performance

- **Dynamic Sitemap**: Auto-generated sitemap.xml
- **Robots.txt**: Search engine optimization
- **Meta Tags**: Comprehensive Open Graph and Twitter Card support
- **Structured Data**: Ready for JSON-LD structured data
- **Image Optimization**: Next.js Image optimization
- **Code Splitting**: Automatic code splitting for optimal performance
- **Analytics**: Vercel Analytics integration

## 🛠️ Tech Stack

### Frontend
- **Next.js 16**: React framework with App Router
- **React 19**: UI library
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **Zustand**: Lightweight state management
- **React Icons**: Icon library (Font Awesome 6)
- **Sonner**: Toast notifications
- **React Hook Form**: Form management
- **Zod**: Schema validation

### Backend
- **Next.js API Routes**: Serverless API endpoints
- **Next.js Server Actions**: Server-side form handling
- **Prisma**: Type-safe database ORM
- **PostgreSQL**: Relational database via Prisma
- **NextAuth.js v5**: Authentication and session management
- **bcryptjs**: Password hashing

### Services & Integrations
- **Paystack**: Payment processing
- **Resend**: Email delivery service
- **Vercel Analytics**: Web analytics

### Development Tools
- **ESLint**: Code linting
- **TypeScript**: Static type checking
- **Prisma Studio**: Database GUI

## 📁 Project Structure

```
9thluxe-store-starter/
├── app/                          # Next.js App Router pages
│   ├── (routes)/                 # Public routes
│   │   ├── page.tsx             # Homepage
│   │   ├── shop/                # Shop page
│   │   ├── product/[slug]/      # Product detail pages
│   │   ├── collections/         # Collections pages
│   │   ├── category/[slug]/     # Category pages
│   │   ├── cart/                # Shopping cart
│   │   ├── checkout/            # Checkout flow
│   │   ├── about/               # About page
│   │   └── help/                # Help center
│   ├── account/                  # User account pages
│   │   ├── page.tsx             # Account overview
│   │   ├── orders/              # Order history
│   │   ├── addresses/           # Address management
│   │   ├── wishlist/            # Wishlist
│   │   └── settings/            # Account settings
│   ├── admin/                    # Admin dashboard
│   │   ├── page.tsx             # Admin dashboard
│   │   ├── products/            # Product management
│   │   ├── orders/              # Order management
│   │   ├── categories/          # Category management
│   │   ├── collections/         # Collection management
│   │   ├── inventory/           # Inventory management
│   │   └── newsletter/          # Newsletter management
│   ├── auth/                     # Authentication pages
│   │   ├── signin/              # Sign in
│   │   ├── signup/              # Sign up
│   │   └── signout/             # Sign out
│   └── api/                      # API routes
│       ├── auth/                # NextAuth routes
│       ├── admin/               # Admin API endpoints
│       ├── cart/                # Cart API
│       ├── checkout/            # Checkout API
│       ├── paystack/            # Paystack webhook
│       ├── newsletter/          # Newsletter API
│       └── contact/             # Contact form API
├── components/                   # React components
│   ├── ui/                      # Reusable UI components
│   ├── admin/                   # Admin-specific components
│   ├── cart/                    # Cart components
│   ├── checkout/                # Checkout components
│   ├── product/                 # Product components
│   ├── collections/             # Collection components
│   ├── layout/                  # Layout components
│   └── auth/                    # Auth components
├── lib/                          # Utility libraries
│   ├── stores/                  # Zustand stores
│   ├── services/                # Business logic services
│   ├── middleware/              # Middleware functions
│   ├── auth.ts                  # NextAuth configuration
│   ├── prisma.ts                # Prisma client
│   └── utils.ts                 # Utility functions
├── emails/                       # Email templates
│   ├── sendReceipt.ts           # Order receipt email
│   └── sendOrderStatusUpdate.ts # Order status email
├── prisma/                       # Database
│   ├── schema.prisma            # Prisma schema
│   └── migrations/             # Database migrations
└── public/                       # Static assets
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Git** for version control
- **PostgreSQL** database (local or hosted)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd 9thluxe-store-starter
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
    # Database
    DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB?pgbouncer=true&connection_limit=1"

    # NextAuth
    NEXTAUTH_SECRET="your-secret-key-here"
    NEXTAUTH_URL="http://localhost:3000"

   # Paystack (for payments)
   PAYSTACK_PUBLIC_KEY="your-paystack-public-key"
   PAYSTACK_SECRET_KEY="your-paystack-secret-key"

   # Resend (for emails)
   RESEND_API_KEY="your-resend-api-key"
   NEWSLETTER_FROM_EMAIL="noreply@yourdomain.com"

   # Site Configuration
   NEXT_PUBLIC_SITE_URL="http://localhost:3000"
   ```

4. **Set up the database**
   ```bash
    npx prisma generate
    npx prisma migrate dev
   ```

5. **Create an admin user**
   You can create an admin user directly in the database or through Prisma Studio:
   ```bash
   npx prisma studio
   ```
   - Navigate to the `User` model
   - Create a new user with `role: "ADMIN"`
   - Set a password hash (use bcrypt to hash your password)

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔑 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Postgres connection string | `postgresql://...` |
| `NEXTAUTH_SECRET` | NextAuth secret key | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Base URL of your application | `http://localhost:3000` |

### Optional Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PAYSTACK_PUBLIC_KEY` | Paystack public key | `pk_test_...` |
| `PAYSTACK_SECRET_KEY` | Paystack secret key | `sk_test_...` |
| `RESEND_API_KEY` | Resend API key | `re_...` |
| `NEWSLETTER_FROM_EMAIL` | Email sender address | `noreply@yourdomain.com` |
| `NEXT_PUBLIC_SITE_URL` | Public site URL | `https://yourdomain.com` |

## 📊 Database Schema

### Main Models

- **User**: User accounts (customers and admins)
- **Product**: Product catalog with images, pricing, and inventory
- **Category**: Product categories
- **Collection**: Product collections
- **Order**: Customer orders
- **OrderItem**: Order line items
- **Coupon**: Discount coupons
- **Review**: Product reviews and ratings
- **Wishlist**: User wishlists
- **Address**: User shipping addresses
- **NewsletterSubscriber**: Newsletter subscribers
- **NewsletterCampaign**: Newsletter campaigns
- **Notification**: Admin notifications

### Key Features

- **Soft Deletion**: Products are soft-deleted (not permanently removed) when they have associated orders
- **Audit Trails**: Created/updated timestamps on all models
- **Relationships**: Proper foreign key relationships between models

## 🔌 API Endpoints

### Public APIs

- `GET /api/products` - List products
- `GET /api/search?q=query` - Search products
- `POST /api/newsletter/subscribe` - Subscribe to newsletter
- `POST /api/contact` - Submit contact form

### Authenticated APIs

- `GET /api/account/settings` - Get user settings
- `PATCH /api/account/settings` - Update user settings
- `GET /api/cart/summary` - Get cart summary

### Admin APIs

- `GET /api/admin/products` - List products (admin)
- `POST /api/admin/products` - Create product
- `GET /api/admin/products/[id]` - Get product
- `PATCH /api/admin/products/[id]` - Update product
- `DELETE /api/admin/products/[id]` - Delete product
- `GET /api/admin/orders` - List orders
- `GET /api/admin/search?q=query` - Global search
- `GET /api/admin/notifications` - Get notifications
- `PATCH /api/admin/notifications` - Mark notifications as read
- `GET /api/admin/newsletter/campaigns` - List campaigns
- `POST /api/admin/newsletter/campaigns` - Create campaign
- `GET /api/admin/newsletter/subscribers` - List subscribers

### Payment APIs

- `POST /api/paystack/initialize` - Initialize Paystack payment
- `POST /api/paystack/webhook` - Paystack webhook handler

## 🎨 UI Components

The project uses a comprehensive set of reusable UI components built with Radix UI:

- **Button**: Various button styles and sizes
- **Input**: Text inputs with validation
- **Select**: Dropdown selects
- **Card**: Content cards
- **Dialog**: Modal dialogs
- **Popover**: Popover menus
- **Dropdown Menu**: Context menus
- **Tabs**: Tab navigation
- **Accordion**: Collapsible content
- **Badge**: Status badges
- **Toast**: Notification toasts
- **Skeleton**: Loading skeletons
- **Avatar**: User avatars
- **Table**: Data tables

## 🧪 Testing

### Manual Testing Checklist

- [ ] User registration and login
- [ ] Product browsing and search
- [ ] Add to cart and checkout flow
- [ ] Payment processing (test mode)
- [ ] Order status updates
- [ ] Admin product management
- [ ] Admin order management
- [ ] Newsletter subscription
- [ ] Email notifications
- [ ] Mobile responsiveness

## 🚢 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Framework preset: **Next.js** (auto-detected)
   - Deploy

3. **Configure environment variables (Project → Settings → Environment Variables)**
   - `DATABASE_URL` (Postgres) â€” required
   - `NEXTAUTH_SECRET` â€” required
   - `NEXTAUTH_URL` â€” required (set to your Vercel domain, e.g. `https://your-app.vercel.app`)
   - `ADMIN_EMAILS` â€” recommended (comma-separated admin emails, e.g. `fadeessencee@gmail.com`)
   - `APP_URL` or `NEXT_PUBLIC_SITE_URL` â€” recommended (used for sitemap links)
   - `PAYSTACK_PUBLIC_KEY`, `PAYSTACK_SECRET_KEY` â€” required for payments
   - `RESEND_API_KEY` â€” required for email

4. **Database Setup**
   - Create a Postgres database (Vercel Postgres, Neon, Supabase, etc.)
   - Apply migrations: `npx prisma migrate deploy`

5. **Post-deploy production checks**
   - Open `https://<your-domain>/api/health`
   - Confirm response has `"ok": true`
   - If status is `503`, check `missingCritical` and update Vercel environment variables
   - Add this URL to an uptime monitor (UptimeRobot, Better Stack, or similar)

### Other Platforms

The application can be deployed to any platform supporting Next.js:
- **Netlify**: Use Next.js plugin
- **Railway**: Automatic deployment
- **AWS**: Use Amplify or EC2
- **DigitalOcean**: App Platform

## 📝 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Database Commands

- `npx prisma generate` - Generate Prisma Client
- `npx prisma db push` - Push schema changes
- `npx prisma studio` - Open Prisma Studio
- `npx prisma migrate dev` - Create migration
- `npx prisma migrate deploy` - Apply migrations (prod)

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Configured for Next.js
- **Prettier**: Code formatting (if configured)

## 🐛 Troubleshooting

### Common Issues

1. **Prisma Client not found**
   ```bash
   npx prisma generate
   ```

2. **Database connection errors**
   - Verify `DATABASE_URL` is set (must be `postgresql://...`)
   - Run `npx prisma migrate deploy` (prod) or `npx prisma migrate dev` (dev)

3. **Build errors**
   - Clear `.next` folder
   - Run `npm run build` again

4. **Authentication issues**
   - Check `NEXTAUTH_SECRET` is set
   - Verify `NEXTAUTH_URL` matches your domain

## 📄 License

This project is proprietary software. All rights reserved.

## 👥 Support

For support, contact:
- **Email**: fadeessencee@gmail.com
- **Phone**: +234 8160591348
- **Business Hours**: Monday - Saturday, 8:00 AM - 8:00 PM

## 🙏 Acknowledgments

- **Next.js** team for the amazing framework
- **Vercel** for hosting and analytics
- **Radix UI** for accessible components
- **Prisma** for the excellent ORM
- **Paystack** for payment processing
- **Resend** for email delivery

---

**Built with ❤️ for Fádé Essence**


