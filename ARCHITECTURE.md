---

### Step 3: Complete `ARCHITECTURE.md`
This file contains your technical blueprint, data flow, and **10k audits/day scaling strategy**.

Open **`ARCHITECTURE.md`** at the root of your project, paste this content, and save (`Ctrl + S`):

```markdown
# System Architecture & Scaling

## System Diagram (Mermaid)

```mermaid
graph TD
    User[User Browser] -->|1. Submit Form| AuditAPI[/api/audit]
    User -->|2. Submit Lead| LeadAPI[/api/lead]
    User -->|3. Fetch Async Summary| SummaryAPI[/api/summary]
    User -->|4. View Public Link| ShareRoute[/share/id]

    AuditAPI -->|Write Record| DB[(Neon Postgres DB)]
    LeadAPI -->|Write Lead| DB
    LeadAPI -->|Send Mail| Resend[Resend Email API]
    SummaryAPI -->|Read Inputs| DB
    SummaryAPI -->|Generate Summary| LLM[Anthropic Claude API]
    ShareRoute -->|Fetch public audit only| DB