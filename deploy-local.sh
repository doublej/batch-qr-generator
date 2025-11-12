#!/bin/bash

# Local deployment script for qrgen.jurrejan.com
# Deploys to mounted Caddy volume

set -e

# Configuration
SUBDOMAIN="qrgen"
TARGET_DIR="/Volumes/Container/caddy/www/${SUBDOMAIN}.jurrejan.com"
LOCAL_BUILD_DIR="dist"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Starting local deployment to ${SUBDOMAIN}.jurrejan.com...${NC}"

# Check if target directory is accessible
if [ ! -d "/Volumes/Container/caddy/www" ]; then
    echo -e "${RED}Error: Caddy volume not mounted at /Volumes/Container/caddy/www${NC}"
    echo -e "${RED}Please ensure the container volume is mounted before running this script.${NC}"
    exit 1
fi

# Build the application
echo -e "${YELLOW}Building application...${NC}"
npm run build

# Create target directory if it doesn't exist
echo -e "${YELLOW}Creating target directory...${NC}"
mkdir -p "$TARGET_DIR"

# Copy build files
echo -e "${YELLOW}Copying files to $TARGET_DIR...${NC}"
rsync -av --delete --exclude='.DS_Store' --exclude='._*' "$LOCAL_BUILD_DIR/" "$TARGET_DIR/"

# Copy Caddyfile to target directory
echo -e "${YELLOW}Copying Caddyfile...${NC}"
cp ${SUBDOMAIN}.caddy "$TARGET_DIR/"

# Verify deployment
if [ -f "$TARGET_DIR/index.html" ]; then
    echo -e "${GREEN}✓ Files copied successfully!${NC}"
    echo -e "${GREEN}✓ Deployment completed to: $TARGET_DIR${NC}"
    echo -e "${GREEN}✓ Your app should be available at https://${SUBDOMAIN}.jurrejan.com${NC}"

    echo -e "${YELLOW}Deployed files:${NC}"
    ls -la "$TARGET_DIR"
else
    echo -e "${RED}✗ Deployment failed - index.html not found in target directory${NC}"
    exit 1
fi
