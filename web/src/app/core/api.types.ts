export type UserRole = 'Admin' | 'Employee' | 'Customer';

export interface AuthResponse {
  token: string;
  expiresAtUtc: string;
  role: UserRole;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  isActive: boolean;
  countsForCampaign: boolean;
  basePoints: number;
  unitPrice: number;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAtUtc: string;
}

export interface RewardDefinition {
  id: string;
  name: string;
  description?: string | null;
  costPoints: number;
  isActive: boolean;
}

export interface RewardRedemption {
  id: string;
  rewardName: string;
  costPoints: number;
  isUsed: boolean;
  grantedReason?: string | null;
  createdAtUtc: string;
  usedAtUtc?: string | null;
}

export interface CampaignRule {
  id: string;
  name: string;
  description?: string | null;
  ruleType: 'CategoryQuantity' | 'PointsThreshold';
  category?: string | null;
  requiredQuantity: number;
  requiredPoints: number;
  bonusPoints: number;
  rewardName: string;
  isActive: boolean;
  createdAtUtc: string;
}

export interface DashboardSummary {
  customers: number;
  employees: number;
  pendingSales: number;
  linkedSales: number;
  expiredSales: number;
  rewardsPendingUse: number;
}

export interface CreateSaleItemRequest {
  productId: string;
  quantity: number;
}

export interface CreateSaleRequest {
  employeeId: string;
  totalAmount: number | null;
  items: CreateSaleItemRequest[];
}

export interface CreateSaleResponse {
  saleId: string;
  qrToken: string;
  expiresAtUtc: string;
}

export interface CustomerOverview {
  fullName: string;
  pointsBalance: number;
  transactions: number;
  rewardsAvailable: number;
}

export interface CustomerProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  isActive: boolean;
  pointsBalance: number;
}

export interface CustomerHistoryItem {
  id: string;
  qrToken: string;
  createdAtUtc: string;
  linkedAtUtc: string | null;
  totalAmount: number | null;
  status: string | number;
}

export interface LoyaltyTransaction {
  id: string;
  points: number;
  type: string;
  description: string;
  createdAtUtc: string;
}

export interface CampaignProgress {
  id: string;
  name: string;
  type: string;
  current: number;
  target: number;
  rewardName: string;
}

export interface RewardBundle {
  definitions: RewardDefinition[];
  redemptions: RewardRedemption[];
}

export interface SaleListItem {
  id: string;
  qrToken: string;
  status: string | number;
  createdAtUtc: string;
  expiresAtUtc: string;
  linkedAtUtc: string | null;
  employee: string;
  customer: string | null;
  totalAmount: number | null;
  linkIpAddress: string | null;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    itemPoints: number;
    unitPriceSnapshot: number;
  }>;
}
