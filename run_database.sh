#!/bin/bash

docker compose build
docker compose up -d

### for changes ###
# docker-compose up --build --force-recreate -d

# removing docker images
# docker rmi $(docker images -a -q)

# removing non contenirezed images
# docker image prune --all