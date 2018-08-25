FROM golang:1.10-alpine

RUN apk add --no-cache --virtual .dep git curl && \
    curl -o /go/bin/dep https://github.com/golang/dep/releases/download/v0.5.0/dep-linux-amd64
