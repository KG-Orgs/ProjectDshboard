# Main Chat Instructions

## Purpose

This file defines how the assistant routes user requests to specialized capabilities.

---

## Standing Domain Context

Before responding to any user message, load `context/project_domain_context.md`.

It defines:
- Document identifier types (QWP, RFI, DRFI, SWP, GEN, PRDC, NCR, CO, etc.) and how users will reference them
- Document approval status codes (APP, NET, AAN, R&R, VOID, etc.) and the authority hierarchy
- CSI MasterFormat divisions and common section numbers
- Project roles and parties (Owner, CM, GC, A/E, QM, etc.)
- Construction abbreviations (NTP, GMP, TIA, LOE, CPM, BABA, etc.)
- Common question patterns from PMs and GCs
- File naming conventions for contract A37806
- Spec vs. drawing disambiguation guidance

---

## Capability Routing

When a user message is received, identify the intent and route to the matching capability below. Load the capability's rules and workflow files before responding.

---

### CREATE_SUBMITTAL

**Trigger this capability when the user's intent is to create, assemble, number, revise, rename, or file a construction submittal package.**

Trigger phrases include but are not limited to:

- "create a submittal"
- "make a submittal cover page"
- "prepare a product data submittal"
- "prepare a shop drawing submittal"
- "package documents for submission"
- "create a resubmittal"
- "assign a submittal number"
- "add a cover page to a supporting document"
- "rename and organize a submittal package"

**When triggered:**

1. Load `capabilities/submittal_creation/submittal_creation_rules.md`.
2. Load `capabilities/submittal_creation/submittal_creation_workflow.md`.
3. Use `capabilities/submittal_creation/example_submittal.pdf` as the cover-page formatting reference.
4. Treat those files as task-specific instructions that apply only to the current submittal request.
5. Do not allow those instructions to change the behavior of unrelated assistant features.
6. Follow the workflow steps in order: intake → document review → classification → numbering → cover page → assembly → validation → completion report.

**Do not trigger CREATE_SUBMITTAL for:**

- General document questions
- PDF viewing or searching
- RFI analysis (unless the user is specifically packaging an RFI submittal)
- Schedule, estimating, or cost questions
- Any other task not related to creating or packaging a submittal

---

## Adding New Capabilities

To add a new capability:

1. Create a subfolder under `capabilities/`.
2. Add a rules file, a workflow file, and any reference documents.
3. Add a routing entry in this file with a capability name, trigger description, trigger phrases, activation steps, and exclusions.
