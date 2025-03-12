# Bareun Morpheme Analyzer

## Setup

Run with Docker - [Bareun Docs](https://bareun.ai/docs)

```bash
docker pull bareunai/bareun:latest
```

```bash
mkdir -p ~/bareun/var

docker run \
   -d \
   --restart unless-stopped \
   --name bareun \
   --user $UID:$GID \
   -p 5757:5757 \
   -p 9902:9902 \
   -v ~/bareun/var:/bareun/var \
   bareunai/bareun:latest
```
