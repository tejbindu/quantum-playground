#!/bin/bash

# Try building without network first
docker build --network=none -t quantum-playground . || \
# If that fails, try with host network
docker build --network=host -t quantum-playground . || \
# If that fails, try default network
docker build -t quantum-playground .

# Run the container in detached mode with host networking
docker run -d --network=host --name quantum-playground-container quantum-playground
