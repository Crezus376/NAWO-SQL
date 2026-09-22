FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV NITRO_PRESET=node-server
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/.output ./.output
RUN chmod -R a+rX .output
ENV HOST=0.0.0.0 NODE_ENV=production
USER node
CMD ["node", ".output/server/index.mjs"]
