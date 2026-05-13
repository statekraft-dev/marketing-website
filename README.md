# Statekraft Marketing Website

Webflow marketing website integration for Statekraft — includes the user subscription and registration flow (Okta auth, Airwallex/Stripe payments) and page-routing scripts with GSAP animations, targeting DEV, UAT, and Production environments.

## Overview

This repository contains two JavaScript bundles designed to be embedded in a Webflow-hosted marketing site. Together they handle:

- **Page animations and interactions** — scroll-triggered reveals, parallax images, carousels, and smooth scrolling across all marketing pages.
- **Subscription and registration flow** — a multi-step signup wizard covering authentication, personal details collection, payment, and success confirmation.

## Files

| File | Purpose |
|---|---|
| `integration.js` | Page router, GSAP/ScrollTrigger animations, Swiper carousels, Lenis smooth scroll, and per-page custom element registration. Also bootstraps the subscription flow on relevant routes. |
| `flow-integration.js` | Full subscription flow bundle — environment config, Okta Sign-In Widget setup, multi-step form logic, Stripe/Airwallex payment handling, API service layer, and UI state management. |
| `datadog-init.js` | Datadog RUM async loader and init — goes in Webflow's **Head Code** (not site-wide custom code). Auto-detects environment from hostname and attributes sessions to the Okta sub via `DD_RUM.setUser` once auth resolves in `flow-integration.js`. |

## Pages and Routes

| Route | Behaviour |
|---|---|
| `/` (Home) | Hero animations, value proposition carousel, feature parallax, pricing toggle (monthly/annual), role carousel, review slider |
| `/subscribe` | Multi-step signup wizard (plan selection, Okta auth, personal details, payment) |
| `/verify` | Email verification handling |
| `/callback` | OAuth redirect handler (Okta authorization code / interaction code exchange) |
| `/payment-callback` | Stripe/Airwallex payment confirmation, retry on failure |
| `/success` | Post-registration success page with plan feature summary |
| All other paths | Standard marketing pages with GSAP animations and Swiper carousels |

## Subscription Flow

The signup process follows four steps:

1. **Plan Selection** — Choose a subscription tier and billing cycle (monthly/annual).
2. **Authentication** — Create an account or sign in via the Okta Sign-In Widget (supports email/password, Google, and Microsoft SSO).
3. **Personal Details** — Name, phone, address, business info (ABN), job role, optional discount code, and terms/privacy consent.
4. **Payment** — Stripe Checkout session (or Airwallex depending on environment). Free-trial codes (e.g. `FREEFIRSTMONTH`) skip the payment step.

State is persisted to `localStorage`/`sessionStorage` so users can resume an interrupted signup.

## External Services

| Service | Usage |
|---|---|
| **Okta** | Authentication — Sign-In Widget v7.14.0 with PKCE, Google and Microsoft IdP, custom password policy, silent auth for returning sessions |
| **Stripe** | Payment processing (checkout sessions) |
| **Airwallex** | Alternative payment processing (demo env for DEV/UAT, prod for Production) |
| **Statekraft BFF API** | Backend-for-frontend — subscription initiation, personal details, role types, payment confirmation, discount codes, session management |
| **GSAP + ScrollTrigger** | Scroll-driven animations and timeline scrubbing |
| **Lenis** | Smooth scroll engine integrated with GSAP ticker |
| **Swiper** | Touch-friendly carousels for pricing cards, reviews, and value propositions |
| **AOS** | Auxiliary reveal-on-scroll animations |
| **Datadog RUM** | Real User Monitoring — page performance, errors, and Session Replay. AP2 region, `service: statekraft-marketing`. Shares the RUM application with the Next.js app so cross-surface user journeys join on the Okta sub. |

## Environments

The app supports three environments, selected automatically by hostname or overridden with a `?env=` query parameter:

| Environment | Hostname | API Base | Airwallex Env |
|---|---|---|---|
| **DEV** | Manual (`?env=dev`) | `bff.dev.statekraft.ai` | `demo` |
| **UAT** | `*.webflow.io` | `bff.uat.statekraft.ai` | `demo` |
| **PRODUCTION** | `statekraft.ai` | `bff.prod.statekraft.ai` | `prod` |

## Usage

The scripts are included via Webflow's Custom Code settings:

1. Paste `datadog-init.js` into **Site Settings → Custom Code → Head Code**, wrapped in `<script>...</script>` tags. This must load before the other two scripts so RUM captures their errors and the full page lifecycle.
2. Add `flow-integration.js` to the site-wide custom code (handles auth/payment flow on subscribe pages).
3. Add `integration.js` to the site-wide custom code (handles page routing, animations, and bootstrapping the subscription flow).
4. Ensure the following external dependencies are loaded before these scripts:
   - jQuery
   - GSAP + ScrollTrigger
   - Lenis
   - Swiper
   - AOS
