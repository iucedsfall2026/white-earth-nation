# White Earth Nation: economic evidence site

Live site: https://iucedsfall2026.github.io/white-earth-nation/

Part of the IU DSIP Fall 2026 CEDS project. The main dashboard covering both Nations is at https://iucedsfall2026.github.io/.

## Where to edit

| What | File |
|---|---|
| SWOT items, history, background sources | `content/nation.json` |
| Team, instructors, sponsor, contact email | `config/site.json` |
| Site name and navigation labels | `assets/js/site-config.js` |
| Colors and fonts | `assets/css/theme.css` |
| Data (do not edit by hand) | `data/` — regenerate with `scripts/export_site_data.py` in ceds-pipeline |

## Preview locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.
