FROM node:22-alpine

WORKDIR /app

# Get all of the code except `node_modules`
# we gonna install them later
COPY . .
# Should be handled by `.dockerignore` but better to stay on the safe side
RUN rm -rf ./node_modules 

RUN apk add --no-cache bash

# Install `pnpm`
RUN wget -qO- https://get.pnpm.io/install.sh | ENV="$HOME/.bashrc" SHELL="$(which bash)" bash -
ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Installing all `node_modules`
# but this time in respect to the running docker container
RUN pnpm install

# Build Production ready artifacts
RUN pnpm run build

# Run the server in Production mode
CMD ["pnpm", "start:prod"]
