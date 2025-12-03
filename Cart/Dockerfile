FROM node:18-alpine

WORKDIR /app

# Install build tools (bcrypt, etc. ke liye)
RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3004

CMD ["npm", "start"]