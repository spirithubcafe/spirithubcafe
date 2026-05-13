export interface EmailMessageTemplate {
  id: number;
  name?: string;
  templateKey?: string;
  subject?: string;
  body?: string;
  description?: string;
  isActive?: boolean;
  updatedAt?: string;
  [key: string]: unknown;
}

