// ============ Tag Position ============

export type TagPosition = 'Top' | 'Bottom';
export const TAG_POSITION_VALUES = { Top: 0, Bottom: 1 } as const;

// ============ Tag CRUD ============

export interface ProductTagCreateUpdateDto {
  name: string;             // max 100 chars
  nameAr?: string;          // max 100 chars
  position: number;         // 0 = Top, 1 = Bottom
  backgroundColor?: string; // hex, e.g., "#FF5733"
  textColor?: string;       // hex, e.g., "#FFFFFF"
  icon?: string;            // emoji or icon class, max 50 chars
  sortOrder: number;
  isActive: boolean;
}

export interface ProductTagResponseDto {
  id: number;
  name: string;
  nameAr?: string;
  position: TagPosition;    // "Top" or "Bottom" (string)
  positionValue: number;    // same numeric value as position
  backgroundColor?: string;
  textColor?: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;        // ISO 8601
  updatedAt: string;
  productCount: number;
}

export interface ProductTagListDto {
  id: number;
  name: string;
  nameAr?: string;
  position: TagPosition;
  positionValue: number;
  backgroundColor?: string;
  textColor?: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
}

// ============ Tag Info (embedded in Product responses) ============

export interface ProductTagInfoDto {
  id: number;
  name: string;
  nameAr?: string;
  position: TagPosition;
  backgroundColor?: string;
  textColor?: string;
  icon?: string;
  sortOrder: number;
}

// ============ Tag Assignment ============

export interface ProductTagAssignmentDto {
  tagIds: number[];
}
