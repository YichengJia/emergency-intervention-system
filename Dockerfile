### Stage 1: Build the React application
FROM node:18-alpine AS build
WORKDIR /usr/src/app

# Copy package.json (package-lock.json is optional)
COPY package*.json ./

# Install ALL dependencies (not just production)
RUN npm install

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