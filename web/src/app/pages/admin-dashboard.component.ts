import { CurrencyPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as QRCode from 'qrcode';
import { ApiService } from '../core/api.service';
import {
  CampaignRule,
  DashboardSummary,
  Employee,
  Product,
  RewardDefinition,
  RewardRedemption,
  SaleListItem,
  UserRole
} from '../core/api.types';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, DatePipe, CurrencyPipe],
  template: `
    <section class="panel">
      <h1>Painel administrativo</h1>
      <p>Operacao de balcao, gestao de catalogo, campanhas, funcionarios e auditoria do MVP.</p>

      @if (!isEmployeeSession()) {
        <div class="auth-box card">
          <h2>Login do funcionario</h2>
          <div class="field-grid two">
            <label>
              E-mail
              <input [(ngModel)]="login" type="email" placeholder="admin@sorveteria.local" />
            </label>
            <label>
              Senha
              <input [(ngModel)]="password" type="password" placeholder="Admin@123" />
            </label>
          </div>
          <button type="button" (click)="doLogin()" [disabled]="busy()">Entrar</button>
        </div>
      }

      @if (isEmployeeSession()) {
        <div class="toolbar">
          <button type="button" *ngFor="let section of sections" [class.active]="activeSection() === section.id" (click)="activeSection.set(section.id)">
            {{ section.label }}
          </button>
          <button type="button" class="ghost" (click)="loadAdminData()" [disabled]="busy()">Atualizar</button>
        </div>

        @if (dashboard()) {
          <div class="metrics">
            <article>
              <h3>Clientes</h3>
              <p>{{ dashboard()!.customers }}</p>
            </article>
            <article>
              <h3>Funcionarios</h3>
              <p>{{ dashboard()!.employees }}</p>
            </article>
            <article>
              <h3>Pendentes</h3>
              <p>{{ dashboard()!.pendingSales }}</p>
            </article>
            <article>
              <h3>Vinculadas</h3>
              <p>{{ dashboard()!.linkedSales }}</p>
            </article>
            <article>
              <h3>Expiradas</h3>
              <p>{{ dashboard()!.expiredSales }}</p>
            </article>
            <article>
              <h3>Resgates pendentes</h3>
              <p>{{ dashboard()!.rewardsPendingUse }}</p>
            </article>
          </div>
        }

        @if (activeSection() === 'sales') {
          <div class="layout-grid">
            <div class="card">
              <h2>Nova venda</h2>
              <div class="tabs">
                <button type="button" [class.active]="selectedCategory() === 'Todas'" (click)="selectedCategory.set('Todas')">Todas</button>
                <button type="button" *ngFor="let category of categories()" [class.active]="selectedCategory() === category" (click)="selectedCategory.set(category)">
                  {{ category }}
                </button>
              </div>
              <div class="product-grid">
                <article *ngFor="let item of filteredProducts()">
                  <h3>{{ item.name }}</h3>
                  <p>{{ item.category }}</p>
                  <small>{{ item.unitPrice | currency: 'BRL' }} | {{ item.basePoints }} pts</small>
                  <div class="qty-row">
                    <button type="button" class="qty-btn" (click)="decQty(item.id)" [disabled]="qty(item.id) === 0">−</button>
                    <span class="qty-val">{{ qty(item.id) }}</span>
                    <button type="button" class="qty-btn" (click)="incQty(item.id)">+</button>
                  </div>
                </article>
              </div>
              <div class="summary-row">
                <strong>Itens: {{ selectedCount() }}</strong>
                <strong>Total: {{ estimatedTotal() | currency: 'BRL' }}</strong>
              </div>
              <div class="button-row">
                <button type="button" class="ghost" (click)="clearOrder()" [disabled]="busy() || selectedCount() === 0">Limpar pedido</button>
                <button type="button" (click)="createSale()" [disabled]="busy() || selectedCount() === 0">Gerar QR</button>
              </div>
            </div>

            <div class="card">
              <h2>Ultimo QR gerado</h2>
              @if (lastQrToken()) {
                <img *ngIf="qrCodeDataUrl()" [src]="qrCodeDataUrl()!" alt="QR Code da compra" class="qr-image" />
                <p><strong>Token:</strong> {{ lastQrToken() }}</p>
                <p><strong>Expira em:</strong> {{ lastExpiresAt() | date: 'dd/MM/yyyy HH:mm' }}</p>
              } @else {
                <p>Gere uma venda para visualizar o QR.</p>
              }
            </div>
          </div>

          <div class="card">
            <div class="header-row">
              <h2>Historico de vendas</h2>
              <select [(ngModel)]="salesStatusFilter" (ngModelChange)="loadSales()">
                <option value="">Todos</option>
                <option value="PendingLink">Pendentes</option>
                <option value="Linked">Vinculadas</option>
                <option value="Expired">Expiradas</option>
                <option value="Cancelled">Canceladas</option>
              </select>
            </div>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Funcionario</th>
                    <th>Cliente</th>
                    <th>Total</th>
                    <th>Criado</th>
                    <th>Expira</th>
                    <th>Token</th>
                    <th>Itens</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let sale of sales()">
                    <td>{{ statusLabel(sale.status) }}</td>
                    <td>{{ sale.employee }}</td>
                    <td>{{ sale.customer || 'Nao vinculado' }}</td>
                    <td>{{ (sale.totalAmount ?? 0) | currency: 'BRL' }}</td>
                    <td>{{ sale.createdAtUtc | date: 'dd/MM HH:mm' }}</td>
                    <td>{{ sale.expiresAtUtc | date: 'dd/MM HH:mm' }}</td>
                    <td class="mono">{{ sale.qrToken }}</td>
                    <td>{{ sale.items.length }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        }

        @if (activeSection() === 'products') {
          <div class="layout-grid">
            <div class="card">
              <h2>{{ editingProductId() ? 'Editar produto' : 'Novo produto' }}</h2>
              <div class="field-grid two">
                <label>Nome<input [(ngModel)]="productForm.name" type="text" /></label>
                <label>Categoria
                  <select [(ngModel)]="productForm.category">
                    <option *ngFor="let cat of allCategories()" [value]="cat">{{ cat }}</option>
                    <option value="__nova__">+ Nova categoria...</option>
                  </select>
                  <input *ngIf="productForm.category === '__nova__'" [(ngModel)]="newCategoryName" type="text" placeholder="Nome da nova categoria" style="margin-top:0.4rem" />
                </label>
                <label>Descricao<input [(ngModel)]="productForm.description" type="text" /></label>
                <label>Preco<input [(ngModel)]="productForm.unitPrice" type="text" inputmode="decimal" (blur)="formatPrice()" placeholder="0,00" /></label>
                <label>Pontos<input [(ngModel)]="productForm.basePoints" type="number" /></label>
                <label class="check"><input [(ngModel)]="productForm.isActive" type="checkbox" />Ativo</label>
                <label class="check"><input [(ngModel)]="productForm.countsForCampaign" type="checkbox" />Conta campanha</label>
              </div>
              <button type="button" (click)="saveProduct()" [disabled]="busy()">Salvar produto</button>
            </div>

            <div class="card">
              <h2>Catalogo</h2>
              <div class="list">
                <button type="button" class="list-item" *ngFor="let product of products()" (click)="editProduct(product)">
                  <span>{{ product.name }} - {{ product.category }}</span>
                  <small>{{ product.unitPrice | currency: 'BRL' }} | {{ product.isActive ? 'Ativo' : 'Inativo' }}</small>
                </button>
              </div>
            </div>
          </div>
        }

        @if (activeSection() === 'employees') {
          <div class="layout-grid">
            <div class="card">
              <h2>{{ editingEmployeeId() ? 'Editar funcionario' : 'Novo funcionario' }}</h2>
              <div class="field-grid two">
                <label>Nome<input [(ngModel)]="employeeForm.name" type="text" /></label>
                <label>E-mail<input [(ngModel)]="employeeForm.email" type="email" /></label>
                <label *ngIf="!editingEmployeeId()">Senha<input [(ngModel)]="employeeForm.password" type="password" /></label>
                <label>Perfil
                  <select [(ngModel)]="employeeForm.role">
                    <option value="Employee">Funcionario</option>
                    <option value="Admin">Administrador</option>
                  </select>
                </label>
                <label class="check"><input [(ngModel)]="employeeForm.isActive" type="checkbox" />Ativo</label>
              </div>
              <button type="button" (click)="saveEmployee()" [disabled]="busy()">Salvar funcionario</button>
            </div>

            <div class="card">
              <h2>Funcionarios cadastrados</h2>
              <div class="list">
                <button type="button" class="list-item" *ngFor="let employee of employees()" (click)="editEmployee(employee)">
                  <span>{{ employee.name }} - {{ employee.role }}</span>
                  <small>{{ employee.email }} | {{ employee.isActive ? 'Ativo' : 'Inativo' }}</small>
                </button>
              </div>
            </div>
          </div>
        }

        @if (activeSection() === 'campaigns') {
          <div class="layout-grid">
            <div class="card">
              <h2>{{ editingCampaignId() ? 'Editar campanha' : 'Nova campanha' }}</h2>
              <div class="field-grid two">
                <label>Nome<input [(ngModel)]="campaignForm.name" type="text" /></label>
                <label>Descricao<input [(ngModel)]="campaignForm.description" type="text" /></label>
                <label>Tipo
                  <select [(ngModel)]="campaignForm.ruleType">
                    <option value="CategoryQuantity">Quantidade por categoria</option>
                    <option value="PointsThreshold">Meta de pontos</option>
                  </select>
                </label>
                <label>Categoria<input [(ngModel)]="campaignForm.category" type="text" /></label>
                <label>Qtd alvo<input [(ngModel)]="campaignForm.requiredQuantity" type="number" /></label>
                <label>Pontos alvo<input [(ngModel)]="campaignForm.requiredPoints" type="number" /></label>
                <label>Bonus em pontos<input [(ngModel)]="campaignForm.bonusPoints" type="number" /></label>
                <label>Nome da recompensa<input [(ngModel)]="campaignForm.rewardName" type="text" /></label>
                <label class="check"><input [(ngModel)]="campaignForm.isActive" type="checkbox" />Ativa</label>
              </div>
              <button type="button" (click)="saveCampaign()" [disabled]="busy()">Salvar campanha</button>
            </div>

            <div class="card">
              <h2>Campanhas</h2>
              <div class="list">
                <button type="button" class="list-item" *ngFor="let rule of campaignRules()" (click)="editCampaign(rule)">
                  <span>{{ rule.name }} - {{ rule.ruleType }}</span>
                  <small>{{ rule.rewardName }} | {{ rule.isActive ? 'Ativa' : 'Inativa' }}</small>
                </button>
              </div>
            </div>
          </div>
        }

        @if (activeSection() === 'rewards') {
          <div class="layout-grid">
            <div class="card">
              <h2>{{ editingRewardId() ? 'Editar recompensa' : 'Nova recompensa' }}</h2>
              <div class="field-grid two">
                <label>Nome<input [(ngModel)]="rewardForm.name" type="text" /></label>
                <label>Descricao<input [(ngModel)]="rewardForm.description" type="text" /></label>
                <label>Custo em pontos<input [(ngModel)]="rewardForm.costPoints" type="number" /></label>
                <label class="check"><input [(ngModel)]="rewardForm.isActive" type="checkbox" />Ativa</label>
              </div>
              <button type="button" (click)="saveReward()" [disabled]="busy()">Salvar recompensa</button>
            </div>

            <div class="card">
              <h2>Catalogo de recompensas</h2>
              <div class="list">
                <button type="button" class="list-item" *ngFor="let reward of rewardDefinitions()" (click)="editReward(reward)">
                  <span>{{ reward.name }}</span>
                  <small>{{ reward.costPoints }} pts | {{ reward.isActive ? 'Ativa' : 'Inativa' }}</small>
                </button>
              </div>
            </div>
          </div>

          <div class="card">
            <h2>Resgates pendentes de uso</h2>
            <div class="list">
              <div class="list-item static" *ngFor="let redemption of rewardRedemptions()">
                <div>
                  <span>{{ redemption.rewardName }}</span>
                  <small>{{ redemption.customer || 'Cliente' }} | {{ redemption.grantedReason || 'Sem origem' }}</small>
                </div>
                <button type="button" (click)="useReward(redemption.id)" [disabled]="busy()">Marcar usado</button>
              </div>
            </div>
          </div>
        }

        @if (activeSection() === 'audit') {
          <div class="card">
            <div class="header-row">
              <h2>Auditoria de vendas</h2>
              <div style="display:flex;gap:0.5rem;align-items:center;">
                <select [(ngModel)]="auditStatusFilter" (ngModelChange)="loadAuditSales()">
                  <option value="">Todos</option>
                  <option value="PendingLink">Pendentes</option>
                  <option value="Linked">Vinculadas</option>
                  <option value="Expired">Expiradas</option>
                  <option value="Cancelled">Canceladas</option>
                </select>
                <button type="button" class="ghost" (click)="loadAuditSales()" [disabled]="busy()">Atualizar</button>
              </div>
            </div>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Funcionario</th>
                    <th>Cliente</th>
                    <th>Total</th>
                    <th>Criado em</th>
                    <th>Expira em</th>
                    <th>Vinculado em</th>
                    <th>IP</th>
                    <th>Token</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let sale of auditSales()">
                    <td>{{ statusLabel(sale.status) }}</td>
                    <td>{{ sale.employee }}</td>
                    <td>{{ sale.customer || '—' }}</td>
                    <td>{{ (sale.totalAmount ?? 0) | currency: 'BRL' }}</td>
                    <td>{{ sale.createdAtUtc | date: 'dd/MM/yyyy HH:mm' }}</td>
                    <td>{{ sale.expiresAtUtc | date: 'dd/MM/yyyy HH:mm' }}</td>
                    <td>{{ sale.linkedAtUtc ? (sale.linkedAtUtc | date: 'dd/MM/yyyy HH:mm') : '—' }}</td>
                    <td class="mono">{{ sale.linkIpAddress || '—' }}</td>
                    <td class="mono">{{ sale.qrToken }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        }
      }

      @if (message()) {
        <p class="message">{{ message() }}</p>
      }
    </section>
  `,
  styles: [
    `
      .panel { background: #230d5c; border-radius: 22px; border: 1px solid rgba(180,80,220,0.28); padding: 1rem; color: #e8d8ff; }
      h1 { margin: 0; font-family: 'Sora', sans-serif; color: #fff; }
      h2, h3 { margin-top: 0; font-family: 'Sora', sans-serif; color: #fff; }
      .toolbar { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem; }
      .toolbar button, .tabs button, .ghost, .card button { border: 0; border-radius: 12px; padding: 0.65rem 0.9rem; font-weight: 700; background: #e31e24; color: #fff; cursor: pointer; }
      .toolbar button.active { background: #9b0f13; }
      .ghost { background: rgba(255,255,255,0.12); color: #fff; border: 1px solid rgba(255,255,255,0.2); }
      .metrics { margin-top: 1rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.7rem; }
      .metrics article, .card { background: rgba(26, 10, 74, 0.92); border: 1px solid rgba(180,80,220,0.3); border-radius: 16px; padding: 0.9rem; color: #e8d8ff; }
      .metrics p { margin: 0.25rem 0 0; font-size: 1.5rem; font-weight: 800; color: #fff; }
      .layout-grid { margin-top: 1rem; display: grid; grid-template-columns: 1.4fr 1fr; gap: 0.9rem; }
      .field-grid { display: grid; gap: 0.7rem; }
      .field-grid.two { grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
      label { display: grid; gap: 0.35rem; font-weight: 600; color: #d4baff; }
      input, select { width: 100%; background: rgba(255,255,255,0.08); border: 1px solid rgba(180,80,220,0.35); border-radius: 10px; padding: 0.6rem; font: inherit; color: #fff; }
      input::placeholder { color: rgba(255,255,255,0.35); }
      option { background: #2d0b6e; }
      .check { display: flex; align-items: center; gap: 0.55rem; }
      .check input { width: auto; }
      .tabs { display: flex; gap: 0.45rem; overflow-x: auto; margin-bottom: 0.8rem; }
      .tabs button { background: rgba(255,255,255,0.1); color: #d4baff; }
      .tabs button.active { background: #e31e24; color: #fff; }
      .product-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.7rem; }
      .product-grid article { background: rgba(26,10,74,0.85); border: 1px solid rgba(180,80,220,0.2); border-radius: 12px; padding: 0.75rem; color: #e8d8ff; }
      .qty-row { display: flex; align-items: center; gap: 0.4rem; margin-top: 0.55rem; }
      .qty-btn { padding: 0.3rem 0.7rem; border-radius: 8px; font-size: 1rem; min-width: 2rem; }
      .qty-val { min-width: 1.8rem; text-align: center; font-weight: 700; font-size: 1rem; color: #fff; }
      .summary-row, .header-row, .button-row { margin-top: 0.8rem; display: flex; gap: 0.75rem; align-items: center; justify-content: space-between; }
      .qr-image { width: min(100%, 280px); display: block; margin: 0 auto 0.8rem; border-radius: 12px; background: #fff; padding: 0.5rem; }
      .table-wrap { overflow-x: auto; }
      table { width: 100%; border-collapse: collapse; }
      th { color: #d4baff; font-size: 0.85rem; }
      th, td { text-align: left; padding: 0.55rem; border-bottom: 1px solid rgba(180,80,220,0.15); vertical-align: top; color: #e8d8ff; }
      .mono { font-family: Consolas, monospace; font-size: 0.84rem; }
      .list { display: grid; gap: 0.55rem; }
      .list-item { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; text-align: left; width: 100%; background: rgba(26,10,74,0.85); border: 1px solid rgba(180,80,220,0.25); border-radius: 12px; padding: 0.75rem; cursor: pointer; }
      .list-item.static { cursor: default; }
      .list-item span { display: block; font-weight: 700; color: #fff; }
      .list-item small { display: block; color: #c9aaff; }
      .message { margin-top: 0.9rem; color: #ff5a5f; font-weight: 700; }
      .auth-box { max-width: 480px; }
      @media (max-width: 920px) { .layout-grid { grid-template-columns: 1fr; } }
    `
  ]
})
export class AdminDashboardComponent {
  readonly sections = [
    { id: 'sales', label: 'Vendas' },
    { id: 'products', label: 'Produtos' },
    { id: 'employees', label: 'Funcionarios' },
    { id: 'campaigns', label: 'Campanhas' },
    { id: 'rewards', label: 'Recompensas' },
    { id: 'audit', label: 'Auditoria' }
  ];

  login = 'admin@sorveteria.local';
  password = 'Admin@123';
  salesStatusFilter = '';
  auditStatusFilter = '';

  readonly busy = signal(false);
  readonly message = signal('');
  readonly activeSection = signal('sales');
  readonly dashboard = signal<DashboardSummary | null>(null);
  readonly products = signal<Product[]>([]);
  readonly employees = signal<Employee[]>([]);
  readonly campaignRules = signal<CampaignRule[]>([]);
  readonly rewardDefinitions = signal<RewardDefinition[]>([]);
  readonly rewardRedemptions = signal<Array<RewardRedemption & { customer?: string }>>([]);
  readonly sales = signal<SaleListItem[]>([]);
  readonly auditSales = signal<SaleListItem[]>([]);
  readonly selectedCategory = signal('Todas');
  readonly qtyMap = signal<Record<string, number>>({});
  readonly lastQrToken = signal('');
  readonly lastExpiresAt = signal<string | null>(null);
  readonly qrCodeDataUrl = signal<string | null>(null);
  readonly editingProductId = signal<string | null>(null);
  readonly editingEmployeeId = signal<string | null>(null);
  readonly editingCampaignId = signal<string | null>(null);
  readonly editingRewardId = signal<string | null>(null);

  readonly categories = computed(() => [...new Set(this.products().filter((x) => x.isActive).map((x) => x.category))]);
  readonly allCategories = computed(() => [...new Set(this.products().map((x) => x.category))].sort());
  readonly filteredProducts = computed(() => {
    const category = this.selectedCategory();
    const activeProducts = this.products().filter((x) => x.isActive);
    return category === 'Todas' ? activeProducts : activeProducts.filter((x) => x.category === category);
  });
  readonly selectedCount = computed(() => Object.values(this.qtyMap()).reduce((acc, qty) => acc + qty, 0));
  readonly estimatedTotal = computed(() => this.products().reduce((acc, item) => acc + item.unitPrice * this.qty(item.id), 0));

  productForm = this.emptyProductForm();
  employeeForm = this.emptyEmployeeForm();
  rewardForm = this.emptyRewardForm();
  campaignForm = this.emptyCampaignForm();
  newCategoryName = '';

  constructor(
    private readonly authService: AuthService,
    private readonly apiService: ApiService
  ) {
    if (this.isEmployeeSession()) {
      this.loadAdminData();
    }
  }

  isEmployeeSession(): boolean {
    const role = this.authService.role();
    return role === 'Admin' || role === 'Employee';
  }

  qty(productId: string): number {
    return this.qtyMap()[productId] ?? 0;
  }

  incQty(productId: string): void {
    this.qtyMap.set({ ...this.qtyMap(), [productId]: this.qty(productId) + 1 });
  }

  decQty(productId: string): void {
    const current = this.qty(productId);
    if (current <= 0) return;
    this.qtyMap.set({ ...this.qtyMap(), [productId]: current - 1 });
  }

  setQty(productId: string, value: string): void {
    const numeric = Number(value);
    const safe = Number.isFinite(numeric) && numeric > 0 ? Math.floor(numeric) : 0;
    this.qtyMap.set({ ...this.qtyMap(), [productId]: safe });
  }

  statusLabel(status: string | number): string {
    const map: Record<string, string> = {
      PendingLink: 'Pendente',
      '1': 'Pendente',
      Linked: 'Vinculada',
      '2': 'Vinculada',
      Expired: 'Expirada',
      '3': 'Expirada',
      Cancelled: 'Cancelada',
      '4': 'Cancelada'
    };
    return map[String(status)] ?? String(status);
  }

  formatPrice(): void {
    const raw = String(this.productForm.unitPrice).replace(',', '.');
    const parsed = parseFloat(raw);
    this.productForm.unitPrice = Number.isFinite(parsed) ? parseFloat(parsed.toFixed(2)) : 0;
  }

  async doLogin(): Promise<void> {
    this.busy.set(true);
    this.message.set('');
    try {
      await this.authService.login(this.login, this.password);
      if (!this.isEmployeeSession()) {
        this.message.set('Esse usuario nao tem perfil de funcionario ou admin.');
        this.authService.logout();
        return;
      }

      await this.loadAdminData();
      this.message.set('Login administrativo realizado.');
    } catch {
      this.message.set('Falha no login administrativo.');
    } finally {
      this.busy.set(false);
    }
  }

  async loadAdminData(): Promise<void> {
    this.busy.set(true);
    this.message.set('');
    try {
      const [dashboard, products, employees, campaignRules, rewardDefinitions, rewardRedemptions] = await Promise.all([
        this.apiService.getDashboard(),
        this.apiService.getProducts(false),
        this.apiService.getEmployees(),
        this.apiService.getCampaignRules(),
        this.apiService.getRewardDefinitionsAdmin(),
        this.apiService.getRewardRedemptions(true)
      ]);

      this.dashboard.set(dashboard);
      this.products.set(products);
      this.employees.set(employees);
      this.campaignRules.set(campaignRules);
      this.rewardDefinitions.set(rewardDefinitions);
      this.rewardRedemptions.set(rewardRedemptions);
      await this.loadSales();
      await this.loadAuditSales();
    } catch {
      this.message.set('Falha ao carregar dados administrativos.');
    } finally {
      this.busy.set(false);
    }
  }

  async loadSales(): Promise<void> {
    const status = this.salesStatusFilter || undefined;
    this.sales.set(await this.apiService.getSales(status));
  }

  async loadAuditSales(): Promise<void> {
    const status = this.auditStatusFilter || undefined;
    this.auditSales.set(await this.apiService.getSales(status));
  }

  clearOrder(): void {
    this.qtyMap.set({});
    this.message.set('Montagem da compra limpa.');
  }

  async createSale(): Promise<void> {
    const employeeId = this.authService.userId();
    if (!employeeId) {
      this.message.set('Sessao invalida.');
      return;
    }

    const items = Object.entries(this.qtyMap())
      .filter(([, quantity]) => quantity > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));

    if (!items.length) {
      this.message.set('Selecione pelo menos um item.');
      return;
    }

    this.busy.set(true);
    this.message.set('');
    try {
      const response = await this.apiService.createSale({
        employeeId,
        totalAmount: this.estimatedTotal(),
        items
      });

      this.lastQrToken.set(response.qrToken);
      this.lastExpiresAt.set(response.expiresAtUtc);
      this.qrCodeDataUrl.set(await QRCode.toDataURL(response.qrToken));
      this.qtyMap.set({});
      await this.loadSales();
      await this.loadAdminData();
      this.message.set('Venda criada com QR pronto para leitura.');
    } catch {
      this.message.set('Nao foi possivel criar a venda.');
    } finally {
      this.busy.set(false);
    }
  }

  editProduct(product: Product): void {
    this.editingProductId.set(product.id);
    this.productForm = { ...product, description: product.description ?? '' };
  }

  async saveProduct(): Promise<void> {
    this.busy.set(true);
    try {
      if (this.productForm.category === '__nova__') {
        this.productForm.category = this.newCategoryName.trim() || 'Geral';
        this.newCategoryName = '';
      }
      const payload = { ...this.productForm, description: this.productForm.description || null };
      if (this.editingProductId()) {
        await this.apiService.updateProduct(this.editingProductId()!, payload);
      } else {
        await this.apiService.createProduct(payload);
      }

      this.productForm = this.emptyProductForm();
      this.editingProductId.set(null);
      this.products.set(await this.apiService.getProducts(false));
      this.message.set('Produto salvo com sucesso.');
    } catch {
      this.message.set('Erro ao salvar produto.');
    } finally {
      this.busy.set(false);
    }
  }

  editEmployee(employee: Employee): void {
    this.editingEmployeeId.set(employee.id);
    this.employeeForm = { ...this.emptyEmployeeForm(), name: employee.name, email: employee.email, role: employee.role, isActive: employee.isActive };
  }

  async saveEmployee(): Promise<void> {
    this.busy.set(true);
    try {
      if (this.editingEmployeeId()) {
        await this.apiService.updateEmployee(this.editingEmployeeId()!, {
          name: this.employeeForm.name,
          email: this.employeeForm.email,
          role: this.employeeForm.role,
          isActive: this.employeeForm.isActive
        });
      } else {
        await this.apiService.createEmployee(this.employeeForm);
      }

      this.employeeForm = this.emptyEmployeeForm();
      this.editingEmployeeId.set(null);
      this.employees.set(await this.apiService.getEmployees());
      this.message.set('Funcionario salvo com sucesso.');
    } catch {
      this.message.set('Erro ao salvar funcionario.');
    } finally {
      this.busy.set(false);
    }
  }

  editCampaign(rule: CampaignRule): void {
    this.editingCampaignId.set(rule.id);
    this.campaignForm = { ...rule, description: rule.description ?? '', category: rule.category ?? '' };
  }

  async saveCampaign(): Promise<void> {
    this.busy.set(true);
    try {
      const payload = { ...this.campaignForm, description: this.campaignForm.description || null, category: this.campaignForm.category || null };
      if (this.editingCampaignId()) {
        await this.apiService.updateCampaignRule(this.editingCampaignId()!, payload);
      } else {
        await this.apiService.createCampaignRule(payload);
      }

      this.campaignForm = this.emptyCampaignForm();
      this.editingCampaignId.set(null);
      this.campaignRules.set(await this.apiService.getCampaignRules());
      this.message.set('Campanha salva com sucesso.');
    } catch {
      this.message.set('Erro ao salvar campanha.');
    } finally {
      this.busy.set(false);
    }
  }

  editReward(reward: RewardDefinition): void {
    this.editingRewardId.set(reward.id);
    this.rewardForm = { ...reward, description: reward.description ?? '' };
  }

  async saveReward(): Promise<void> {
    this.busy.set(true);
    try {
      const payload = { ...this.rewardForm, description: this.rewardForm.description || null };
      if (this.editingRewardId()) {
        await this.apiService.updateRewardDefinition(this.editingRewardId()!, payload);
      } else {
        await this.apiService.createRewardDefinition(payload);
      }

      this.rewardForm = this.emptyRewardForm();
      this.editingRewardId.set(null);
      this.rewardDefinitions.set(await this.apiService.getRewardDefinitionsAdmin());
      this.message.set('Recompensa salva com sucesso.');
    } catch {
      this.message.set('Erro ao salvar recompensa.');
    } finally {
      this.busy.set(false);
    }
  }

  async useReward(rewardId: string): Promise<void> {
    this.busy.set(true);
    try {
      await this.apiService.markRewardUsed(rewardId);
      this.rewardRedemptions.set(await this.apiService.getRewardRedemptions(true));
      this.dashboard.set(await this.apiService.getDashboard());
      this.message.set('Resgate marcado como utilizado.');
    } catch {
      this.message.set('Erro ao atualizar resgate.');
    } finally {
      this.busy.set(false);
    }
  }

  private emptyProductForm(): Omit<Product, 'id'> {
    return {
      name: '',
      category: 'Salgados',
      description: '',
      isActive: true,
      countsForCampaign: true,
      basePoints: 10,
      unitPrice: 0
    };
  }

  private emptyEmployeeForm(): { name: string; email: string; password: string; role: UserRole; isActive: boolean } {
    return {
      name: '',
      email: '',
      password: '',
      role: 'Employee',
      isActive: true
    };
  }

  private emptyCampaignForm(): Omit<CampaignRule, 'id' | 'createdAtUtc'> {
    return {
      name: '',
      description: '',
      ruleType: 'CategoryQuantity',
      category: 'Salgados',
      requiredQuantity: 5,
      requiredPoints: 100,
      bonusPoints: 0,
      rewardName: '',
      isActive: true
    };
  }

  private emptyRewardForm(): Omit<RewardDefinition, 'id'> {
    return {
      name: '',
      description: '',
      costPoints: 100,
      isActive: true
    };
  }
}
