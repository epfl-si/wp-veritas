FROM ubuntu:focal

ENV METEOR_VERSION=3.0-rc.4

RUN apt -qy update && apt -qy install curl build-essential python3 git
RUN curl https://install.meteor.com/?release=$METEOR_VERSION | sh

COPY ./app /usr/src/app/
WORKDIR /usr/src/app/
RUN set -e -x; rm -rf packages/; mkdir packages; cd packages; \
    git clone -b update-to-async https://@github.com/sebastianspiller/meteor-synced-cron

# Compile the API's documentation in a single file
RUN meteor npx apidoc --single -i server/ -o public/api/ -c apidoc.json

RUN meteor npm i
RUN BROWSERSLIST_IGNORE_OLD_DATA=1 meteor build --allow-superuser /usr --directory
RUN cd /usr/bundle/programs/server && meteor npm install

RUN  ln $(find /root/.meteor -name node -type f | grep -v 3.0.0-rc) /usr/local/bin/node

FROM ubuntu:focal

COPY --from=0 /usr/bundle /usr/bundle/
COPY --from=0 /usr/local/bin/node /usr/local/bin/
WORKDIR /usr/bundle

CMD /usr/local/bin/node main.js
