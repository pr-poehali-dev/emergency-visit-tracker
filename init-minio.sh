#!/bin/bash

echo "Waiting for MinIO to start..."
sleep 10

echo "Installing MinIO Client..."
wget -q https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc

echo "Configuring MinIO alias..."
./mc alias set local http://localhost:9000 ${MINIO_ROOT_USER:-minioadmin} ${MINIO_ROOT_PASSWORD:-minioadmin123}

echo "Creating bucket..."
./mc mb local/mchs-tracker 2>/dev/null || echo "Bucket already exists"

echo "Setting public download policy..."
./mc anonymous set download local/mchs-tracker

echo "✅ MinIO initialized successfully!"
echo "📦 Bucket: mchs-tracker"
echo "🌐 Console: http://localhost:9001"
echo "👤 User: ${MINIO_ROOT_USER:-minioadmin}"

# Очистка
rm mc
