# Demo eCommerce NestJS Project

This project was made as a show case for NestJS APIs, MySQL database structure, and Elasticsearch index creation.


## Installation

Prerequisites:
- [Docker](https://www.docker.com/)

__Note:__ That's it - no other dependencies are needed :)


1. Clone the repository
```bash
git clone git@github.com:IvanDimanov/demo-ecommerce-nest.git
cd demo-ecommerce-nest
```

2. Run the project
```bash
docker compose up
```


## System Structure

Once Docker is running, the project will be available at `http://localhost:3000`.
Under the hood, all services are carefully orchestrated in `docker-compose.yml` file.

BackEnd can be tested using Swagger UI at `http://localhost:3000/swagger`.
[![Swagger UI](https://raw.githubusercontent.com/IvanDimanov/demo-ecommerce-nest/master/images/swagger-ui.png)](http://localhost:3000)

Database schema can be viewed in `dbdiagram.io` at [https://dbdiagram.io/d/Demo-eCommerce-NestJS-691a31166735e11170106abb](https://dbdiagram.io/d/Demo-eCommerce-NestJS-691a31166735e11170106abb).
[![Database Schema](https://raw.githubusercontent.com/IvanDimanov/demo-ecommerce-nest/master/images/db-schema.png)](https://dbdiagram.io/d/Demo-eCommerce-NestJS-691a31166735e11170106abb)

Within this project we have:
- DB Migration System (Kysely)
- Several NestJS Modules (for better orchestration)
- SOLID principles applied in Controllers, Services, and Repositories


### Two Steps from Perfection
Code in this repo is aimed to be as "Production Ready" as possible but even the best template is just a step-stone to something bigger.
With that in mind, here are a couple of things we can improve:

1. Elasticsearch runs with the default `elastic` user.
Production ready apps should use a dedicated user with proper permissions.

2. Data is static and comes from `https://dummyjson.com/products`.
Download script is available in `src/database/seeds/download-dummy-data.ts`.

3. We can implement caching for the most requested endpoints.

4. We can handle unexpected API traffic spikes with API rate limits.
