# Contributing

PetQR welcomes fixes, translations, accessibility improvements and animal-specific fields. Use the Issues and Pull requests pages of the repository you obtained this copy from. There is no central account dependency; installation maintainers decide where their contributions go.

1. Fork/clone that repository and create a focused branch.
2. Install Node 22.12+ and run `npm ci`.
3. Keep the architecture static and all runtime assets local. Do not add telemetry, remote APIs, secrets or mandatory hosting dependencies.
4. Run `npm run validate`, `npm run build`, `npm test` and `npm run test:e2e` (install Chromium first as documented).
5. Describe the user-visible problem and behavior, checks run and any compatibility/privacy changes in your PR. For UI work, include desktop/mobile evidence and verify keyboard navigation.

Use fictional examples only. Never attach pet identification numbers, phone numbers, locations or health data from real people to public issues. See SECURITY.md for security reports. Contributions are made under the MIT license. Be respectful and explain decisions plainly.
