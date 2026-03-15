---
name: feedback_no_turborepo
description: deliveryboy prefers single Next.js app first, no Turborepo monorepo - add mobile later
type: feedback
---

Start with a single Next.js app setup, not Turborepo monorepo. Mobile app (React Native) will be added later as a separate effort.

**Why:** deliveryboy found Turborepo too complex to start with. Wants to focus on getting the web app working first.

**How to apply:** Story 1.1 should initialize a standard Next.js project with Convex, not a Turborepo monorepo. Convex functions live inside the Next.js project (not a separate package). Mobile stories (Epic 11) are deferred. Update architecture references accordingly.
