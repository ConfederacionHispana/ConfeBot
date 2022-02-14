# ================ #
#    Base Stage    #
# ================ #

FROM node:16-alpine3.15 as base

WORKDIR /home/node/app

ENV HUSKY=0
ENV CI=true
ENV NODE_ENV="development"

RUN apk add -u --no-cache \
    dumb-init \
		fontconfig \
		jq \
		nodejs

COPY --chown=node:node yarn.lock .
COPY --chown=node:node package.json .
COPY --chown=node:node .yarnrc.yml .
COPY --chown=node:node .yarn/ .yarn/

RUN sed -i 's/"prepare": "husky install"/"prepare": ""/' ./package.json

ENTRYPOINT ["dumb-init", "--"]

# =================== #
#  Development Stage  #
# =================== #
FROM base as development

ENV NODE_ENV="development"

RUN apk add -u --no-cache \
	g++ \
	make \
	python3

COPY --chown=node:node tsconfig*.json .
COPY --chown=node:node src/ src/

RUN yarn install --immutable

CMD [ "yarn", "run", "dev"]

# ================ #
#   Builder Stage  #
# ================ #

FROM development as builder

ENV NODE_ENV="development"

COPY --chown=node:node tsconfig*.json .
COPY --chown=node:node src/ src/

RUN yarn run build

# ================ #
#   Runner Stage   #
# ================ #

FROM base AS runner

ENV NODE_ENV="production"
ENV NODE_OPTIONS="--enable-source-maps --max_old_space_size=4096"

WORKDIR /home/node/app

COPY --chown=node:node --from=BUILDER /home/node/app/dist dist

RUN yarn workspaces focus --all --production
RUN chown node:node /home/node/app/

USER node

ARG BUILD_NUMBER=1
ENV BUILD_NUMBER=${BUILD_NUMBER}
RUN contents="$(jq ".version += \".${BUILD_NUMBER}\"" package.json)" && echo "${contents}" > package.json

CMD [ "yarn", "run", "start"]
