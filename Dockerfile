FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    APP_ROOT=/app \
    PORT=8080

WORKDIR /app

COPY . /app

RUN chmod +x /app/scripts/container-entrypoint.sh && \
    mkdir -p /app/assets/uploads /app/assets/data /opt/builder-defaults && \
    cp /app/assets/data/site-content.json /opt/builder-defaults/site-content.json

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8080/', timeout=2)" || exit 1

ENTRYPOINT ["/app/scripts/container-entrypoint.sh"]
CMD ["site"]
