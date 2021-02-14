# Dockerfile for ConfeBot

# The first stage installs npm prod dependencies and copies them for later use.
# Then, installs devDependencies and compiles the TypeScript source.

FROM node:lts-buster AS build
RUN mkdir /home/node/app/ && chown -R node:node /home/node/app
WORKDIR /home/node/app

COPY --chown=node:node package*.json ./
USER node
RUN npm install --loglevel info --only=production
RUN cp -r node_modules node_modules_prod
RUN npm install --loglevel info
COPY --chown=node:node . .
RUN npm run build

# The second stage of the build copies node_modules_prod and the built JS from the first stage.
# Here, the `lts-buster-slim` image is used since things like GCC and development headers are not needed for production.
FROM node:lts-buster-slim
WORKDIR /home/node/app

COPY --chown=node:node package*.json ./
USER node

# Copy node_modules and dist from the first stage
COPY --from=build --chown=node:node /home/node/app/node_modules_prod ./node_modules
COPY --from=build --chown=node:node /home/node/app/dist ./dist

# Run the application
CMD npm start
