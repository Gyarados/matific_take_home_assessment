FROM python:3.9-slim

RUN apt-get update && apt-get install -y curl

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY backend .

EXPOSE 8000

RUN chmod +x ./start.sh

ENTRYPOINT [ "./start.sh" ]

# HEALTHCHECK --interval=60s --timeout=30s --start-period=5s --retries=3 CMD [ "curl", "-f", "http://localhost:8000/health/" ]