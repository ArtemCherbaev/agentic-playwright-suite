# The execution image: the operating system, the browsers and node_modules.
#
# It carries the environment and nothing else. CI checks out the commit under
# test and points at this image's node_modules, and `docker compose` mounts the
# working tree over /suite, so the code a job runs is always the code in front
# of it rather than whatever was copied in when the image was last built.
#
# The Playwright version is not written here. The image job reads it from
# package.json and passes it in, so the base image and the client library
# cannot drift apart: the browser build a baseline was captured with is the one
# the library drives. A drift would change text rendering and quietly
# invalidate every visual baseline.
ARG PLAYWRIGHT_VERSION
FROM mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble

ARG PLAYWRIGHT_VERSION

# Corepack keeps the Yarn it downloads under COREPACK_HOME. Container jobs run
# with a different HOME than the build did, so the location is fixed here or
# every job would download Yarn again.
ENV CI=true \
    NODE_ENV=test \
    COREPACK_HOME=/opt/corepack \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    YARN_ENABLE_IMMUTABLE_INSTALLS=true

# git, so a job running inside the image can commit (the baseline workflow does).
RUN apt-get update \
    && apt-get install -y --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /suite

COPY package.json yarn.lock .yarnrc.yml ./
RUN corepack enable && yarn install --immutable

# Fail the build rather than the suite if the lockfile and the base image
# disagree about the Playwright release.
RUN installed="$(node -p "require('@playwright/test/package.json').version")" \
    && if [ "$installed" != "$PLAYWRIGHT_VERSION" ]; then \
         echo "lockfile resolves @playwright/test $installed, image is v$PLAYWRIGHT_VERSION" >&2; exit 1; \
       fi
