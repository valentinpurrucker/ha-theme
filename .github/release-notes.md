Install **Still Cards** through HACS → Custom repositories. Add `https://github.com/valentinpurrucker/ha-theme` and select **Dashboard**, then download Still Cards and refresh Home Assistant.

`still-cards.js` is the HACS installation asset. HACS manages the dashboard resource in storage mode. For YAML resource mode, add `/hacsfiles/ha-theme/still-cards.js` as a JavaScript module. Remove an old `/local/still-cards.js` resource if switching from a manual install.

The cards inherit your Home Assistant theme. The optional **Still** light/dark theme is attached as `still.yaml`; copy it into your `themes/` directory and reload themes. A Dashboard repository does not install theme YAML automatically.

The `.tar.gz` archive is for manual installation and includes the theme, example dashboard, documentation, licenses, and checksums.
