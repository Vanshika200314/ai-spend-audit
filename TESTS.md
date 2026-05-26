---

### Step 4: Complete `TESTS.md`
Document your test suite, what it covers, and how to run it.

Open **`TESTS.md`** at the root of your project, paste this content, and save (`Ctrl + S`):

```markdown
# Test Suite Documentation

## Test Scenarios Covered
The test suite validates our pure, mathematical calculation engine (`src/lib/auditEngine.ts`) against the rules requested in the brief:

1. **Cursor Plan Downgrade**: Verifies that teams smaller than 3 on "Cursor Business" are recommended to downgrade to "Cursor Pro" to save $20 per seat.
2. **Claude Team Minimum**: Verifies that Claude Team configurations with fewer than 5 seats are recommended to downgrade to Claude Pro licenses to bypass the $150 minimum.
3. **ChatGPT Team Minimum**: Verifies that 1-seat ChatGPT Team profiles are recommended to switch to ChatGPT Plus.
4. **Copilot Enterprise Downgrade**: Verifies that non-development profiles on Copilot Enterprise are recommended to downgrade to Copilot Business.
5. **Stack Consolidation (Cursor + Copilot)**: Verifies that if both Cursor and Copilot are selected, Copilot is flagged for removal (100% savings) due to Cursor's native autocomplete.

## How to Run Tests
Our testing profile uses your standard `npm test` script.

To run the test suite locally:
```bash
npm test