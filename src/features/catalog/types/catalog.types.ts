export interface Category {
  id: number;
  name: string;
  description: string;
  status: boolean;
}

export interface Product {
  id: number;
  categoryId: number;
  categoryName: string;
  // null = producto global, visible en todas las sedes
  branchId: number | null;
  branchName: string | null;
  name: string;
  description: string;
  price: number;
  photo: string | null;
  preparationTimeInMinutes: number;
  status: boolean;
}
