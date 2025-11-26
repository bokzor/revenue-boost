# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Package Manager

This project uses **npm** (package-lock.json present). Use `npm` for all package management commands.

## Essential Development Commands

### Development Server
```bash
# Start Shopify app development (includes build and tunnel)
npm run dev

# Alternative: Start without storefront build
shopify app dev
```

### Build & Compile
```bash
# Build the app for production
npm run build

# Build storefront extensions
npm run build:storefront

# Setup database (generate Prisma client + run migrations)
npm run setup

# Generate Prisma client only
npm run prisma:generate

# TypeScript type checking + generate React Router types
npm run typecheck
```

### Code Quality
```bash
# Run ESLint
npm run lint

# Auto-fix ESLint issues
npm run lint:fix

# View git changes (use --no-pager to avoid pagination)
git --no-pager diff
```

### Testing

#### Unit Tests (Vitest)
```bash
# Run all unit tests
npm run test:run

# Run tests in watch mode
npm run test

# Run tests with UI
npm run test:ui

# Run a single test file
npm run test -- tests/unit/validation.test.ts

# Run a specific test by name pattern
npm run test -- -t "validates newsletter content"
```

#### E2E Tests (Playwright)
```bash
# Run all E2E tests
npm run test:e2e

# Run E2E in headed mode (visible browser)
npm run test:e2e:headed

# Run E2E in debug mode
npm run test:e2e:debug

# Run a specific test file
npm run test:e2e -- tests/e2e/campaign-flow.spec.ts

# Run a specific test by name with grep
npm run test:e2e -- -g "creates a new campaign"
```

### Database (Prisma)
```bash
# Run database migrations (dev)
npx prisma migrate dev

# Deploy migrations (production)
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Open Prisma Studio (database GUI)
npx prisma studio

# Seed the database
npx prisma db seed
```

### Shopify CLI
```bash
# Link to a Shopify app configuration
npm run config:link

# Use a specific app configuration
npm run config:use

# Deploy app to production
npm run deploy

# Generate extensions or other Shopify resources
npm run generate
```

## Project Architecture

### Overview

This is a **Shopify App** built with:
- **React Router 7** (migrated from Remix)
- **Prisma** with PostgreSQL
- **Shopify Polaris** for UI components
- **Domain-Driven Design** architecture
- **Zod** for runtime validation as single source of truth

### Directory Structure

```
revenue-boost/
├── app/
│   ├── domains/              # Domain-driven business logic
│   │   ├── campaigns/        # Campaign CRUD, templates, validation
│   │   ├── templates/        # Template definitions and schemas
│   │   ├── storefront/       # Storefront popup rendering
│   │   ├── targeting/        # Audience targeting rules
│   │   ├── commerce/         # Shopify product/discount integration
│   │   ├── analytics/        # Tracking and metrics
│   │   ├── social-proof/     # Social proof notifications
│   │   └── popups/           # Popup design and preview components
│   ├── routes/               # React Router 7 routes (file-based)
│   ├── lib/                  # Shared utilities
│   ├── shared/               # Shared types and constants
│   ├── config/               # App configuration
│   └── shopify.server.ts     # Shopify API setup
├── extensions/               # Shopify app extensions
│   ├── storefront-popup/     # Theme app extension (popup rendering)
│   └── storefront-src/       # Source code for storefront bundles
├── prisma/
│   └── schema.prisma         # Database schema
├── tests/
│   ├── unit/                 # Vitest unit tests
│   ├── e2e/                  # Playwright E2E tests
│   └── integration/          # Integration tests
└── docs/                     # Architecture documentation
```

### Domain-Driven Architecture

The `app/domains/` directory organizes code by business domain, not technical layer:

- **campaigns/**: Campaign CRUD, forms, validation schemas, and business logic
  - `types/` - Zod schemas and TypeScript types for campaigns
  - `components/` - React components for campaign management UI
  - `utils/` - Domain-specific helpers
  - `config/` - Configuration (goal options, etc.)

- **templates/**: Template definitions with content schemas
  - Each template type (Newsletter, Spin-to-Win, Flash Sale, etc.) has its own Zod schema
  - Templates define what fields are editable and how they validate

- **storefront/**: Client-side rendering logic for popups
  - `popups-new/` - Popup components that render on storefronts
  - Each template has a corresponding popup component

- **Other domains**: Follow similar patterns with types, components, and utilities co-located

### Campaign Management & Template-Driven Validation

#### Key Concepts

1. **Templates** define campaign types (Newsletter, Spin-to-Win, Flash Sale, etc.)
2. **Content Configuration** is template-specific (validated by Zod schemas)
3. **Design Configuration** is universal across all templates (colors, position, size)
4. **Target Rules** define when/where campaigns show (audience, pages, devices)
5. **Discount Configuration** connects to Shopify discounts

#### Data Flow

```
Template Selected
    ↓
Campaign Form (with wizard steps)
    ├─ Design Step: contentConfig (template-specific fields)
    ├─ Design Step: designConfig (universal visual settings)
    ├─ Target Step: targetRules
    └─ Discount Step: discountConfig
    ↓
Saved to Database (Campaign model)
    ├─ templateType: enum (e.g., "SPIN_TO_WIN")
    ├─ contentConfig: JSON (validated by template schema)
    ├─ designConfig: JSON (validated by design schema)
    ├─ targetRules: JSON
    └─ discountConfig: JSON
    ↓
Rendered on Storefront
    └─ PopupRenderer fetches campaign → renders template-specific popup
```

#### Adding a New Template

1. **Define Content Schema** in `app/domains/campaigns/types/campaign.ts`:
   ```typescript
   export const MyTemplateContentSchema = BaseContentConfigSchema.extend({
     customField: z.string().min(1),
     // ... template-specific fields
   });
   ```

2. **Add to Template Type Enum**:
   ```typescript
   export const TemplateTypeSchema = z.enum([
     // ... existing,
     "MY_TEMPLATE"
   ]);
   ```

3. **Create Popup Component** in `app/domains/storefront/popups-new/MyTemplatePopup.tsx`

4. **Create Content Section** in `app/domains/campaigns/components/content-sections/MyTemplateContent.tsx`

5. **Register in Router** at `app/domains/campaigns/utils/step-renderers.tsx`

6. **Seed Template** in `prisma/seed.ts` or template data file

See `ARCHITECTURE_DIAGRAM.md` for visual flow diagram.

### Unified Type System (Zod as Single Source of Truth)

**Key Principle**: Zod schemas define types once; TypeScript types are inferred via `z.infer`.

#### No Field Mapping Between Layers

All layers use identical field names:
- Database (JSON columns)
- API routes (request/response)
- React forms
- Storefront rendering

Example:
```typescript
// Schema definition (single source of truth)
export const NewsletterContentSchema = BaseContentConfigSchema.extend({
  headline: z.string(),
  emailPlaceholder: z.string(),
  submitButtonText: z.string(),
});

// Type inference (automatic)
export type NewsletterContent = z.infer<typeof NewsletterContentSchema>;

// Used everywhere with same field names
const campaign: Campaign = {
  contentConfig: {
    headline: "Join Our Newsletter",  // ✅ Same name
    emailPlaceholder: "...",           // ✅ Same name
    submitButtonText: "Subscribe"      // ✅ Same name
  }
};
```

#### Content vs Design Separation

- **Content Config** (`contentConfig`): What the campaign says (template-specific)
  - Headlines, button text, email placeholders, wheel segments, etc.
  - Defined per template type in `app/domains/campaigns/types/campaign.ts`

- **Design Config** (`designConfig`): How the campaign looks (universal)
  - Colors, fonts, position, size, animations
  - Defined once in `app/domains/storefront/popups-new/types.ts`

This separation ensures:
- Reusable design configurations across templates
- Type-safe content validation per template
- Clear separation of concerns

See `docs/TYPE_SYSTEM_DIAGRAM.md` for detailed flow.

### Storefront Extensions

#### Extensions Present

1. **storefront-popup** (Theme App Extension)
   - Renders popups on merchant storefronts
   - Assets bundled as JavaScript/CSS
   - Configuration in `extensions/storefront-popup/shopify.extension.toml`

2. **storefront-src** (Source code)
   - Contains template-specific popup implementations
   - Built via `npm run build:storefront`
   - Outputs to `extensions/storefront-popup/assets/`
   - **Automatically copies newsletter background images** from `public/newsletter-backgrounds/` during build

#### Communication Flow

```
Merchant Storefront
    ↓ (loads extension)
App Proxy /apps/revenue-boost/api/campaigns/active
    ↓ (fetches active campaigns)
Extension JavaScript
    ↓ (renders popup based on targetRules)
Customer Interaction
    ↓ (form submit, wheel spin, etc.)
POST to App API routes
    ↓ (saves lead, applies discount)
```

### React Router 7 Routing

This app uses **file-based routing** with React Router 7.

#### Route Structure

Routes are defined in `app/routes/` with naming convention:
- `app._index.tsx` → `/app` (protected admin area)
- `app.campaigns._index.tsx` → `/app/campaigns`
- `app.campaigns.new.tsx` → `/app/campaigns/new`
- `app.campaigns.$campaignId.tsx` → `/app/campaigns/:campaignId`
- `app.campaigns.$campaignId_.edit.tsx` → `/app/campaigns/:campaignId/edit`
- `api.campaigns.tsx` → `/api/campaigns` (API endpoint)
- `api.campaigns.$campaignId.tsx` → `/api/campaigns/:campaignId`

#### Loaders and Actions

Each route file exports:
- `loader`: Fetch data (runs on server)
- `action`: Handle form submissions (runs on server)
- `default`: React component to render

Type safety via React Router's `useLoaderData()` and `useActionData()`.

Example:
```typescript
export async function loader({ request, params }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  // ... fetch data
  return json({ campaign });
}

export default function CampaignDetail() {
  const { campaign } = useLoaderData<typeof loader>();
  return <div>{campaign.name}</div>;
}
```

### Database Structure (Prisma)

#### Key Models

- **Campaign**: Core entity with JSON configs
  - `templateType`: Enum (validates which content schema applies)
  - `contentConfig`: JSON (template-specific, validated by Zod)
  - `designConfig`: JSON (universal design settings)
  - `targetRules`: JSON (audience targeting)
  - `discountConfig`: JSON (Shopify discount integration)
  - Relations: belongs to Store, Template, Experiment

- **Template**: Pre-defined campaign templates
  - `templateType`: Enum (Newsletter, Spin-to-Win, etc.)
  - `contentConfig`: JSON (default values)
  - `fields`: JSON (defines customizable fields)
  - `goals`: Array (what goals this template supports)

- **Experiment**: A/B testing campaigns
  - Relations: has many Campaigns (variants)

- **Store**: Shopify store installation
  - Tracks installed shops and access tokens

- **Session**: Shopify OAuth sessions

#### Enums

- `CampaignGoal`: NEWSLETTER_SIGNUP, INCREASE_REVENUE, ENGAGEMENT
- `CampaignStatus`: DRAFT, ACTIVE, PAUSED, ARCHIVED
- `TemplateType`: NEWSLETTER, SPIN_TO_WIN, FLASH_SALE, etc. (11 types)
- `ExperimentStatus`: DRAFT, RUNNING, COMPLETED, STOPPED

## Development Workflows

### Starting Development

1. Install dependencies: `npm install`
2. Set up environment variables (copy from `.env` template)
3. Run database setup: `npm run setup`
4. Start dev server: `npm run dev`
5. Install app on a Shopify development store

### Working with Database

```bash
# After schema changes
npx prisma migrate dev --name describe_your_change

# Generate Prisma client (after pulling schema changes)
npm run prisma:generate

# Reset database (⚠️ destroys data)
npx prisma migrate reset

# View data
npx prisma studio
```

### Working with Campaigns

1. Templates are seeded via `prisma/seed.ts`
2. Create campaign via UI at `/app/campaigns/new`
3. Select template → wizard guides through content/design/targeting
4. Campaign saved with `templateType` + JSON configs
5. Storefront extension fetches active campaigns and renders

### Testing Workflow

**Unit Tests** (prefer for business logic):
```bash
# Watch mode during development
npm run test

# Run before committing
npm run test:run
```

**E2E Tests** (for critical user flows):
```bash
# Ensure dev server is running: npm run dev
# Then in another terminal:
npm run test:e2e
```

## Key Architectural Decisions

### 1. Zod Schemas as Single Source of Truth

**Decision**: Define all validation logic in Zod schemas; infer TypeScript types from them.

**Rationale**: Eliminates drift between runtime validation and compile-time types.

**Evidence**: `app/domains/campaigns/types/campaign.ts` defines all content schemas.

### 2. Content vs Design Configuration Separation

**Decision**: Split campaign configuration into `contentConfig` (what it says) and `designConfig` (how it looks).

**Rationale**:
- Content is template-specific (e.g., wheel segments for Spin-to-Win)
- Design is universal (colors, position work for all templates)
- Enables reusable design themes

**Evidence**: See `ARCHITECTURE_DIAGRAM.md` and `docs/TYPE_SYSTEM_DIAGRAM.md`.

### 3. Template-Driven Content Validation

**Decision**: Each template type has its own Zod content schema.

**Rationale**: Different templates need different fields; validation ensures data integrity.

**Example**:
- Newsletter needs `emailPlaceholder`
- Spin-to-Win needs `wheelSegments`
- Flash Sale needs `urgencyMessage`

**Evidence**: `app/domains/campaigns/types/campaign.ts` has 11 template content schemas.

### 4. Domain-Driven Directory Structure

**Decision**: Organize by business domain (`campaigns/`, `templates/`, `storefront/`) instead of technical layer.

**Rationale**: Co-locates related code; easier to reason about features; follows DDD principles.

**Evidence**: `app/domains/` structure with types, components, and utils per domain.

### 5. No Field Name Mapping Between Layers

**Decision**: Use identical field names from database → API → UI → storefront.

**Rationale**: Reduces bugs from translation errors; simplifies maintenance.

**Example**: `headline` is always `headline`, never `title` or `mainHeading`.

**Evidence**: `docs/TYPE_SYSTEM_DIAGRAM.md` explicitly documents this decision.

### 6. Single Source of Truth for Background Images

**Decision**: Store all newsletter background images in `public/newsletter-backgrounds/` and automatically copy them to the storefront extension during build.

**Rationale**:
- Eliminates manual duplication and risk of drift
- Ensures consistency between admin preview and storefront rendering
- Simplifies maintenance (add/update/remove in one place)

**Implementation**:
- Source: `public/newsletter-backgrounds/` (10 PNG images)
- Build script (`scripts/build-storefront.js`) automatically copies images to `extensions/storefront-popup/assets/newsletter-backgrounds/`
- Extension assets are excluded from git (via `.gitignore`)
- Admin serves images via App Proxy routes
- Storefront serves images via Shopify CDN

**Evidence**: See `docs/BACKGROUND_IMAGES.md` for complete documentation.

## Testing Guidelines

### Unit Tests (Vitest)

- **Location**: `tests/unit/`
- **Run**: `npm run test` (watch) or `npm run test:run` (CI)
- **Environment**: `happy-dom` (lightweight DOM)
- **Focus**: Domain logic, validation schemas, utility functions

### E2E Tests (Playwright)

- **Location**: `tests/e2e/`
- **Run**: `npm run test:e2e` (requires dev server running)
- **Config**: `playwright.config.ts`
- **Settings**:
  - Base URL: `http://localhost:56687` (or `SHOPIFY_APP_URL`)
  - Retries: 2 on CI, 0 locally
  - Trace: on first retry
  - Video: retain on failure

**Important**: Start the app server before running E2E tests:
```bash
# Terminal 1
npm run dev

# Terminal 2
npm run test:e2e
```

### Coverage

```bash
# Run unit tests with coverage
npm run test:run -- --coverage
```

## Helpful Documentation References

- **Architecture Overview**: `ARCHITECTURE_DIAGRAM.md`
- **Type System Details**: `docs/TYPE_SYSTEM_DIAGRAM.md`
- **Quick Start for Contributors**: `QUICK_START_GUIDE.md`
- **Auggie Agent Guide**: `AUGGIE_AGENT_GUIDE.md` (autonomous task execution)
- **Shopify App React Router**: https://shopify.dev/docs/api/shopify-app-react-router
- **React Router 7**: https://reactrouter.com/home

## Special Notes

### Git Diff Viewing

Per repository conventions, use `git --no-pager diff` to avoid pagination when viewing changes.

### Shopify CLI Integration

This app uses Shopify CLI for development tunneling and deployment. The CLI manages:
- OAuth and session tokens
- Tunneling (via Cloudflare or ngrok)
- Extension deployment
- App configuration sync

### Environment Variables

Required variables (see `.env` for full list):
- `SHOPIFY_API_KEY`: From Partner Dashboard
- `SHOPIFY_API_SECRET`: From Partner Dashboard
- `DATABASE_URL`: PostgreSQL connection string
- `SHOPIFY_APP_URL`: Public app URL (managed by CLI in dev)

Do not commit `.env` or expose secrets in code.
