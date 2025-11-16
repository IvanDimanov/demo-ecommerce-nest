import { styleText } from 'node:util';
import { Kysely, sql } from 'kysely';
import { Client } from '@elastic/elasticsearch';

import type { DB } from '../../common/dto/main-database.dto';
import type { ElasticProduct } from '../../common/dto/elasticsearch.dto';
import { envVars } from '../../common/utils/getEnvVars';

const client = new Client({
  node: `http://${envVars.ELASTIC_HOST}:${envVars.ELASTIC_HTTP_PORT}`,
  auth: {
    username: envVars.ELASTIC_USERNAME,
    password: envVars.ELASTIC_PASSWORD,
  },
});

export async function up(db: Kysely<DB>): Promise<void> {
  const products = await db
    .selectFrom('product')

    .leftJoin('productToTag', 'productToTag.productId', 'product.id')
    .leftJoin('tag', 'tag.id', 'productToTag.tagId')
    .select([
      (eb) =>
        eb.fn
          .coalesce(sql`json_arrayagg(tag.name)`, sql`json_array()`)
          .as('tags'),
    ])
    .groupBy('product.id')

    .leftJoin('category', 'product.categoryId', 'category.id')
    .selectAll('category')
    .select((eb) => eb.ref('category.name').as('category'))

    .selectAll('product')
    .execute();

  const elasticProducts = products.map(
    (product) =>
      ({
        id: product.id,
        title: product.title,
        description: product.description,
        category: product.category,
        tags: product.tags,
        price: Number(product.price),
        discountPercentage: Number(product.discountPercentage),
        rating: Number(product.rating),
        stock: product.stock,
        availabilityStatus: product.availabilityStatus,
        brand: product.brand,
        sku: product.sku,
        weight: Number(product.weight),
        warrantyInformation: product.warrantyInformation,
        shippingInformation: product.shippingInformation,
        returnPolicy: product.returnPolicy,
        minimumOrderQuantity: product.minimumOrderQuantity,
        thumbnail: product.thumbnail,
      }) as ElasticProduct,
  );

  await client.bulk({
    index: 'products',
    body: elasticProducts.flatMap((product) => [
      { index: { _id: product.id.toString() } },
      product,
    ]),
  });

  console.log(
    `➕ Successfully added ${styleText('bold', `${elasticProducts.length} products`)} to Elasticsearch index "${styleText('bold', 'products')}"`,
  );

  await client.close();
}

export async function down(db: Kysely<DB>): Promise<void> {
  const products = await db.selectFrom('product').select('id').execute();

  await Promise.all(
    products.map((product) =>
      client.delete({
        index: 'products',
        id: product.id.toString(),
        refresh: 'true',
      }),
    ),
  );

  console.log(
    `➖ Successfully deleted ${styleText('bold', `${products.length} products`)} from Elasticsearch index "${styleText('bold', 'products')}"`,
  );

  await client.close();
}
