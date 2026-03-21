import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  CampaignProgress,
  CampaignRule,
  CreateSaleRequest,
  CreateSaleResponse,
  CustomerProfile,
  CustomerHistoryItem,
  CustomerOverview,
  DashboardSummary,
  Employee,
  LoyaltyTransaction,
  Product
  ,RewardBundle,
  RewardDefinition,
  RewardRedemption,
  SaleListItem,
  UserRole
} from './api.types';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly apiBase = 'http://localhost:5000/api';

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService
  ) {}

  getProducts(onlyActive = true): Promise<Product[]> {
    return firstValueFrom(this.http.get<Product[]>(`${this.apiBase}/catalog/products?onlyActive=${onlyActive}`));
  }

  updateProduct(productId: string, payload: Omit<Product, 'id'>): Promise<Product> {
    return firstValueFrom(
      this.http.put<Product>(`${this.apiBase}/catalog/products/${productId}`, payload, {
        headers: this.authHeaders()
      })
    );
  }

  createProduct(payload: Omit<Product, 'id'>): Promise<Product> {
    return firstValueFrom(
      this.http.post<Product>(`${this.apiBase}/catalog/products`, payload, {
        headers: this.authHeaders()
      })
    );
  }

  createSale(payload: CreateSaleRequest): Promise<CreateSaleResponse> {
    return firstValueFrom(
      this.http.post<CreateSaleResponse>(`${this.apiBase}/admin/sales`, payload, {
        headers: this.authHeaders()
      })
    );
  }

  getSales(status?: number | string): Promise<SaleListItem[]> {
    const suffix = status ? `?status=${status}` : '';
    return firstValueFrom(
      this.http.get<SaleListItem[]>(`${this.apiBase}/admin/sales${suffix}`, { headers: this.authHeaders() })
    );
  }

  getDashboard(): Promise<DashboardSummary> {
    return firstValueFrom(
      this.http.get<DashboardSummary>(`${this.apiBase}/admin/dashboard`, { headers: this.authHeaders() })
    );
  }

  getEmployees(): Promise<Employee[]> {
    return firstValueFrom(
      this.http.get<Employee[]>(`${this.apiBase}/admin/employees`, { headers: this.authHeaders() })
    );
  }

  createEmployee(payload: { name: string; email: string; password: string; role: UserRole; isActive: boolean }): Promise<Employee> {
    return firstValueFrom(
      this.http.post<Employee>(`${this.apiBase}/admin/employees`, payload, { headers: this.authHeaders() })
    );
  }

  updateEmployee(
    employeeId: string,
    payload: { name: string; email: string; role: UserRole; isActive: boolean }
  ): Promise<Employee> {
    return firstValueFrom(
      this.http.put<Employee>(`${this.apiBase}/admin/employees/${employeeId}`, payload, { headers: this.authHeaders() })
    );
  }

  getRewardDefinitionsAdmin(): Promise<RewardDefinition[]> {
    return firstValueFrom(
      this.http.get<RewardDefinition[]>(`${this.apiBase}/admin/reward-definitions`, { headers: this.authHeaders() })
    );
  }

  createRewardDefinition(payload: Omit<RewardDefinition, 'id'>): Promise<RewardDefinition> {
    return firstValueFrom(
      this.http.post<RewardDefinition>(`${this.apiBase}/admin/reward-definitions`, payload, { headers: this.authHeaders() })
    );
  }

  updateRewardDefinition(rewardId: string, payload: Omit<RewardDefinition, 'id'>): Promise<RewardDefinition> {
    return firstValueFrom(
      this.http.put<RewardDefinition>(`${this.apiBase}/admin/reward-definitions/${rewardId}`, payload, { headers: this.authHeaders() })
    );
  }

  getCampaignRules(): Promise<CampaignRule[]> {
    return firstValueFrom(
      this.http.get<CampaignRule[]>(`${this.apiBase}/admin/campaign-rules`, { headers: this.authHeaders() })
    );
  }

  createCampaignRule(payload: Omit<CampaignRule, 'id' | 'createdAtUtc'>): Promise<CampaignRule> {
    return firstValueFrom(
      this.http.post<CampaignRule>(`${this.apiBase}/admin/campaign-rules`, payload, { headers: this.authHeaders() })
    );
  }

  updateCampaignRule(ruleId: string, payload: Omit<CampaignRule, 'id' | 'createdAtUtc'>): Promise<CampaignRule> {
    return firstValueFrom(
      this.http.put<CampaignRule>(`${this.apiBase}/admin/campaign-rules/${ruleId}`, payload, { headers: this.authHeaders() })
    );
  }

  getRewardRedemptions(onlyPending = false): Promise<Array<RewardRedemption & { customer?: string }>> {
    const suffix = onlyPending ? '?onlyPending=true' : '';
    return firstValueFrom(
      this.http.get<Array<RewardRedemption & { customer?: string }>>(`${this.apiBase}/admin/reward-redemptions${suffix}`, {
        headers: this.authHeaders()
      })
    );
  }

  markRewardUsed(rewardId: string): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(`${this.apiBase}/admin/reward-redemptions/${rewardId}/use`, {}, { headers: this.authHeaders() })
    );
  }

  linkSaleByQr(qrToken: string): Promise<{ message: string; id: string; linkedAtUtc: string; earnedPoints: number }> {
    return firstValueFrom(
      this.http.post<{ message: string; id: string; linkedAtUtc: string; earnedPoints: number }>(
        `${this.apiBase}/customer/link-sale`,
        { qrToken },
        { headers: this.authHeaders() }
      )
    );
  }

  getCustomerOverview(): Promise<CustomerOverview> {
    return firstValueFrom(
      this.http.get<CustomerOverview>(`${this.apiBase}/customer/overview`, { headers: this.authHeaders() })
    );
  }

  getCustomerHistory(): Promise<CustomerHistoryItem[]> {
    return firstValueFrom(
      this.http.get<CustomerHistoryItem[]>(`${this.apiBase}/customer/history`, { headers: this.authHeaders() })
    );
  }

  getCustomerProfile(): Promise<CustomerProfile> {
    return firstValueFrom(
      this.http.get<CustomerProfile>(`${this.apiBase}/customer/profile`, { headers: this.authHeaders() })
    );
  }

  updateCustomerProfile(payload: { fullName: string; email: string; phone: string }): Promise<void> {
    return firstValueFrom(
      this.http.put<void>(`${this.apiBase}/customer/profile`, payload, { headers: this.authHeaders() })
    );
  }

  getCustomerRewards(): Promise<RewardBundle> {
    return firstValueFrom(
      this.http.get<RewardBundle>(`${this.apiBase}/customer/rewards`, { headers: this.authHeaders() })
    );
  }

  redeemReward(rewardDefinitionId: string): Promise<{ message: string }> {
    return firstValueFrom(
      this.http.post<{ message: string }>(
        `${this.apiBase}/customer/rewards/redeem`,
        { rewardDefinitionId },
        { headers: this.authHeaders() }
      )
    );
  }

  getCampaignProgress(): Promise<CampaignProgress[]> {
    return firstValueFrom(
      this.http.get<CampaignProgress[]>(`${this.apiBase}/customer/campaign-progress`, { headers: this.authHeaders() })
    );
  }

  getLoyaltyTransactions(): Promise<LoyaltyTransaction[]> {
    return firstValueFrom(
      this.http.get<LoyaltyTransaction[]>(`${this.apiBase}/customer/loyalty-transactions`, { headers: this.authHeaders() })
    );
  }

  private authHeaders(): HttpHeaders {
    const token = this.authService.token();
    if (!token) {
      throw new Error('Sessao nao autenticada.');
    }

    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
}
