FROM node:18-alpine

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Copy Teller secrets
COPY .dev/teller/ .dev/.teller/

EXPOSE 7000
CMD ["npm", "run", "dev"]