# React web client

Minimal registration, login, and authenticated views for the existing NestJS API.
Run from the project root with `npm run web:dev`, then open
`http://localhost:5174`. The API must be running at `http://localhost:3000`;
Vite proxies `/api` requests to the existing NestJS API to avoid browser CORS
issues during local development. The original static prototype remains in
`../../sdu-today/`.
