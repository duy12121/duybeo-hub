#!/bin/bash

echo "🔨 Building frontend for deployment..."

# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

echo "✅ Frontend build complete!"
echo "📁 Build files are in: frontend/dist/"

# Return to root directory
cd ..
