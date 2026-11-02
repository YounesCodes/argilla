# The backend remains on the deployed 2.8.0 release. Only its existing status fix
# and the frontend generated from this fork are added; no database upgrade runs.
FROM argilla/argilla-server:v2.8.0
USER root
COPY deploy/devbox/apply_status_fix.py deploy/devbox/test_status_response.py /opt/argilla-status-fix/
RUN /opt/venv/bin/python /opt/argilla-status-fix/apply_status_fix.py \
    && /opt/venv/bin/python /opt/argilla-status-fix/test_status_response.py \
    && rm -rf /opt/venv/lib/python3.13/site-packages/argilla_server/static
COPY argilla-frontend/dist/ /opt/venv/lib/python3.13/site-packages/argilla_server/static/
USER argilla
