# Required instruction clarity

Explicit user instruction, recorded 2026-10-30. Applies to all navigation, setup, installation, and configuration instructions for this project.

## Why the distinction matters

“Click Editor on the left” names a control without identifying its application or starting screen. The user has to infer the website, project, interface, and current location. A documentation citation alone does not supply this missing navigation context.

Clear instructions identify the application and its format first, provide the exact verified starting URL, identify the project and expected screen, and only then describe the control and its location. Google Apps Script in a web browser, the AppSheet app builder, and Google Sheets are distinct destinations. A shared or generic control label does not identify which destination is intended.

## Required sequence

1. **Application and format:** name the website/application and whether the instruction concerns a web browser, desktop app, or another interface. Do this before naming a button or field.
2. **Starting URL:** supply the exact verified direct URL. Do not assume an open tab, bookmark, search result, or remembered navigation path. Reuse resource URLs exactly as verified; do not reconstruct opaque project IDs from memory.
3. **Account/project/screen:** identify the intended account when established, exact project/document, and expected destination screen. Do not guess account-specific sign-in screens or controls. Re-establish context whenever changing applications, tabs, or projects.
4. **Control and evidence:** give its exact verified label and location. Each suggested link, button, menu, field, and value needs official documentation, direct observation, or explicit user evidence establishing that it exists in the relevant interface. Do not guess labels, icon meanings, dialog fields, or locations.
5. **Action and value:** state what to click, select, or enter. Supply complete copy/paste content when needed. Do not require the user to infer technical vocabulary or fill unstated gaps.
6. **Expected result:** explain what should appear or change before the next step. Include the save/confirmation step only when its control is verified.

Scale detail to the user's request. When the user asks for exhaustive installation steps, include every transition and prerequisite without compressing them into “open the editor,” “configure the service,” or similarly assumed knowledge. Concision must not remove navigation context.

## Evidence boundaries

- **Repository evidence** can establish a resource URL, ID, or named project; it does not establish the contents of the user's currently open screen.
- **Official documentation** can establish control names, supported values, and documented locations; it does not prove the user's account is signed in or displays the same state.
- **User confirmation** establishes what the user explicitly reported. Do not recast it as independent inspection.
- **Authenticated-screen observation** establishes the specific screen actually inspected. Do not imply such inspection when it was not available.

State these boundaries clearly where they matter. If a necessary control or screen lacks evidence, identify that precise gap instead of inventing a click path. Do not provide installation steps for unsupported features or code that is only a design.

## Durable reminder

The usable instruction pattern is:

**Application and format → verified starting URL → exact project and expected screen → evidenced control and location → action/value → expected result.**

The user must be able to follow it from the stated starting point without supplying missing navigation knowledge.
