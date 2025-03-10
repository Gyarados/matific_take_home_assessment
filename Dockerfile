FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY backend .

EXPOSE 8000

# HEALTHCHECK --interval=5s --timeout=2s \
#   CMD curl -f http://localhost:8000/health || exit 

ENTRYPOINT [ "./start.sh" ]