#!/bin/bash

# Rollback script for qrgen.jurrejan.com
# Restores a previous build from archive

set -e

# Configuration
SUBDOMAIN="qrgen"
TARGET_DIR="/Volumes/Container/caddy/www/${SUBDOMAIN}.jurrejan.com"
ARCHIVE_BASE_DIR="/Volumes/Container/caddy/www/archive/${SUBDOMAIN}.jurrejan.com"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${YELLOW}Rollback utility for ${SUBDOMAIN}.jurrejan.com${NC}"

# Check if archive directory exists
if [ ! -d "$ARCHIVE_BASE_DIR" ]; then
    echo -e "${RED}Error: No archives found at $ARCHIVE_BASE_DIR${NC}"
    exit 1
fi

# List available archives
echo -e "${BLUE}Available archives:${NC}"
cd "$ARCHIVE_BASE_DIR"
ARCHIVES=($(ls -t))

if [ ${#ARCHIVES[@]} -eq 0 ]; then
    echo -e "${RED}No archives available for rollback${NC}"
    exit 1
fi

# Display archives with numbers
for i in "${!ARCHIVES[@]}"; do
    ARCHIVE_DATE="${ARCHIVES[$i]}"
    # Format the timestamp for display
    if [[ $ARCHIVE_DATE =~ ^([0-9]{4})([0-9]{2})([0-9]{2})_([0-9]{2})([0-9]{2})([0-9]{2})$ ]]; then
        FORMATTED_DATE="${BASH_REMATCH[1]}-${BASH_REMATCH[2]}-${BASH_REMATCH[3]} ${BASH_REMATCH[4]}:${BASH_REMATCH[5]}:${BASH_REMATCH[6]}"
        echo "  $((i+1)). $FORMATTED_DATE (${ARCHIVES[$i]})"
    else
        echo "  $((i+1)). ${ARCHIVES[$i]}"
    fi
done

# Prompt for selection
echo -e "${YELLOW}Enter the number of the archive to restore (or 'q' to quit):${NC}"
read -r selection

# Validate selection
if [ "$selection" = "q" ] || [ "$selection" = "Q" ]; then
    echo -e "${YELLOW}Rollback cancelled${NC}"
    exit 0
fi

if ! [[ "$selection" =~ ^[0-9]+$ ]] || [ "$selection" -lt 1 ] || [ "$selection" -gt "${#ARCHIVES[@]}" ]; then
    echo -e "${RED}Invalid selection${NC}"
    exit 1
fi

# Get selected archive
SELECTED_ARCHIVE="${ARCHIVES[$((selection-1))]}"
SELECTED_PATH="${ARCHIVE_BASE_DIR}/${SELECTED_ARCHIVE}"

echo -e "${YELLOW}Selected archive: ${SELECTED_ARCHIVE}${NC}"
echo -e "${YELLOW}This will replace the current build at ${TARGET_DIR}${NC}"
echo -e "${RED}Are you sure? (yes/no):${NC}"
read -r confirmation

if [ "$confirmation" != "yes" ]; then
    echo -e "${YELLOW}Rollback cancelled${NC}"
    exit 0
fi

# Create backup of current build before rollback
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${ARCHIVE_BASE_DIR}/rollback_backup_${TIMESTAMP}"

if [ -d "$TARGET_DIR" ] && [ "$(ls -A $TARGET_DIR 2>/dev/null)" ]; then
    echo -e "${BLUE}Backing up current build before rollback...${NC}"
    mkdir -p "$BACKUP_DIR"
    rsync -av --exclude='archive' --exclude='.DS_Store' --exclude='._*' "$TARGET_DIR/" "$BACKUP_DIR/"
    echo -e "${GREEN}✓ Current build backed up to: rollback_backup_${TIMESTAMP}${NC}"
fi

# Perform rollback
echo -e "${YELLOW}Rolling back to ${SELECTED_ARCHIVE}...${NC}"
rsync -av --delete --exclude='.DS_Store' --exclude='._*' "$SELECTED_PATH/" "$TARGET_DIR/"

echo -e "${GREEN}✓ Successfully rolled back to ${SELECTED_ARCHIVE}${NC}"
echo -e "${GREEN}✓ Site restored at: https://${SUBDOMAIN}.jurrejan.com${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Run apply script: cd /Volumes/Container/caddy/etc && ./apply_from_mac.sh"
echo -e "  2. Access site at: https://${SUBDOMAIN}.jurrejan.com"