FROM node:20-alpine AS build

WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci

COPY frontend ./

ARG REACT_APP_API_URI
ENV REACT_APP_API_URI=${REACT_APP_API_URI}

RUN npm run build

FROM node:20-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=build /app/build ./build

ENV PORT=3800

EXPOSE 3800

CMD ["sh", "-c", "serve -s build -l ${PORT:-3800}"]
