export interface Product {
  id: number;
  categoryId: number;
  categoryName: string;
  name: string;
  description: string;
  price: number;
  photo: string | null;
  preparationTimeInMinutes: number;
  status: boolean;
  createdAt: string;
}
