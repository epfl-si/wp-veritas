FROM ubuntu:focal

ENV METEOR_VERSION=1.10.2

RUN apt -qy update && apt -qy install curl build-essential python3
RUN curl https://install.meteor.com/?release=$METEOR_VERSION | bash -e -x

COPY ./app /usr/src/app/
WORKDIR /usr/src/app/
RUN meteor npm i
RUN BROWSERSLIST_IGNORE_OLD_DATA=1 meteor build --allow-superuser /usr --directory
RUN cd /usr/bundle/programs/server && meteor npm install

FROM ubuntu:focal

COPY --from=0 /usr/bundle /usr/bundle/
WORKDIR /usr/bundle

CMD node main.js
