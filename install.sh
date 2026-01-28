#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Installing agent-notify...${NC}"

# Check if macOS
if [[ "$(uname)" != "Darwin" ]]; then
  echo -e "${RED}Error: agent-notify only supports macOS${NC}"
  exit 1
fi

# Detect architecture
ARCH=$(uname -m)
if [[ "$ARCH" == "arm64" ]]; then
  BINARY="agent-notify-arm64"
elif [[ "$ARCH" == "x86_64" ]]; then
  BINARY="agent-notify-x64"
else
  echo -e "${RED}Error: Unsupported architecture: $ARCH${NC}"
  exit 1
fi

# GitHub repo
REPO="cfngc4594/agent-notify"
LATEST_URL="https://github.com/${REPO}/releases/latest/download/${BINARY}"

# Install location
INSTALL_DIR="${HOME}/.local/bin"
INSTALL_PATH="${INSTALL_DIR}/agent-notify"

# Create directory if needed
mkdir -p "$INSTALL_DIR"

# Download
echo -e "Downloading ${YELLOW}${BINARY}${NC}..."
if ! curl -fsSL "$LATEST_URL" -o "$INSTALL_PATH"; then
  echo -e "${RED}Error: Failed to download binary${NC}"
  exit 1
fi

# Make executable
chmod +x "$INSTALL_PATH"

echo -e "${GREEN}✓ Installed to ${INSTALL_PATH}${NC}"

# Check if in PATH
if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
  echo ""
  echo -e "${YELLOW}Note: $INSTALL_DIR is not in your PATH${NC}"
  echo "Add this to your ~/.zshrc or ~/.bashrc:"
  echo ""
  echo -e "  ${GREEN}export PATH=\"\$HOME/.local/bin:\$PATH\"${NC}"
  echo ""
fi

echo ""
echo -e "Run ${GREEN}agent-notify${NC} to get started!"
