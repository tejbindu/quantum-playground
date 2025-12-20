FROM ubuntu:22.04

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

WORKDIR /app

# Copy and build frontend
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# Copy and build backend
COPY Cargo.toml Cargo.lock ./
COPY src/ ./src/

RUN cargo build --release

# Expose ports
EXPOSE 3000 5173

# Run the application
CMD ["sh", "-c", "./target/release/quantum-playground & cd frontend && npm run dev -- --host 0.0.0.0 --port 5173 & wait"]
