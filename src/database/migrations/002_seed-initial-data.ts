import { Kysely, type InsertObject } from 'kysely';
import type { DB } from '../../common/dto/main-database.dto';

import categories from '../seeds/categories.json';
import tags from '../seeds/tags.json';
import products from '../seeds/products.json';
import productsToTags from '../seeds/productsToTags.json';
import images from '../seeds/images.json';
import reviews from '../seeds/reviews.json';

export async function up(db: Kysely<DB>): Promise<void> {
  const castProducts = products.map((product) => {
    const { availabilityStatus, ...rest } = product;
    return {
      ...rest,
      availabilityStatus: availabilityStatus as
        | 'In Stock'
        | 'Low Stock'
        | 'Out of Stock',
    } as InsertObject<DB, 'product'>;
  });

  const castReviews = reviews.map((review) => {
    const { date, ...rest } = review;
    return {
      ...rest,
      date: new Date(date),
    } as InsertObject<DB, 'review'>;
  });

  await db.insertInto('category').values(categories).execute();
  await db.insertInto('tag').values(tags).execute();
  await db.insertInto('product').values(castProducts).execute();
  await db.insertInto('productToTag').values(productsToTags).execute();
  await db.insertInto('image').values(images).execute();
  await db.insertInto('review').values(castReviews).execute();
}

export async function down(db: Kysely<DB>): Promise<void> {
  await db.deleteFrom('review').execute();
  await db.deleteFrom('image').execute();
  await db.deleteFrom('productToTag').execute();
  await db.deleteFrom('tag').execute();
  await db.deleteFrom('product').execute();
  await db.deleteFrom('category').execute();
}
