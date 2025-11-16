## Development Mode

1. Install dependencies
   ```bash
      npm install
   ```

2. RUN DB on docker
   ```bash
      docker compose -f docker-compose.dev.yml up -d
   ````

3. Start app on dev mode
   ```bash
      npm run start:dev
   ````

4. Generate migration file gnerate row sql query
   ```bash
      npm run migration:generate
   ````

5. run migration create table and ralation
   ```bash
      npm run migration:generate
    ````

## Build
1. build app it genrate swager api documentaion
   ```bash
      npm run build
   ````

## API documentaion
1. Accces api documention on http://localhost:4000/api and http://localhost:4000/api-json (for json file)

## Unit testing

1. Test users module controller and service
   ```bash
      npx jest src/users/users.controller.spec.ts
      npx jest src/users/users.service.spec.ts
   ````

2. Test products module controller and service
   ```bash
      npx jest src/products/products.controller.spec.ts
      npx jest src/products/products.service.spec.ts
   ````

3. Test transactions module controller and service
   ```bash
      npx jest src/transactions/products.controller.spec.ts
      npx jest src/transactions/products.service.spec.ts
   ````

## build the app and DB on docker
1. Build and dockerize the app and DB
   ```bash
      docker compose build
   ```

2. RUN app and db
   ```bash
      docker compose up -d
   ```

