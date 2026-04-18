# --- Build Stage ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
# Use --legacy-peer-deps for React 19 / Expo 54 compatibility if needed
RUN npm install
COPY . .
# Build the web version of the Expo app
RUN npx expo export --platform web

# --- Run Stage ---
FROM nginx:stable-alpine
# Expo export outputs to 'dist' folder by default
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
