import { CurrencyPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, ElementRef, OnDestroy, ViewChild, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import QrScanner from 'qr-scanner';
import { ApiService } from '../core/api.service';
import {
  CampaignProgress,
  CustomerHistoryItem,
  CustomerOverview,
  CustomerProfile,
  LoyaltyTransaction,
  RewardBundle,
  RewardDefinition,
  RewardRedemption
} from '../core/api.types';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-customer-area',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, DatePipe, CurrencyPipe],
  template: `
    <section class="customer">
      <h1>Area do cliente</h1>
      <p>Cadastro, login, leitura de QR, historico, perfil, progresso e recompensas.</p>

      @if (!isCustomerSession()) {
        <div class="layout-grid">
          <div class="card">
            <h2>Entrar</h2>
            <div class="field-grid two">
              <label>E-mail ou telefone<input [(ngModel)]="login" type="text" placeholder="cliente@teste.com" /></label>
              <label>Senha<input [(ngModel)]="password" type="password" placeholder="Teste@123" /></label>
            </div>
            <button type="button" (click)="doLogin()" [disabled]="busy()">Login</button>
          </div>

          <div class="card">
            <h2>Criar conta</h2>
            <div class="field-grid two">
              <label>Nome<input [(ngModel)]="registerName" type="text" /></label>
              <label>E-mail<input [(ngModel)]="registerEmail" type="email" /></label>
              <label>Telefone<input [(ngModel)]="registerPhone" type="text" /></label>
              <label>Senha<input [(ngModel)]="registerPassword" type="password" /></label>
            </div>
            <button type="button" (click)="doRegister()" [disabled]="busy()">Cadastrar</button>
          </div>
        </div>
      }

      @if (isCustomerSession()) {
        @if (overview()) {
          <div class="metrics">
            <article>
              <h3>Cliente</h3>
              <p>{{ overview()!.fullName }}</p>
            </article>
            <article>
              <h3>Pontos</h3>
              <p>{{ overview()!.pointsBalance }}</p>
            </article>
            <article>
              <h3>Transacoes</h3>
              <p>{{ overview()!.transactions }}</p>
            </article>
            <article>
              <h3>Recompensas disponiveis</h3>
              <p>{{ overview()!.rewardsAvailable }}</p>
            </article>
          </div>
        }

        <div class="layout-grid">
          <div class="card">
            <h2>Vincular compra</h2>
            <label>QR token<input [(ngModel)]="qrToken" type="text" placeholder="Cole ou escaneie o token" /></label>
            <div class="button-row">
              <button type="button" (click)="linkSale()" [disabled]="busy() || !qrToken.trim()">Vincular compra</button>
              <button type="button" class="ghost" (click)="toggleScanner()" [disabled]="!scannerSupported">
                {{ scannerRunning() ? 'Parar camera' : 'Escanear QR' }}
              </button>
            </div>
            <small *ngIf="!scannerSupported">Leitura por camera indisponivel neste navegador ou dispositivo.</small>
            <video #scannerVideo class="scanner" [class.visible]="scannerRunning()" autoplay playsinline muted></video>
          </div>

          <div class="card" *ngIf="profile()">
            <h2>Perfil</h2>
            <div class="field-grid two">
              <label>Nome<input [(ngModel)]="profileForm.fullName" type="text" /></label>
              <label>E-mail<input [(ngModel)]="profileForm.email" type="email" /></label>
              <label>Telefone<input [(ngModel)]="profileForm.phone" type="text" /></label>
            </div>
            <button type="button" (click)="saveProfile()" [disabled]="busy()">Salvar perfil</button>
          </div>
        </div>

        <div class="layout-grid">
          <div class="card">
            <h2>Progresso das campanhas</h2>
            <div class="list">
              <div class="list-item static" *ngFor="let item of campaignProgress()">
                <div>
                  <span>{{ item.name }}</span>
                  <small>{{ item.current }} / {{ item.target }} - {{ item.rewardName }}</small>
                </div>
                <strong>{{ item.type }}</strong>
              </div>
            </div>
          </div>

          <div class="card">
            <h2>Recompensas por pontos</h2>
            <div class="list">
              <div class="list-item static" *ngFor="let reward of rewardDefinitions()">
                <div>
                  <span>{{ reward.name }}</span>
                  <small>{{ reward.description || 'Sem descricao' }} - {{ reward.costPoints }} pts</small>
                </div>
                <button type="button" (click)="redeemReward(reward)" [disabled]="busy()">Resgatar</button>
              </div>
            </div>
          </div>
        </div>

        <div class="layout-grid">
          <div class="card">
            <h2>Recompensas geradas</h2>
            <div class="list">
              <div class="list-item static" *ngFor="let reward of rewardRedemptions()">
                <div>
                  <span>{{ reward.rewardName }}</span>
                  <small>{{ reward.grantedReason || 'Sem origem' }} - {{ reward.isUsed ? 'Usada' : 'Disponivel' }}</small>
                </div>
                <strong>{{ reward.isUsed ? 'Usada' : 'Pendente' }}</strong>
              </div>
            </div>
          </div>

          <div class="card">
            <h2>Extrato de pontos</h2>
            <div class="list">
              <div class="list-item static" *ngFor="let tx of transactions()">
                <div>
                  <span>{{ tx.description }}</span>
                  <small>{{ tx.createdAtUtc | date: 'dd/MM/yyyy HH:mm' }} - {{ tx.type }}</small>
                </div>
                <strong [class.negative]="tx.points < 0">{{ tx.points > 0 ? '+' : '' }}{{ tx.points }}</strong>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="header-row">
            <h2>Historico de compras</h2>
            <button type="button" class="ghost" (click)="loadData()" [disabled]="busy()">Atualizar</button>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Data</th>
                  <th>Total</th>
                  <th>Token</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of history()">
                  <td>{{ item.status }}</td>
                  <td>{{ item.linkedAtUtc || item.createdAtUtc | date: 'dd/MM/yyyy HH:mm' }}</td>
                  <td>{{ (item.totalAmount ?? 0) | currency: 'BRL' }}</td>
                  <td class="mono">{{ item.qrToken }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      }

      @if (message()) {
        <p class="message">{{ message() }}</p>
      }
    </section>
  `,
  styles: [
    `
      .customer { background: #230d5c; border: 1px solid rgba(180,80,220,0.28); border-radius: 22px; padding: 1rem; color: #e8d8ff; }
      h1, h2, h3 { font-family: 'Sora', sans-serif; color: #fff; }
      h1 { margin: 0; }
      .layout-grid { margin-top: 1rem; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.85rem; }
      .metrics { margin-top: 1rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.7rem; }
      .metrics article, .card { background: rgba(26, 10, 74, 0.92); border: 1px solid rgba(180,80,220,0.35); border-radius: 16px; padding: 0.85rem; color: #e8d8ff; }
      .metrics p { margin: 0.25rem 0 0; font-size: 1.45rem; font-weight: 800; color: #fff; }
      .field-grid { display: grid; gap: 0.7rem; }
      .field-grid.two { grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
      label { display: grid; gap: 0.35rem; font-weight: 600; color: #d4baff; }
      input { background: rgba(255,255,255,0.1); border: 1px solid rgba(180,80,220,0.45); border-radius: 10px; padding: 0.6rem; font: inherit; color: #fff; width: 100%; }
      input::placeholder { color: rgba(255,255,255,0.4); }
      button { border: 0; border-radius: 12px; background: #e31e24; color: #fff; padding: 0.65rem 0.9rem; font-weight: 700; cursor: pointer; }
      .ghost { background: rgba(255,255,255,0.12); color: #fff; border: 1px solid rgba(255,255,255,0.2); }
      .button-row, .header-row { display: flex; gap: 0.6rem; align-items: center; justify-content: space-between; margin-top: 0.8rem; }
      .scanner { display: none; width: 100%; border-radius: 14px; margin-top: 0.8rem; background: #1f1f1f; aspect-ratio: 4 / 3; object-fit: cover; }
      .scanner.visible { display: block; }
      .list { display: grid; gap: 0.55rem; }
      .list-item { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; background: rgba(255,255,255,0.07); border: 1px solid rgba(180,80,220,0.25); border-radius: 12px; padding: 0.75rem; }
      .list-item.static span { display: block; font-weight: 700; color: #fff; }
      .list-item.static small { display: block; color: #c9aaff; }
      .negative { color: #ff7a7a; }
      .table-wrap { overflow-x: auto; }
      table { width: 100%; border-collapse: collapse; }
      th { color: #d4baff; font-size: 0.85rem; }
      th, td { text-align: left; padding: 0.55rem; border-bottom: 1px solid rgba(180,80,220,0.15); color: #e8d8ff; }
      .mono { font-family: Consolas, monospace; font-size: 0.84rem; }
      .message { margin-top: 0.8rem; color: #ff5a5f; font-weight: 700; }
      @media (max-width: 920px) { .layout-grid { grid-template-columns: 1fr; } }
    `
  ]
})
export class CustomerAreaComponent implements OnDestroy {
  @ViewChild('scannerVideo') scannerVideo?: ElementRef<HTMLVideoElement>;

  login = '';
  password = '';
  registerName = '';
  registerEmail = '';
  registerPhone = '';
  registerPassword = '';
  qrToken = '';

  readonly busy = signal(false);
  readonly message = signal('');
  readonly overview = signal<CustomerOverview | null>(null);
  readonly profile = signal<CustomerProfile | null>(null);
  readonly history = signal<CustomerHistoryItem[]>([]);
  readonly transactions = signal<LoyaltyTransaction[]>([]);
  readonly rewardDefinitions = signal<RewardDefinition[]>([]);
  readonly rewardRedemptions = signal<RewardRedemption[]>([]);
  readonly campaignProgress = signal<CampaignProgress[]>([]);
  readonly scannerRunning = signal(false);

  readonly scannerSupported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

  profileForm = {
    fullName: '',
    email: '',
    phone: ''
  };

  private qrScanner: QrScanner | null = null;

  constructor(
    private readonly authService: AuthService,
    private readonly apiService: ApiService
  ) {
    if (this.isCustomerSession()) {
      void this.loadData();
    }
  }

  ngOnDestroy(): void {
    void this.stopScanner();
  }

  isCustomerSession(): boolean {
    return this.authService.role() === 'Customer';
  }

  async doLogin(): Promise<void> {
    this.busy.set(true);
    this.message.set('');
    try {
      await this.authService.login(this.login, this.password);
      if (!this.isCustomerSession()) {
        this.authService.logout();
        this.message.set('Esse usuario nao possui perfil de cliente.');
        return;
      }

      await this.loadData();
      this.message.set('Login realizado com sucesso.');
    } catch {
      this.message.set('Falha no login do cliente.');
    } finally {
      this.busy.set(false);
    }
  }

  async doRegister(): Promise<void> {
    this.busy.set(true);
    this.message.set('');
    try {
      await this.authService.registerCustomer(
        this.registerName,
        this.registerEmail,
        this.registerPhone,
        this.registerPassword
      );
      await this.loadData();
      this.message.set('Cadastro realizado com sucesso.');
    } catch {
      this.message.set('Nao foi possivel cadastrar cliente.');
    } finally {
      this.busy.set(false);
    }
  }

  async loadData(): Promise<void> {
    const [overview, profile, history, rewards, transactions, campaignProgress] = await Promise.all([
      this.apiService.getCustomerOverview(),
      this.apiService.getCustomerProfile(),
      this.apiService.getCustomerHistory(),
      this.apiService.getCustomerRewards(),
      this.apiService.getLoyaltyTransactions(),
      this.apiService.getCampaignProgress()
    ]);

    this.overview.set(overview);
    this.profile.set(profile);
    this.profileForm = {
      fullName: profile.fullName,
      email: profile.email,
      phone: profile.phone
    };
    this.history.set(history);
    this.transactions.set(transactions);
    this.rewardDefinitions.set(rewards.definitions);
    this.rewardRedemptions.set(rewards.redemptions);
    this.campaignProgress.set(campaignProgress);
  }

  async saveProfile(): Promise<void> {
    this.busy.set(true);
    this.message.set('');
    try {
      await this.apiService.updateCustomerProfile(this.profileForm);
      await this.loadData();
      this.message.set('Perfil atualizado com sucesso.');
    } catch {
      this.message.set('Nao foi possivel atualizar o perfil.');
    } finally {
      this.busy.set(false);
    }
  }

  async linkSale(): Promise<void> {
    this.busy.set(true);
    this.message.set('');
    try {
      const result = await this.apiService.linkSaleByQr(this.qrToken.trim());
      this.qrToken = '';
      await this.loadData();
      this.message.set(`${result.message} (+${result.earnedPoints} pontos)`);
    } catch {
      this.message.set('Nao foi possivel vincular essa compra.');
    } finally {
      this.busy.set(false);
    }
  }

  async redeemReward(reward: RewardDefinition): Promise<void> {
    this.busy.set(true);
    this.message.set('');
    try {
      const response = await this.apiService.redeemReward(reward.id);
      await this.loadData();
      this.message.set(response.message);
    } catch {
      this.message.set('Nao foi possivel resgatar essa recompensa.');
    } finally {
      this.busy.set(false);
    }
  }

  async toggleScanner(): Promise<void> {
    if (!this.scannerSupported) {
      return;
    }

    if (this.scannerRunning()) {
      await this.stopScanner();
      return;
    }

    await this.startScanner();
  }

  private async startScanner(): Promise<void> {
    const video = this.scannerVideo?.nativeElement;
    if (!video) {
      this.message.set('Camera indisponivel na tela atual.');
      return;
    }

    this.qrScanner ??= new QrScanner(
      video,
      (result) => {
        this.qrToken = result.data;
        this.message.set('QR lido pela camera.');
        void this.stopScanner();
      },
      {
        preferredCamera: 'environment',
        highlightScanRegion: true,
        highlightCodeOutline: true,
        returnDetailedScanResult: true
      }
    );

    await this.qrScanner.start();
    this.scannerRunning.set(true);
  }

  private async stopScanner(): Promise<void> {
    this.scannerRunning.set(false);
    await this.qrScanner?.stop();
  }
}
