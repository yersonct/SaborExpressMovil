import { API_BASE_URL } from "@/config/api";
export const TABLES_BASE_URL = `${API_BASE_URL}/api/Tables`;

export const TABLES_ENDPOINTS = {
  byBranch: (branchId: number) => `${TABLES_BASE_URL}/branch/${branchId}`,
  byId: (id: number) => `${TABLES_BASE_URL}/${id}`,
  updateStatus: (id: number) => `${TABLES_BASE_URL}/${id}/status`,
  previousReleaseReviews: (branchId: number) => `${TABLES_BASE_URL}/branch/${branchId}/previous-release-reviews`,
  releaseReview: (id: number) => `${TABLES_BASE_URL}/${id}/release-review`,
  releasePrevious: (id: number) => `${TABLES_BASE_URL}/${id}/release-previous`,

  
} as const;
