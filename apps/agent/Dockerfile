FROM langchain/langgraphjs-api:20

RUN apt-get update \
    && apt-get install -y procps wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 zstd \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

RUN npx -y patchright-core install-deps chrome

ADD ./src/browser/dom/buildDomTree.js /home/tuankiet/code/personagent/apps/agent/src/browser/dom/buildDomTree.js
ADD package.json /deps/agent/package.json
WORKDIR /deps/agent
RUN npm i --omit=dev
ADD dist dist
ENV LANGSERVE_GRAPHS='{"agent":"./dist/bua/graph.js:graph"}'
# RUN (test ! -f /api/langgraph_api/js/build.mts && echo "Prebuild script not found, skipping") || tsx /api/langgraph_api/js/build.mts