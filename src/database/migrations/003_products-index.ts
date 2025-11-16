import { Client } from '@elastic/elasticsearch';

import { envVars } from '../../common/utils/getEnvVars';

const client = new Client({
  node: `http://${envVars.ELASTIC_HOST}:${envVars.ELASTIC_HTTP_PORT}`,
  auth: {
    username: envVars.ELASTIC_USERNAME,
    password: envVars.ELASTIC_PASSWORD,
  },
});

export async function up(): Promise<void> {
  const index = await client.indices.create({
    index: 'products',
    settings: {
      number_of_shards: 1,
      number_of_replicas: 0,
    },
    mappings: {
      properties: {
        title: {
          type: 'text',
          fields: {
            keyword: {
              type: 'keyword',
              ignore_above: 256,
            },
          },
        },
        description: { type: 'text' },
        category: {
          type: 'keyword',
          fields: {
            analyzed: { type: 'text' },
          },
        },
        tags: {
          type: 'keyword',
          fields: {
            analyzed: { type: 'text' },
          },
        },
        price: { type: 'double' },
        discountPercentage: { type: 'double' },
        rating: { type: 'double' },
        stock: { type: 'double' },
        availabilityStatus: {
          type: 'keyword',
          fields: {
            analyzed: { type: 'text' },
          },
        },
        brand: { type: 'keyword' },
        sku: { type: 'keyword' },
        weight: { type: 'double' },
        warrantyInformation: { type: 'text' },
        shippingInformation: { type: 'text' },
        returnPolicy: { type: 'text' },
        minimumOrderQuantity: { type: 'double' },
        thumbnail: { type: 'keyword' },
      },
    },
  });
  console.log('Newly created index:');
  console.dir(index, { depth: 10 });
  console.log('✨ Index "products" created successfully');

  await client.close();
}

export async function down(): Promise<void> {
  await client.indices.delete({ index: 'products' });
  console.log('🗑️ Index "products" deleted successfully');

  await client.close();
}
