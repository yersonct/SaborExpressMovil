export interface NotificationApiResponse {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string | number;
  relatedEntityType: string | null;
  relatedEntityId: number | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}
