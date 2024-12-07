# Step 1: Use a node image to build the app
FROM node:18-alpine as build-stage

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Build the application for production
RUN npm run build

# Step 2: Use Nginx to serve the built app
FROM nginx:alpine as production-stage

# Copy the build output to Nginx's serving directory
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Expose the port the app will run on
EXPOSE 80

# Start Nginx to serve the app
CMD ["nginx", "-g", "daemon off;"]
