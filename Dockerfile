FROM oven/bun:1 AS base
WORKDIR /app

COPY . .

RUN bun i
RUN bun run build

FROM nginx:alpine
WORKDIR /usr/share/nginx/html

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=base /app/dist .
COPY --from=base /app/games ./games

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]