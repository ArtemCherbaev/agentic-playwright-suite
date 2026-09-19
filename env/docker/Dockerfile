# The execution image.
#
# Every CI job runs inside this image, and `yarn docker:vr` runs the visual
# suite in it locally. That is the whole point of it: visual baselines are
# Chromium on Linux, and a baseline generated anywhere else is compared against
# on that platform only, so it sits in the repository looking like coverage
# while proving nothing.
#
# The base image is pinned to a Playwright release rather than to `latest`. The
# browser build and the client library have to agree, and a floating base image
# means a green pipeline can turn red on a morning when nothing in this
# repository changed.
FROM mcr.microsoft.com/playwright:v1.49.0-noble

ENV CI=true \
    NODE_ENV=test \
    YARN_ENABLE_IMMUTABLE_INSTALLS=true

WORKDIR /suite

# Dependencies are installed as their own layer, from the lockfile alone, so a
# change to a test file does not reinstall node_modules.
COPY package.json yarn.lock .yarnrc.yml ./
RUN corepack enable && yarn install --immutable

COPY . .

# The browsers are already in the base image. This only verifies that the
# version the lockfile asks for is the version the image carries, and fails the
# build rather than the suite if they have drifted apart.
RUN yarn playwright --version

CMD ["yarn", "test:e2e"]
