## 2025-02-18 - [Accessible Input and Icon Button]
**Learning:** React's `useId` is an excellent way to programmatically associate generic labels and inputs when an explicit ID is not provided. Additionally, using icon-only buttons as form elements (like a password visibility toggle) without a visually hidden text or an `aria-label` is a frequent accessibility omission in component libraries.
**Action:** Always provide an `id` to associate `<label>` and `<input>`, and ensure icon-only buttons have descriptive `aria-label` or `title` attributes indicating their action.
