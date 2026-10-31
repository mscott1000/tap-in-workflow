# Client-attached Cases: implementation handoff

## Requested result and one proposal

All five phase views show Client rows. Client_Detail shows every Case attached to that particular CLIENTROWID, representing its TICWEEK, regardless of CASESTATUS. CASESTATUS remains editable progress information and leads the related Cases list. CASEPHASE is retained physically during transition but is no longer used to route Cases. Do not merge weeks by CLIENTID or filter child Cases to the latest week globally.

**Create Cases** generates all supported cases from the selected Client's ELIGIBLECASES and ELIGIBLENOTES, skips existing case numbers for that CLIENTROWID, and records parsing warnings in RESEARCHNOTES. **Add Case** opens existing Case_Form for manual entry. Prefer Create Cases near Eligible Cases in Client_Detail, separated conceptually from manual Add Case.

Repository changes: generator adapter, combined install source, regression coverage, scope/install/status documentation. New Cases have blank CASEPHASE; the established CASESTATUS default **Ready to Refer** is retained because no replacement default was selected. Neither status nor extraction proves staff review or permission to submit. No submissions are introduced.

User owns AppSheet column organization, sorting, grouping, and backend configuration unless explicitly delegated. No Sheet migration, existing-row clearing, column deletion, app replacement, or unrelated workflow changes are required by this preparation.

## Evidence and limits

- User says nothing has changed since the preceding handoff, the working Sheet is the data/schema source of truth, and AppSheet schema is current.
- Connected read: Cases!A1:AJ1 confirms physical CASEPHASE and CASESTATUS. Validation-only read of Cases!K2:L5 shows current named phase choices and ten existing statuses; it is a bounded sample, not a full-column audit. No operational record values were needed.
- User-provided trim1lo.mov / trim2.mov: Client_Detail includes Related Cases; Case_Form exists. Research Row Selected is Open Client Detail. Other visible row-selection settings differ. These are recording observations, not live browser control or proof that every setting was saved.
- trim3.mov at about 94 seconds: Phase2_Cases uses CASEPHASE = Research plus a latest-TICWEEK condition through CLIENTROWID. Its description still mentions older Phase 2/EpisodeID logic; use the expression, not that stale description, when assessing dependencies.
- trim4.mov: Phase5_Cases filters CASEPHASE to Phase 5. Client-backed slices also exist; the slice named Phase4_Cases under Clients has Source Table Clients. Names alone do not establish source tables.
- trim4.mov at about 76 seconds: hidden Cases action **Set CASEPHASE from CASESTATUS** writes CASEPHASE. Its full expression and callers were not exposed. Do not delete it before finding callers.
- Full Client slice OR conditions, Related Cases expression, inline Case view configuration, generator action/bot, and any security filters were not fully exposed. Their exact text remains a specific inspection gap. No inferred full expression is claimed as observed.
- Uploaded recordings and extracted frames remain local evidence; do not commit them or client information to GitHub.

## User-owned AppSheet checklist

Application: **Google AppSheet editor in a web browser**, app **Tap In Center**, app ID `4f5da70c-4818-4b2d-82cf-3a668bd8276e`.

Verified editor starting URL from the recording:
https://www.appsheet.com/template/appdef?appId=4f5da70c-4818-4b2d-82cf-3a668bd8276e

Expected screen: the editor for Tap In Center. **Views**, **Data**, **Actions**, and the view/slice/action names below were observed in the recording. This is a configuration checklist for the user, not an invented click-by-click walkthrough of unobserved dialogs.

1. Establish each phase view's actual source and full slice condition. Ensure the main phase views use Clients and parent phase membership; remove Case-phase/status contributions only after inspecting complete expressions. Preserve current Client phase calculation. Existing client-backed slices can be reused; do not rebuild layouts or infer source from names.
2. In Client_Detail, scope Related Cases to this CLIENTROWID without CASEPHASE/CASESTATUS restrictions. If CLIENTROWID is confirmed as a Ref to Clients, the canonical related expression is:

   ```appsheet
   REF_ROWS("Cases", "ClientRowID")
   ```

   This is a proposed expression, not a transcription of the current one. Use only after confirming the Ref target and key. An older Client row should display its own week's Cases, not another week's Cases for the same CLIENTID.
3. In the related Cases inline view, put CASESTATUS first, followed by the desired case identifiers. Keep CASESTATUS editable in the existing Case editing flow. Exact inline view name is not established; do not alter PriorCases_ReadOnly_Inline as a substitute for current related Cases.
4. Trace callers of **Set CASEPHASE from CASESTATUS** and any CASEPHASE App formula/Initial value before disconnecting Case-phase writes. Check slices, security filters, bots, form events and other expressions for dependencies. Preserve unrelated Client-phase automation. Do not bulk erase old CASEPHASE values or delete the column.
5. Display the existing generator action as **Create Cases**, retaining its update of CASEGENERATIONREQUESTEDAT to `NOW()` and the existing function parameter `[ClientRowID]`. Reuse its bot; see GENERATOR_INSTALLATION.md for the complete proposed event condition. The current action/bot settings still need inspection. For placement, the recording demonstrates **Position → Inline** and **Attach to column** on another action. Assess those settings for the generator with ELIGIBLECASES as the attachment target; actual placement in Client_Detail still needs preview verification. Do not claim this has been configured.
6. Keep the separate **Add Case** action and existing Case_Form. Prepared target:

   ```appsheet
   LINKTOFORM("Case_Form", "ClientRowID", [ClientRowID], "ClientID", [ClientID])
   ```

   Inspect any existing CASEPHASE defaults or save actions on this manual path too. No new form is required.

Expected result: changing Case Status does not remove a Case from its parent Client detail or move its Client between phases. All current-week Cases remain together under their parent; older weeks remain separate.

## Script installation and test boundary

Google Apps Script in a web browser; existing project **AppSheet Intake**:
https://script.google.com/home/projects/12e-XiMzRPQvbJEZ9Xr24wwnvOPoKcqgO8hyRPCi45iiCoZyfnRvmJYkz/edit

Complete source: integrations/eligible-cases-install.gs. Target editor file: **eligible-cases-install**, alongside existing history functions. Follow GENERATOR_INSTALLATION.md; preserve all other files and legacy workflows/triggers. The user reports no intervening changes, but no independent live source comparison is claimed. Source saves can affect existing consumers immediately. Coordinate the AppSheet dependency changes before running generation; a repository commit does not install anything.

Synthetic verification covers blank new CASEPHASE, retained CASESTATUS, all-case generation, correct links, deduplication, preservation of staff-edited existing status/phase, parser safeguards and history retry behavior. Run npm test, npm run check and git diff --check.

Live acceptance remains unperformed. First identify an explicitly fictional Client/fixture and agree scope. Then verify all generated rows attach to that CLIENTROWID, repeat creates no duplicates, manual Add Case preserves attachment, every status remains visible under the parent, older-week Cases remain isolated, and Case-status changes do not move the parent. No operational record is an approved fixture.

## Final status

- Sheet changes: not required; no live values or validation changed.
- Generator: prepared for testing/review, not installed or run live.
- AppSheet: user-owned changes pending; specific full-expression gaps above remain.
- Live data changed by Codex: no.
- Git shell fetch is unavailable because the configured proxy connection fails. Current main was independently checked through the GitHub connector; preparation uses its exact commit `1703e652bc8cf4a45251a560006f8f5e5271d5de`. Connector publishing can be used for the review branch.
