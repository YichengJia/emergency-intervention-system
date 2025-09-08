### Stage 1: Build the React application
FROM node:18-alpine AS build
WORKDIR /usr/src/app

# Copy only package metadata and install dependencies
COPY package.json package-lock.json ./
RUN npm install --production && npm cache clean --force

# Copy the rest of the application source
COPY . .

# Build the React frontend
RUN npm run build

### Stage 2: Serve the React application with Nginx
FROM nginx:1.25-alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from previous stage
COPY --from=build /usr/src/app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]