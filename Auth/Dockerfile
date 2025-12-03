FROM node:18-alpine

WORKDIR /app

# Install build tools for bcrypt
RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3001

CMD ["npm", "start"]