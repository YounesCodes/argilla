# Devbox review image

This image adds the fork's frontend to `argilla/argilla-server:v2.8.0` and preserves the devbox's Elasticsearch status fix. The server source also contains that fix. `apply_status_fix.py` and `test_status_response.py` were recovered unchanged from `/opt/argilla/hotfix` on 2 November 2026. The patch checks the original adapter's checksum, and its regression test runs during the image build.

## Review workflow

Datasets with the four text questions `final_french`, `final_darija_arabic`, `final_darija_latin`, and `final_english` open in a compact translation view. Each card edits the existing answer directly. Saved human answers take precedence over suggestions through Argilla's existing record model. All required judgments remain required. Submit, discard, and draft actions use the existing record operations.

The four current texts appear first, with original fields/context, optional notes, filters, and guidelines available below. Desktop uses two columns; phones use one column. Text size defaults to 20 px and can be changed independently of the UI. The preference is saved in this browser. Standard view restores the original two-pane interface and also has text sizing.

For `e002-doda-assisted-review-v1`, compact review presents one overall decision. Any rejected criterion displays Reject; otherwise any needs_edit displays Needs edit; Accept requires all three accepted. Displaying this aggregate does not change saved answers. Explicitly selecting a decision updates the three existing criteria together, retaining the schema expected by exports. Other datasets and standard view retain the individual criteria.

Short samples and the required judgments fit on the tested 360 × 800 and 390 × 844 viewports at 20 px. Long samples, larger fonts, and an open phone keyboard can require scrolling. Text is never clipped to force a screen fit.

## Build

From `argilla-frontend`, run `npm ci`, then `npx nuxt generate`. From the repository root:

```bash
docker build -f deploy/devbox/Dockerfile -t argilla-server:2.8.0-review-20261102 .
```

The build context needs `deploy/devbox` and `argilla-frontend/dist`. It must not include credentials, dataset exports, or backups.

## Deploy and verify

The live Compose project remains `/opt/argilla`. Keep its existing `.env`, base Compose configuration, worker, and persistent volumes. The deployment script changes only the Argilla image in the existing JSON-formatted `compose.override.yaml` and recreates only that service.

Copy `fingerprint.py` to `/tmp/argilla-ui-fingerprint.py`, `verify.py` to `/tmp/argilla-ui-verify.py`, and the shell scripts onto the devbox. Run `backup.sh` from a file, followed by `deploy.sh IMAGE_TAG`. Do not stream these scripts into a shell's stdin because container commands also read stdin.

Backups remain private under `/opt/argilla/backups/ui-TIMESTAMP`. They include a PostgreSQL custom-format dump, its validated restore inventory, original deployment configuration, and canonical hashes and counts for every database table. The baseline is refreshed immediately before the switch. Verification requires every table's contents and count to match, then checks authenticated status, dataset, schema and progress endpoints. No review submission is used as a health check. On a failed deployment check, the script restores the previous image configuration without restoring or modifying database data.

To roll back later, copy the backup's `override-before-deploy.yaml` over `/opt/argilla/compose.override.yaml`, then run `sudo docker compose up -d --no-deps --pull never --no-build argilla` from `/opt/argilla`. Retain the old image.

## Checks

```bash
cd argilla-frontend
npx jest components/features/annotation/container/view-config/ReviewTextSize.spec.js --runInBand
npx playwright test e2e/annotation-mode-page/translation-review.page.spec.ts --project=chromium --workers=1
```

The browser tests intercept every API request and use synthetic data, including all writes. They cover independent text sizing, four-language visibility, correction submission, required judgments, no horizontal page overflow, and returning to the top for the next record. `BASE_URL` can point at the deployed instance to test its served assets while retaining the mocked API.
