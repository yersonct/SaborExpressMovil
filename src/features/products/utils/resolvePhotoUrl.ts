import { API_BASE_URL } from "@/config/api";

export function resolvePhotoUrl(photo: string | null): string | null {
  if (!photo) return null;
  if (photo.startsWith("http://") || photo.startsWith("https://")) return photo;
  const path = photo.startsWith("/") ? photo : `/${photo}`;
  return `${API_BASE_URL}${path}`;
}
