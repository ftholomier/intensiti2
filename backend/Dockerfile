FROM python:3.11-slim

WORKDIR /app

# System dependencies for Pillow, PyMuPDF, bcrypt
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libffi-dev && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create uploads directory
RUN mkdir -p /app/uploads

EXPOSE 8001

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
