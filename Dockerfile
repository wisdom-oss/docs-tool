FROM debian

EXPOSE 3000

# work in the docs directory
WORKDIR /docs

# copy everything into the container execept the stuff in .dockerignore
COPY . .

# update packages
RUN apt upgrade
RUN apt update

# adding necessary keys for caddy
RUN apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
RUN curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
RUN curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
RUN apt update

# install binaries
RUN apt install -y caddy nodejs procps

# install pnpm and docusaurus
RUN npm install -g pnpm docusaurus

# install packges
RUN pnpm install --frozen-lockfile
RUN cd docusaurus && pnpm install --frozen-lockfile

# start the application
ENTRYPOINT ["npm", "start"]
