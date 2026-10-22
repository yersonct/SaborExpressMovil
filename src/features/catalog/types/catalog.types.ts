export interface Category {
  id: number;
  name: string;
  description: string;
  nameEn?: string | null;
  namePt?: string | null;
  nameFr?: string | null;
  descriptionEn?: string | null;
  descriptionPt?: string | null;
  descriptionFr?: string | null;
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
  nameEn?: string | null;
  namePt?: string | null;
  nameFr?: string | null;
  descriptionEn?: string | null;
  descriptionPt?: string | null;
  descriptionFr?: string | null;
  categoryNameEn?: string | null;
  categoryNamePt?: string | null;
  categoryNameFr?: string | null;
  price: number;
  photo: string | null;
  preparationTimeInMinutes: number;
  status: boolean;
}
