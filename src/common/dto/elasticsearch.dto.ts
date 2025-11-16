export interface ElasticProduct {
  id: number;
  title: string;
  description: string;
  category: string | null;
  tags: string[];
  price: number;
  discountPercentage: number | null;
  rating: number;
  stock: number;
  availabilityStatus: 'In Stock' | 'Low Stock' | 'Out of Stock';
  brand: string;
  sku: string;
  weight: number;
  warrantyInformation: string;
  shippingInformation: string;
  returnPolicy: string;
  minimumOrderQuantity: number;
  thumbnail: string;
}
