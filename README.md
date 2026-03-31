# OpenEvents

A white-label event management and ticketing platform built with Next.js, TypeScript, and deployed on [Eyevinn Open Source Cloud (OSC)](https://www.osaas.io/). Originally built for [Streaming Tech Sweden 2026](https://www.streamingtech.se/), now designed for single-tenant per-instance deployment.

## Features

### White-Label Customization
- Full platform branding: name, logo, favicon, brand color
- Customizable homepage hero text, hero image, and event layout (showcase, grid, or carousel)
- Editable legal pages: Terms of Service, Privacy Policy, About, and Contact
- Footer customization with tagline and custom links
- Light/dark theme toggle
- All settings managed from the admin dashboard — no code changes needed

### Event Management
- Create, edit, and publish events with rich details
- Cover images and media uploads
- Event visibility controls (public/private)
- Event status workflow (draft, published, cancelled, completed)
- Per-event timezone support for correct date display

### Ticketing & Sales
- Multiple ticket types with individual pricing and capacity
- Discount codes (percentage, fixed amount, free tickets)
- Per-order ticket cap on discount codes
- Group discounts with minimum cart quantity thresholds
- Invoice payment option for B2B customers
- Ticket reservation system during checkout
- Real-time availability tracking
- Optional allergy/dietary requirement collection per event

### Speakers & Agenda
- Speaker profiles with photos, bios, and social links
- Drag-and-drop speaker ordering
- Agenda/schedule builder with time slots
- Speaker assignment to agenda items

### Payments
- Stripe integration for online payments
- Invoice billing for corporate customers
- Automated refund processing
- VAT handling (25% included)
- Runtime URL resolution for payment callbacks (OSC-compatible)

### Attendee Management
- PDF tickets with QR codes
- QR code scanner for event check-in
- Attendee export to CSV/Excel
- Per-ticket attendee information

### Organizer Dashboard
- Sales statistics and revenue tracking
- 30-day sales trend charts
- Order management with filtering and search
- Bulk order actions and CSV export
- Ticket type and discount code management

### Admin Panel
- Platform-wide statistics
- Platform branding and customization
- Legal and contact page editor
- User management with role assignment
- Create accounts with one-time passwords
- Event overview across all organizers

### Authentication
- Organizer login with email/password
- Role-based access control (Organizer, Super Admin)
- Guest checkout for attendees (no account required)

## Tech Stack

- **Frontend**: Next.js 14+ with App Router, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (on OSC)
- **Cache**: Valkey/Redis (on OSC)
- **Storage**: MinIO/S3 (on OSC)
- **Authentication**: NextAuth.js
- **Payments**: Stripe
- **Deployment**: Eyevinn Open Source Cloud

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- Access to OSC services (or local PostgreSQL, Redis, MinIO)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Eyevinn/openevents.git
   cd openevents
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Generate Prisma client and run migrations:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

5. Seed the database (optional):
   ```bash
   npm run db:seed
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000)

### Demo Accounts (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@openevents.local | Admin123! |
| Organizer | organizer@openevents.local | Organizer123! |

## Project Structure

```
openevents/
├── prisma/                    # Database schema and migrations
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # Organizer authentication
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── forgot-password/
│   │   │   └── reset-password/
│   │   ├── (public)/          # Public pages
│   │   │   ├── events/        # Event listing and details
│   │   │   │   └── [slug]/
│   │   │   │       └── checkout/
│   │   │   └── orders/        # Order confirmation
│   │   ├── (dashboard)/       # Organizer & admin dashboard
│   │   │   └── dashboard/
│   │   │       ├── events/    # Event management
│   │   │       │   ├── new/
│   │   │       │   └── [id]/
│   │   │       │       ├── edit/
│   │   │       │       ├── orders/
│   │   │       │       ├── tickets/
│   │   │       │       ├── discounts/
│   │   │       │       └── scan/
│   │   │       ├── admin/     # Super admin panel
│   │   │       │   ├── users/
│   │   │       │   ├── customization/  # White-label settings
│   │   │       │   └── legal/ # Legal & contact pages
│   │   │       ├── profile/
│   │   │       ├── settings/
│   │   │       └── scan/      # Quick ticket scanner
│   │   └── api/               # API routes
│   │       ├── auth/
│   │       ├── events/
│   │       │   └── [id]/
│   │       │       ├── speakers/
│   │       │       ├── agenda/
│   │       │       ├── ticket-types/
│   │       │       └── discount-codes/
│   │       ├── orders/
│   │       │   └── [id]/
│   │       │       ├── pay/
│   │       │       ├── capture/
│   │       │       ├── refund/
│   │       │       └── mark-paid/
│   │       ├── dashboard/
│   │       ├── admin/
│   │       ├── platform/      # Branding & image APIs
│   │       ├── webhooks/
│   │       └── upload/
│   ├── components/            # React components
│   │   ├── ui/                # Base UI components
│   │   ├── auth/              # Authentication
│   │   ├── events/            # Event display & editing
│   │   ├── tickets/           # Checkout & tickets
│   │   ├── dashboard/         # Dashboard widgets
│   │   ├── admin/             # Admin components
│   │   └── layout/            # Layout components
│   ├── lib/                   # Shared libraries
│   │   ├── auth/              # Authentication utilities
│   │   ├── db/                # Prisma client
│   │   ├── email/             # Email service
│   │   ├── storage/           # S3/MinIO utilities
│   │   ├── payments/          # Stripe integration
│   │   ├── analytics/         # Dashboard analytics
│   │   ├── platform-settings.ts  # White-label config
│   │   ├── legal-content.ts   # Legal page content
│   │   ├── url.ts             # Runtime URL resolution
│   │   └── validations/       # Zod schemas
│   └── types/                 # TypeScript types
├── docs/                      # Documentation
└── public/                    # Static assets
```

## Development

### Database Commands

```bash
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run migrations (dev)
npm run db:push        # Push schema changes
npm run db:seed        # Seed database
npm run db:studio      # Open Prisma Studio
npm run db:reset       # Reset database
```

### Running Tests

```bash
npm test               # Run all tests
npm run test:watch     # Run tests in watch mode
```

### Linting

```bash
npm run lint
```

## Documentation

- [Architecture](./ARCHITECTURE.md) - System design and infrastructure
- [Contributing](./CONTRIBUTING.md) - How to contribute
- [Setup Guide](./docs/SETUP.md) - Detailed setup instructions
- [Email Setup](./docs/SETUP_EMAIL.md) - Email configuration
- [Storage Setup](./docs/SETUP_STORAGE.md) - MinIO/S3 configuration

## Deployment

This project is deployed on [Eyevinn Open Source Cloud (OSC)](https://www.osaas.io/) at [events.apps.osaas.io](https://events.apps.osaas.io).

### Option 1: Contribute to the Existing Deployment

To contribute features or fixes to the live site at events.apps.osaas.io:

1. Fork or clone [github.com/Eyevinn/openevents](https://github.com/Eyevinn/openevents)
2. Set up your local development environment (see [Quick Start](#quick-start))
3. Make your changes following the guidelines in [CONTRIBUTING.md](./CONTRIBUTING.md)
4. Submit a pull request to `main`

**Note:** Merged changes will only appear on the live site after someone with access to the OpenEvents OSC account restarts the application.

### Option 2: Deploy Your Own Instance

To deploy a separate OpenEvents instance on your own OSC account:

1. Fork the repository to your GitHub account
2. Ensure your AI coding assistant (Claude Code, Cursor, etc.) is connected to GitHub and [OSC via MCP](https://www.npmjs.com/package/@osaas/mcp)
3. Ask your assistant: *"Set up OpenEvents on my OSC from my fork"*

The assistant will provision the required OSC services (PostgreSQL, Valkey, MinIO, Web Runner) and configure the environment.

To deploy changes pushed to your fork's `main` branch, restart your Web Runner instance through OSC.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for details on OSC service configuration.

## Known Limitations & Recommendations

### Email Delivery

The email integration is fully functional, but **emails sent through OSC's default mail service will not be delivered**. Email providers like Gmail and Outlook block messages from `@users.osaas.io` addresses.

**Recommendation:** Configure a third-party email service (SendGrid, Postmark, AWS SES, etc.) via the environment variables in `.env`. See [Email Setup](./docs/SETUP_EMAIL.md) for configuration details.

### Guest Checkout Only

Ticket buyers do not create accounts on the platform. This is a deliberate design choice to minimize purchase friction.

**Recommendation:** For production use, ensure working email delivery so buyers can receive their tickets and order confirmations.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](./LICENSE) for details.
