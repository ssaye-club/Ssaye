# Ssaye Club — E2E Test Plan

---

## 1. Authentication & User Accounts

1.1 Register a new user with valid name/email/password → redirected to login, success toast shown
1.2 Register with duplicate email → error: "Email already in use"
1.3 Register with weak or invalid password → validation error before submission
1.4 Log in with correct credentials → navbar shows username, protected routes accessible
1.5 Log in with wrong password → error message shown, no token stored
1.6 Log out → cart persists in localStorage, navbar reverts to guest state
1.7 Premium user logs in → gold ★ visible beside username in top-right
1.8 Non-premium user logs in → no gold ★ shown
1.9 Page refresh while logged in → session restored, user remains authenticated
1.10 Access /my-orders as guest → redirected to login
1.11 Admin user logs in → Admin dashboard tab appears in navbar

---

## 2. Vendor Authentication

2.1 Visit /vendor/register with no token → locked "Invite Only" screen shown
2.2 Visit /vendor/register?invite=INVALID → locked screen, invalid token error
2.3 Visit /vendor/register with an expired invite token → locked screen, expired token error (72h expiry enforced)
2.4 Super admin generates invite link → visit that link → full registration form visible
2.5 Complete vendor registration via valid invite → redirect to vendor login, account created
2.6 Vendor login with correct credentials → vendor dashboard loads, vendor_token stored in localStorage
2.7 Vendor login with wrong credentials → error message, no dashboard access
2.8 Regular user tries to access vendor dashboard URL → redirected or blocked
2.9 After vendor login, verify localStorage has vendor_token and vendor_info (not the regular user token)

---

## 3. Super Admin Dashboard

3.1 Log in as super admin → "Super Admin Dashboard" tab appears in navbar
3.2 View all users list → paginated user list loads with name, email, role, status
3.3 Grant premium to a user → user row shows premium badge; user sees ★ on next login
3.4 Remove premium from a user → premium badge disappears; ★ gone on next login
3.5 Disable a user account → that user gets "Account disabled" error on next login attempt
3.6 Re-enable a disabled account → login works again for that user
3.7 Promote user to admin → that user sees Admin tab after re-login
3.8 Demote admin back to regular user → Admin tab gone after re-login
3.9 Generate vendor invite link → link copied to clipboard, link is functional
3.10 Approve a vendor registration → vendor status changes to "approved"
3.11 Suspend a vendor → vendor is blocked from accessing their dashboard
3.12 Issue coupon to a premium user (% off, expiry days) → success message with generated PREM-XXXXXX code shown
3.13 Issue coupon to a non-premium user → error: user is not premium
3.14 View all issued coupons → full coupon list loads with code, recipient, status, expiry
3.15 Verify a vendor govt certificate → govtCert status changes to "verified"
3.16 Reject a vendor govt cert with admin note → status changes to "rejected", note visible to vendor
3.17 Verify a product badge cert (Organic/Halal/Fresh) → badge appears on that product in the public marketplace
3.18 Reject a product badge cert → badge no longer shown on marketplace product card
3.19 Change order status Pending → In Transit → Delivered → customer sees updated stepper in My Orders on refresh
3.20 Mark order as Cancelled → customer sees red "Cancelled" pill, no stepper shown
3.21 Mark order as Refunded → customer sees purple "Refunded" pill

---

## 4. Vendor Dashboard

4.1 Vendor logs in → products tab loads with their products listed
4.2 Add a new product (all fields + image) → product appears in vendor list and in public marketplace
4.3 Edit an existing product → changes saved and reflected in marketplace
4.4 Toggle product listed off (hide) → product disappears from public marketplace
4.5 Toggle product listed on (show) → product reappears in marketplace
4.6 Delete a product → removed from vendor list and marketplace
4.7 Upload valid CSV catalogue → preview rows shown → confirm → products appear in marketplace
4.8 Upload CSV with some invalid rows → partial success, valid rows imported, error rows listed by line number
4.9 Upload CSV with wrong column format → full error shown, no products added
4.10 Add pricing rule (min qty, max qty, date range) → rule saved in pricingRules array
4.11 Add pricing rule with no end date → rule persists without expiry field
4.12 Submit govt certificate (regulatory body, licence number, document) → status changes to "pending_review"
4.13 Submit product badge cert (e.g. Organic) → badge pill shows pending status
4.14 Super admin verifies cert → vendor refreshes dashboard → badge pill shows verified
4.15 Super admin rejects cert → vendor refreshes dashboard → rejection note visible in cert panel

---

## 5. Marketplace & Cart

5.1 Browse marketplace as guest → products load with correct categories and counts
5.2 Search for a product by exact name → matching results shown
5.3 Search with a slight typo → fuzzy suggestion or results still appear
5.4 Filter by category → only that category's products shown
5.5 Sort by price ascending → products ordered cheapest first
5.6 Sort by price descending → products ordered most expensive first
5.7 Navigate pages in paginated list → correct products per page, page number updates
5.8 Add to cart as guest (not logged in) → login prompt modal appears
5.9 Add a product to cart while logged in → quantity stepper appears on card, toolbar count increments
5.10 Add multiple different products → cart subtitle shows "X products · Y units" correctly
5.11 Increase quantity of a cart item → subtotal increases, unit count updates
5.12 Decrease cart item quantity to 0 → item automatically removed from cart
5.13 Remove individual item via remove button → item gone, product and unit counts update correctly
5.14 Clear all items from cart → empty cart state shown, "0 products · 0 units" in subtitle
5.15 Navigate back to marketplace after clearing cart → no ghost quantities on product cards
5.16 Refresh page with items in cart → cart state restored from ssaye_cart in localStorage
5.17 Verified badge cert product → Organic/Halal/Fresh badge visible on product card
5.18 Unverified cert product → no badge shown publicly

---

## 6. Checkout

6.1 Checkout with items in cart → order confirmed screen shows order number and total
6.2 Order confirmed screen → "Track Order" button is visible
6.3 Click "Track Order" on confirmed screen → navigates to /my-orders
6.4 Checkout with no items in cart → checkout button disabled or error shown, no order created

---

## 7. Premium Discounts & Coupons

7.1 Premium user, cart total under $50 → "Add $X more to unlock 10% discount" hint shown
7.2 Premium user, cart total at or above $50 → "⭐ Premium discount (10%)" row shown, total correct
7.3 Non-premium user, cart total over $50 → no premium discount row shown at all
7.4 Apply a valid coupon issued to this user → discount row appears, total recalculates correctly
7.5 Apply a coupon issued to a different user → error: "not issued to your account"
7.6 Apply an expired coupon → error: "Coupon has expired"
7.7 Apply an already-used coupon → error: "Coupon has already been used"
7.8 Apply coupon and premium discount simultaneously → both discount rows shown, total deducted correctly
7.9 Remove applied coupon from cart → total reverts to pre-coupon amount, coupon row disappears
7.10 Complete checkout with coupon applied → coupon marked as used in DB, rejected as "already used" on second attempt
7.11 Order confirmed screen with active discounts → "Saved $X" badge visible with correct amount
7.12 Tamper coupon code in checkout request body → server rejects, order not discounted (coupon ownership re-validated server-side)

---

## 8. Order Tracking (My Orders)

8.1 Logged-in user with no orders visits /my-orders → empty state message shown, no error
8.2 Logged-in user with orders visits /my-orders → order list loads, newest first
8.3 Order with status "pending" → stepper Step 1 highlighted, Steps 2 & 3 grey
8.4 Order with status "in-transit" → Step 1 green checkmark, Step 2 highlighted, Step 3 grey
8.5 Order with status "delivered" → all 3 stepper steps show green checkmarks
8.6 Order with status "cancelled" → no stepper shown, red "Cancelled" status pill
8.7 Order with status "refunded" → purple "Refunded" status pill shown
8.8 Expand order card to view items → products listed with name, qty, and line total
8.9 Order with premium + coupon discount → "Saved $X" badge visible, both discount lines shown
8.10 Super admin updates order status → customer refreshes page → new status reflected
8.11 Order with no line items (edge case) → does not crash, shows 0 items gracefully

---

## 9. Product Detail Page

9.1 Navigate to a valid /product/:id → product name, brand, price, category, and image all load
9.2 Navigate to an invalid product ID → error state shown with back/home button, no crash
9.3 Add to cart from product detail page → cart toolbar count increments correctly
9.4 Buy Now from product detail → order placed directly, confirmed screen shown
9.5 Subscribe & Save option selected → 10% subscription discount shown in modal
9.6 Product with no image → emoji fallback shown, no broken image icon
9.7 Out-of-stock product → "Out of Stock" label shown, add-to-cart button disabled
9.8 Low-stock product → "Low" stock indicator shown
9.9 Product with rating data → aggregate rating and star display rendered correctly
9.10 Nutritional grade badge → displays correctly when nutritional data is available

---

## 10. Chatbot / CRM Bot

10.1 Open chatbot widget → chat window opens without error
10.2 Send a product-related query → response returned from Gemini
10.3 Send gibberish or nonsense input → graceful fallback response, no crash
10.4 Send a stock alert query → bot surfaces relevant stock status information
10.5 Close and reopen chatbot in the same session → conversation history preserved

---

## 11. SEO & Meta Tags

11.1 View page source of / (home) → title "Ssaye Club — Invest, Live & Grow" and correct description meta present
11.2 View page source of /marketplace → grocery-focused description meta and JSON-LD Store schema present
11.3 View page source of /product/:id → title includes product name and brand; Product JSON-LD with price and availability
11.4 Visit /robots.txt → admin/vendor/orders routes disallowed, sitemap URL listed
11.5 Visit /sitemap.xml → all public URLs present with correct priority values
11.6 OG tags on /marketplace → og:title, og:description, og:image all populated
11.7 In-stock product JSON-LD → availability maps to schema.org/InStock
11.8 Low-stock product JSON-LD → availability maps to schema.org/LimitedAvailability
11.9 Out-of-stock product JSON-LD → availability maps to schema.org/OutOfStock
11.10 Navigate between pages in-app → page title updates correctly on each route, no stale title from previous page

---

## 12. Cross-cutting & Edge Cases

12.1 Two tabs open — cart change in one tab → other tab picks up change on next interaction or reload
12.2 Network goes offline during checkout → error message shown, cart preserved, no duplicate order created
12.3 Cart with 20+ different products → no performance degradation, UI renders correctly
12.4 Mobile viewport (375px wide) → navbar collapses to hamburger, all pages usable
12.5 Large image upload for a product → handled gracefully with size limit error or success
12.6 Certificate document accessible to super admin → base64 document viewable/downloadable in cert review panel
12.7 Vendor with zero products views dashboard → empty state shown, no JS error
12.8 Admin and vendor sessions open in different browsers simultaneously → no session cross-contamination
12.9 JWT expiry mid-session → user prompted to re-login, no silent 401 failures
12.10 Blog, Assets, Smart City, Farms pages → each loads with correct per-page title and meta description

---

Total: 136 test cases across 12 suites
Recommended tooling: Playwright or Cypress for browser-based tests, Jest + Supertest for API-only tests
Start with: Sections 5 (Marketplace & Cart) and 7 (Premium & Coupons) — highest business logic density and regression risk
