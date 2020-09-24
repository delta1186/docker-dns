FROM mhart/alpine-node

ENV NODE_ENV=production
EXPOSE 53/udp

ADD package.json /tmp/package.json

RUN cd /tmp && npm install
COPY index.js /usr/src/
COPY util.js /usr/src/
COPY config.json /etc/docker-dns/

RUN ln -sf /tmp/node_modules /usr/src/node_modules
RUN ln -sf /tmp/package.json /usr/src/package.json

# Run
CMD [ "node", "/usr/src/index.js" ]
