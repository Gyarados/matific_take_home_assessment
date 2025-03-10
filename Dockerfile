FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY backend .

EXPOSE 8000

RUN chmod +x ./start.sh

ENTRYPOINT [ "./start.sh" ]