export interface Product {
  id: number;
  categoryId: number;
  categoryName: string;
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
  createdAt: string;
}
