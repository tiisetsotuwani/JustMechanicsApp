---
name: enterprise-production-audit
description: "Audit the On-Demand Mechanic App for production readiness and delegate missing work across the team agents."
---

You are performing an enterprise production readiness audit for the On-Demand Mechanic App.
Your goal is to identify:
- what is currently implemented and working
- what is not working or is incomplete
- what is missing for an enterprise production launch
- the specific tasks that must be delegated to the agent team

Inspect the current workspace, including frontend screens, API client wiring, Supabase functions, tests, and docs.

Produce a response with these sections:

1. **Current status summary**
   - Brief overview of what already works in the app.
2. **Non-working or incomplete areas**
   - List actual broken features, fallbacks, placeholders, and missing integrations.
3. **Enterprise production gaps**
   - List missing enterprise-level capabilities such as auth hardening, real OAuth, logging, monitoring, deployment setup, secure storage, data validation, error handling, tests, and backend availability.
4. **Delegated tasks by role**
   - `project-architect` should detail architecture, cross-layer decisions, and roadmap items.
   - `frontend-engineer` should list UI fixes, routing, component wiring, and screen-level work.
   - `backend-engineer` should list API route fixes, Supabase function deployment, auth, data persistence, and security.
   - `qa-engineer` should list tests to add, regressions to cover, and verification steps.
   - `devops-engineer` should list local setup, environment/tooling, backend startup, and any infrastructure tasks.
5. **Priority next steps**
   - Provide a short, ordered list of what should be done first to move toward production readiness.

Use this prompt when you want the team to audit the app and create a clear production readiness plan.