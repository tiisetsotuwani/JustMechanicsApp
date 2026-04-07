---
name: agent-team-workflow
description: "Use this prompt to coordinate the five team agents and get a structured workflow for building the On-Demand Mechanic App."
---

Use this prompt to orchestrate work across the following roles:
- `project-architect`
- `frontend-engineer`
- `backend-engineer`
- `qa-engineer`
- `devops-engineer`

Workflow:
1. Start with `project-architect` to define the feature scope and decide where the work belongs.
2. Hand off implementation to `frontend-engineer` or `backend-engineer` depending on the layer.
3. Use `qa-engineer` to write tests and verify behavior before merging.
4. Use `devops-engineer` to resolve local setup and environment issues.
5. Repeat the cycle for each feature, keeping the architect involved for cross-layer decisions.

How to use in VS Code:
- Open GitHub Copilot Chat or the AI assistant panel.
- Trigger the appropriate agent by name for the current task.
- When a task spans backend and frontend, start with `project-architect` and then assign work to the relevant engineer agent.
- If a change is blocked by missing tools, switch to `devops-engineer`.
- Always ask `qa-engineer` to add or update tests for any production-facing change.

This prompt helps keep the team focused, reduces confusion, and ensures each role has clear responsibilities.