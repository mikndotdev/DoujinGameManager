FROM oven/bun:1 AS build
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build:api

FROM debian:bookworm-slim
WORKDIR /app

COPY --from=build /app/server ./server

EXPOSE 3000

CMD ["./server"]
