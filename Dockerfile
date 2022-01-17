FROM node:16

EXPOSE 3000 3001

# work in the docs directory
WORKDIR /docs

# copy everything into the container execept the stuff in .dockerignore
COPY . .

# install packages
RUN npm ci

# fetch repos
RUN npm run update-repos

# build website and admin endpoint
RUN npm run build
RUN npm run build-admin

# run the admin endpoint, the fileserver will be included
ENTRYPOINT ["npm", "run", "start-admin"]


