**Feature Request: Implement Licensing Tiers and Feature Overrides**

**Objective:**
Modify the platform to support different commercial license tiers ('Golazo', 'Gran Jugada', 'La Copa del Mundo') assignable to Tenants. Additionally, allow Super Admins to **individually enable or disable specific features** for a Tenant, overriding the base tier, potentially with an expiration date.

**Detailed Requirements:**

1.  **Database Schema Changes (`packages/db/prisma/schema.prisma`):**
    * Introduce a new Enum `LicenseTier` with values: `GOLAZO`, `GRAN_JUGADA`, `COPA_DEL_MUNDO`.
    * Add a **required** field `licenseTier` of type `LicenseTier` to the `Tenant` model, with a default value (e.g., `GOLAZO`).
    * Introduce a new Enum `Feature` listing all granularly controllable features (e.g., `TRIVIA`, `REWARDS_CHALLENGES`, `NOTIFICATIONS_ADVANCED`, `ANALYTICS_ADVANCED`, `PUSH_NOTIFICATIONS`, etc.).
    * Create a new model `TenantFeatureOverride` with fields:
        * `id` (String, cuid)
        * `tenantId` (String, relation to Tenant, onDelete: Cascade)
        * `feature` (Feature)
        * `isEnabled` (Boolean)
        * `expiresAt` (DateTime, optional)
        * `createdAt`, `updatedAt`
        * Add `@@unique([tenantId, feature])` and `@@index([tenantId])`.
    * Add the inverse relation `featureOverrides TenantFeatureOverride[]` to the `Tenant` model.
    * Update database migrations accordingly (`prisma migrate dev`).

2.  **Feature Definitions:**
    Clearly map which `Feature` enums correspond to the functionalities included in each `LicenseTier`.
    * **Golazo:** Base features (no specific `Feature` enums needed unless you want explicit control).
    * **Gran Jugada:** Golazo + `TRIVIA`, `REWARDS_CHALLENGES`, `NOTIFICATIONS_INTERMEDIATE`.
    * **La Copa del Mundo:** Gran Jugada + `ANALYTICS_ADVANCED`, `NOTIFICATIONS_ADVANCED`.
    * *(Identify other features like `PUSH_NOTIFICATIONS` and assign them appropriately or leave them as individually controllable).*

3.  **Backend Enforcement (`packages/api`):**
    * **Authorization Logic:** Create a reusable function or service (e.g., `featureGuard.isFeatureEnabled(tenantId: string, feature: Feature): boolean`). This function must implement the following logic:
        1.  Query `TenantFeatureOverride` for an active (not expired) override for the given `tenantId` and `feature`.
        2.  If an active override exists, return its `isEnabled` value.
        3.  If no active override exists, query the `Tenant`'s `licenseTier`.
        4.  Determine if the requested `feature` is included in the `licenseTier` based on the mapping defined in step 2. Return `true` if included, `false` otherwise.
    * **Middleware/Service Integration:** Use the `featureGuard` function in tRPC middleware or service layers to protect access to feature-specific procedures.
        * Example: A `requireFeature` middleware taking a `Feature` enum as an argument.
        * Apply this protection to relevant endpoints (trivia creation, advanced analytics viewing, sending advanced/push notifications, etc.).

4.  **Super Admin Interface (`apps/admin` - Super Admin Section):**
    * **Tenant Management:**
        * Allow Super Admins to view and modify the base `licenseTier` for each `Tenant`.
        * Provide an interface (e.g., a table or list within the Tenant edit page) for Super Admins to manage `TenantFeatureOverride` entries for that tenant:
            * Add new overrides (select feature, set `isEnabled`, optionally set `expiresAt`).
            * Edit existing overrides (change `isEnabled`, `expiresAt`).
            * Delete overrides (to revert to tier-based logic).
    * Update relevant forms and views in `/superadmin/tenants/...`.

5.  **Tenant Admin Interface (`apps/admin` - Tenant Admin Section):**
    * **Conditional UI:** Fetch the effective status of relevant features (using logic similar to the backend `featureGuard`) for the current tenant.
    * Conditionally hide or disable UI elements (buttons, menu items, sections) corresponding to features that are effectively disabled (either by tier or by an active override).
    * Example: Hide "Trivia Management" if `featureGuard.isFeatureEnabled(currentTenantId, Feature.TRIVIA)` returns `false`.

6.  **Seed Data (`packages/db/src/seed.ts`):**
    * Ensure tenants in seed data have a default `licenseTier` assigned. Optionally, add seed examples for `TenantFeatureOverride`.

**Acceptance Criteria:**

* A Super Admin can assign a base `LicenseTier` to any Tenant.
* A Super Admin can create/edit/delete specific feature overrides (`TenantFeatureOverride`) for any Tenant, setting enabled/disabled status and optional expiration.
* The backend correctly checks for active overrides first, then falls back to the base `licenseTier` to determine feature access.
* Tenants are restricted from API endpoints for features disabled by either method.
* UI elements in the Tenant Admin dashboard are conditionally shown/hidden based on the *effective* feature status (considering overrides).
* Temporary overrides (`expiresAt`) automatically cease to function after the expiration date.
* Remember/take into consideration the internationalization implementation we have with 'next-intl' and make sure not to hardcode any text. Use or create the necessary translations keys in:
apps/admin/
├── messages/
├── es-MX.json # Spanish translations
└── en-US.json # English translations

**Out of Scope (For this request):**
* Detailed implementation of the features themselves (focus is on access control).
* Billing/payment integration.
