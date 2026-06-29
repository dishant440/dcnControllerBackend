#!/bin/bash

# ==============================================================================
# Siren Project Backend Autostart Script
# This script ensures the system is connected to the designated WiFi SSID before
# starting the backend Docker containers.
# ==============================================================================

# WiFi Configuration
SSID="CZAR_IOT_DEPT"
PASSWORD="12345678"

# Backend Project Configuration
BACKEND_DIR="/home/centralserver/app/dcnControllerBackend/"
HOST_USER="centralserver"

echo "=================================================================="
echo "Siren Project Backend Autostart started at: $(date)"
echo "Target SSID: $SSID"
echo "Backend Dir: $BACKEND_DIR"
echo "=================================================================="

# Check if nmcli is installed
if ! command -v nmcli &> /dev/null; then
    echo "ERROR: nmcli is not installed. NetworkManager is required." >&2
    exit 1
fi

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo "ERROR: docker is not installed. Docker is required." >&2
    exit 1
fi

# 1. Turn on WiFi radio if it is disabled
if ! nmcli radio wifi | grep -q "enabled"; then
    echo "WiFi radio is disabled. Enabling WiFi..."
    nmcli radio wifi on
    sleep 3
fi

# 2. Wait and connect to WiFi
echo "Checking WiFi connection status..."
while true; do
    # Get currently active SSID
    CURRENT_SSID=$(nmcli -t -f active,ssid dev wifi | grep '^yes' | cut -d':' -f2 | head -n1)
    
    if [ "$CURRENT_SSID" = "$SSID" ]; then
        echo "Successfully connected to designated WiFi SSID: '$SSID'"
        break
    fi

    echo "Not connected to target WiFi SSID '$SSID' (Current SSID: '${CURRENT_SSID:-None}')."
    echo "Attempting to connect to '$SSID'..."
    
    # Connect using nmcli
    if nmcli device wifi connect "$SSID" password "$PASSWORD" >/dev/null 2>&1; then
        echo "Connection request sent successfully. Verifying connection in next cycle..."
    else
        echo "Failed to initiate connection. Retrying in 10 seconds..."
    fi
    
    sleep 10
done

# 3. Start Backend Containers
if [ -d "$BACKEND_DIR" ]; then
    echo "Navigating to backend directory: $BACKEND_DIR"
    cd "$BACKEND_DIR" || exit 1
    
    # If run as root (e.g. from systemd), run docker compose as the host user
    if [ "$EUID" -eq 0 ]; then
        echo "Running docker compose as host user: $HOST_USER"
        sudo -u "$HOST_USER" docker compose up -d
    else
        echo "Running docker compose as current user"
        docker compose up -d
    fi
    
    if [ $? -eq 0 ]; then
        echo "Backend containers started successfully."
    else
        echo "ERROR: Failed to start backend containers." >&2
        exit 1
    fi
else
    echo "ERROR: Backend directory '$BACKEND_DIR' does not exist." >&2
    exit 1
fi

echo "Siren Project Backend Autostart completed successfully at: $(date)"
echo "=================================================================="
