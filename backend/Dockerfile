
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
# gcc and python3-dev are often needed for compiling pandas/numpy/scikit extensions
RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    libffi-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install Python deps
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY . .

# Grant execute to bin scripts
RUN chmod +x bin/*.sh || true

EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
