/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import fs from 'node:fs';
import { fetch, type Response } from 'undici';

const DUMMY_DATA_URL = 'https://dummyjson.com/products?limit=100';
const CATEGORIES_FILE = 'categories.json';
const TAGS_FILE = 'tags.json';
const REVIEWS_FILE = 'reviews.json';
const IMAGES_FILE = 'images.json';
const PRODUCTS_TO_TAGS_FILE = 'productsToTags.json';
const PRODUCTS_FILE = 'products.json';

type Dimensions = {
  width: number;
  height: number;
  depth: number;
};

type Review = {
  rating: number;
  comment: string;
  date: string;
  reviewerName: string;
  reviewerEmail: string;
};

type Meta = {
  createdAt: string;
  updatedAt: string;
  barcode: string;
  qrCode: string;
};

type Product = {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  tags: string[];
  brand: string;
  sku: string;
  weight: number;
  dimensions: Dimensions;
  warrantyInformation: string;
  shippingInformation: string;
  availabilityStatus: string;
  reviews: Review[];
  returnPolicy: string;
  minimumOrderQuantity: number;
  meta: Meta;
  images: string[];
  thumbnail: string;
};

type ExportedCategory = {
  id: number;
  name: string;
};

type ExportedTag = {
  id: number;
  name: string;
};

type ExportedReview = Review & {
  id: number;
  productId: number;
};

type ExportedImage = {
  id: number;
  url: string;
  productId: number;
};

type ExportedProduct = {
  id: number;
  title: string;
  description: string;
  categoryId: number;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  brand: string;
  sku: string;
  weight: number;
  warrantyInformation: string;
  shippingInformation: string;
  availabilityStatus: string;
  returnPolicy: string;
  minimumOrderQuantity: number;
  thumbnail: string;
  dimensions: string;
  meta: string;
};

async function getDummyData(): Promise<Product[]> {
  try {
    console.log('Fetching dummy data...');
    const response: Response = await fetch(DUMMY_DATA_URL);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch dummy data: ${response.status} ${response.statusText}`,
      );
    }
    const data = (await response.json()) as { products: Product[] };
    return data.products;
  } catch (error) {
    console.error('Error fetching dummy data', error);
    throw error;
  }
}

async function exportCategories(
  products: Product[],
): Promise<ExportedCategory[]> {
  const categories: ExportedCategory[] = [];
  for (const product of products) {
    if (!categories.some((category) => category.name === product.category)) {
      categories.push({
        id: categories.length + 1,
        name: product.category,
      });
    }
  }
  await fs.promises.writeFile(
    CATEGORIES_FILE,
    JSON.stringify(categories, null, 2),
  );
  return categories;
}

async function exportTags(products: Product[]): Promise<ExportedTag[]> {
  const tags: ExportedTag[] = [];
  for (const product of products) {
    for (const tag of product.tags) {
      if (!tags.some((t) => t.name === tag)) {
        tags.push({
          id: tags.length + 1,
          name: tag,
        });
      }
    }
  }
  await fs.promises.writeFile(TAGS_FILE, JSON.stringify(tags, null, 2));
  return tags;
}

async function exportReviews(products: Product[]): Promise<ExportedReview[]> {
  const reviews: ExportedReview[] = [];
  for (const product of products) {
    for (const review of product.reviews) {
      reviews.push({
        id: reviews.length + 1,
        productId: product.id,
        ...review,
      });
    }
  }
  await fs.promises.writeFile(REVIEWS_FILE, JSON.stringify(reviews, null, 2));
  return reviews;
}

async function exportImages(products: Product[]): Promise<ExportedImage[]> {
  const images: ExportedImage[] = [];
  for (const product of products) {
    for (const image of product.images) {
      images.push({
        id: images.length + 1,
        url: image,
        productId: product.id,
      });
    }
  }
  await fs.promises.writeFile(IMAGES_FILE, JSON.stringify(images, null, 2));
  return images;
}

async function exportProductsToTags(
  products: Product[],
  tags: ExportedTag[],
): Promise<void> {
  const productsToTags: { productId: number; tagId: number }[] = [];
  for (const product of products) {
    for (const tag of product.tags) {
      const tagId = tags.find((t) => t.name === tag)?.id;
      if (!tagId) {
        continue;
      }
      productsToTags.push({
        productId: product.id,
        tagId,
      });
    }
  }
  await fs.promises.writeFile(
    PRODUCTS_TO_TAGS_FILE,
    JSON.stringify(productsToTags, null, 2),
  );
}

async function exportProducts(
  products: Product[],
  exportedCategories: ExportedCategory[],
): Promise<ExportedProduct[]> {
  const exportedProducts: ExportedProduct[] = [];
  for (const product of products) {
    const categoryId = exportedCategories.find(
      (c) => c.name === product.category,
    )?.id;
    if (!categoryId) {
      continue;
    }
    exportedProducts.push({
      id: product.id,
      categoryId,
      title: product.title,
      description: product.description,
      price: product.price,
      discountPercentage: product.discountPercentage,
      rating: product.rating,
      stock: product.stock,
      brand: product.brand,
      sku: product.sku,
      weight: product.weight,
      warrantyInformation: product.warrantyInformation,
      shippingInformation: product.shippingInformation,
      availabilityStatus: product.availabilityStatus,
      returnPolicy: product.returnPolicy,
      minimumOrderQuantity: product.minimumOrderQuantity,
      thumbnail: product.thumbnail,
      dimensions: JSON.stringify(product.dimensions),
      meta: JSON.stringify(product.meta),
    });
  }
  await fs.promises.writeFile(
    PRODUCTS_FILE,
    JSON.stringify(exportedProducts, null, 2),
  );
  return exportedProducts;
}

async function downloadDummyData(): Promise<void> {
  console.log('Downloading dummy data...');
  const products = await getDummyData();
  console.log('Dummy data downloaded successfully');

  const [categories, tags] = await Promise.all([
    exportCategories(products),
    exportTags(products),
    exportReviews(products),
    exportImages(products),
  ]);

  await Promise.all([
    exportProductsToTags(products, tags),
    exportProducts(products, categories),
  ]);
}

downloadDummyData()
  .then(() => {
    console.log('Dummy data exported successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error downloading dummy data', error);
    process.exit(1);
  });
