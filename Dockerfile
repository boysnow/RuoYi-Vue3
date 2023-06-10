FROM node:16 as builder

RUN mkdir -p /webapp
WORKDIR /webapp
COPY . .
RUN chmod -R 777 ./
ENV GENERATE_SOURCEMAP false
RUN yarn install && yarn build:prod

FROM nginx:alpine
COPY --from=builder /webapp/dist /usr/share/nginx/html
ADD nginx.conf /etc/nginx/nginx.conf
