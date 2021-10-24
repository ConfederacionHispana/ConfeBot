# Dockerfile for ConfeBot

# The first stage installs npm prod dependencies and copies them for later use.
# Then, installs devDependencies and compiles the TypeScript source.
FROM node:16-alpine3.14 AS build
RUN mkdir /home/node/app/ && chown -R node:node /home/node/app
WORKDIR /home/node/app

# Copy package.json
COPY --chown=node:node package*.json ./

# Install prod dependencies
USER node
RUN npm set-script prepare ""
RUN npm ci --loglevel info --only=production

# Copy prod dependencies for later use and install dev dependencies
RUN cp -r node_modules node_modules_prod
RUN npm ci --loglevel info

# Copy root directory
COPY --chown=node:node . .

# Build TypeScript
RUN npm run build

# The second stage of the build copies node_modules_prod and the built JS from the first stage.
FROM node:16-alpine3.14
WORKDIR /home/node/app

COPY --chown=node:node package*.json ./
USER node

# Copy node_modules and dist from the first stage
COPY --from=build --chown=node:node /home/node/app/node_modules_prod ./node_modules
COPY --from=build --chown=node:node /home/node/app/dist ./dist

# Run the application
ENTRYPOINT ["npm", "start"]
