FROM python:3.9-slim

RUN groupadd -r appuser && useradd -r -g appuser -d /app appuser

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY backend .

RUN chmod +x ./start.sh

USER appuser

EXPOSE 8000

CMD [ "./start.sh" ]