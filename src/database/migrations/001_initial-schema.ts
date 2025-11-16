import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('category')
    .addColumn('id', 'integer', (col) =>
      col.notNull().autoIncrement().primaryKey(),
    )
    .addColumn('name', 'varchar(36)', (col) => col.notNull())
    .execute();

  await db.schema
    .createTable('tag')
    .addColumn('id', 'integer', (col) =>
      col.notNull().autoIncrement().primaryKey(),
    )
    .addColumn('name', 'varchar(36)', (col) => col.notNull())
    .execute();

  await db.schema
    .createTable('product')
    .addColumn('id', 'integer', (col) =>
      col.notNull().autoIncrement().primaryKey(),
    )
    .addColumn('title', 'varchar(256)', (col) => col.notNull())
    .addColumn('description', 'text', (col) => col.notNull())
    .addColumn('categoryId', 'integer', (col) =>
      col.references('category.id').onDelete('set null'),
    )
    .addColumn('price', 'decimal(14, 4)', (col) => col.notNull())
    .addCheckConstraint('check_product_price', sql`price > 0.0001`)
    .addColumn('discountPercentage', 'decimal(5, 2)')
    .addCheckConstraint(
      'check_product_discountPercentage',
      sql`discountPercentage BETWEEN 0.01 AND 100`,
    )
    .addColumn('rating', 'decimal(3, 2)', (col) => col.notNull())
    .addCheckConstraint('check_product_rating', sql`rating BETWEEN 0 AND 5`)
    .addColumn('stock', 'integer', (col) => col.notNull())
    .addCheckConstraint('check_product_stock', sql`stock > 0`)
    .addColumn('brand', 'varchar(256)', (col) =>
      col.defaultTo('(unknown brand)').notNull(),
    )
    .addColumn('sku', 'varchar(256)', (col) => col.notNull())
    .addColumn('weight', 'decimal(14, 4)', (col) => col.notNull())
    .addCheckConstraint('check_product_weight', sql`weight > 0.0001`)
    .addColumn('dimensions', 'json', (col) => col.notNull())
    .addColumn('warrantyInformation', 'varchar(256)', (col) => col.notNull())
    .addColumn('shippingInformation', 'varchar(256)', (col) => col.notNull())
    .addColumn(
      'availabilityStatus',
      sql`enum('In Stock', 'Low Stock', 'Out of Stock')`,
      (col) => col.defaultTo('Out of Stock').notNull(),
    )
    .addColumn('returnPolicy', 'varchar(256)', (col) => col.notNull())
    .addColumn('minimumOrderQuantity', 'integer', (col) => col.notNull())
    .addCheckConstraint(
      'check_product_minimumOrderQuantity',
      sql`minimumOrderQuantity > 0`,
    )
    .addColumn('meta', 'json', (col) => col.notNull())
    .addColumn('thumbnail', 'varchar(256)', (col) => col.notNull())
    .execute();

  await db.schema
    .createTable('productToTag')
    .addColumn('productId', 'integer', (col) =>
      col.references('product.id').onDelete('cascade').notNull(),
    )
    .addColumn('tagId', 'integer', (col) =>
      col.references('tag.id').onDelete('cascade').notNull(),
    )
    .addPrimaryKeyConstraint('primary_key_constraint_productToTag', [
      'productId',
      'tagId',
    ])
    .execute();

  await db.schema
    .createTable('image')
    .addColumn('id', 'integer', (col) =>
      col.notNull().autoIncrement().primaryKey(),
    )
    .addColumn('url', 'varchar(512)', (col) => col.notNull())
    .addColumn('productId', 'integer', (col) =>
      col.references('product.id').onDelete('cascade').notNull(),
    )
    .execute();

  await db.schema
    .createTable('review')
    .addColumn('id', 'integer', (col) =>
      col.notNull().autoIncrement().primaryKey(),
    )
    .addColumn('productId', 'integer', (col) =>
      col.references('product.id').onDelete('cascade').notNull(),
    )
    .addColumn('rating', 'decimal(3, 2)', (col) => col.notNull())
    .addCheckConstraint('check_review_rating', sql`rating BETWEEN 0 AND 5`)
    .addColumn('comment', 'text', (col) => col.notNull())
    .addColumn('reviewerName', 'varchar(36)', (col) => col.notNull())
    .addColumn('reviewerEmail', 'varchar(128)', (col) => col.notNull())
    .addColumn('date', 'timestamp', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull(),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('review').ifExists().execute();
  await db.schema.dropTable('image').ifExists().execute();
  await db.schema.dropTable('productToTag').ifExists().execute();
  await db.schema.dropTable('tag').ifExists().execute();
  await db.schema.dropTable('product').ifExists().execute();
  await db.schema.dropTable('category').ifExists().execute();
}
