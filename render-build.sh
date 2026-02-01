#!/bin/bash

echo "🔨 Render Build Script for Zalo Bot Manager"

# Navigate to frontend directory
echo "📦 Installing frontend dependencies..."
cd frontend
npm install

# Build frontend for production
echo "🏗️  Building frontend..."
npm run build

# Verify build exists
if [ -d "dist" ]; then
    echo "✅ Frontend build successful!"
    ls -la dist/
else
    echo "❌ Frontend build failed!"
    exit 1
fi

# Return to root directory
cd ..

echo "🚀 Build complete! Ready for deployment."
