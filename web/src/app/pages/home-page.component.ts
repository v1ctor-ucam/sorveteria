import { Component } from '@angular/core';
import { NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [NgFor, RouterLink],
  template: `
    <section class="hero">
      <p class="badge">MVP em andamento</p>
      <h1>Fidelizacao gamificada para +Açaí Sabor</h1>
      <p class="subtitle">
        Registro rapido no balcao, QR Code unico por compra e pontos automaticos para recompensar o cliente.
      </p>
      <div class="actions">
        <a routerLink="/admin">Entrar no painel do funcionario</a>
        <a routerLink="/cliente" class="secondary">Abrir area do cliente</a>
      </div>
    </section>

    <section class="grid">
      <article *ngFor="let item of pilares">
        <h2>{{ item.titulo }}</h2>
        <p>{{ item.texto }}</p>
      </article>
    </section>
  `,
  styles: [
    `
      .hero {
        background: linear-gradient(135deg, rgba(227,30,36,0.18) 0%, rgba(100,20,200,0.22) 100%),
                    rgba(255,255,255,0.06);
        border: 1px solid rgba(220, 100, 255, 0.22);
        border-radius: 24px;
        padding: 1.5rem;
        box-shadow: 0 18px 50px rgba(0,0,0,0.4);
        animation: rise 450ms ease-out;
      }

      .badge {
        width: fit-content;
        background: #e31e24;
        color: #fff;
        font-size: 0.8rem;
        font-weight: 700;
        padding: 0.25rem 0.65rem;
        border-radius: 999px;
      }

      h1 {
        margin: 0.7rem 0;
        font-family: 'Sora', sans-serif;
        font-size: clamp(1.7rem, 4vw, 2.7rem);
        line-height: 1.1;
        color: #fff;
      }

      .subtitle {
        max-width: 62ch;
        color: #d4baff;
      }

      .actions {
        margin-top: 1.2rem;
        display: flex;
        gap: 0.7rem;
        flex-wrap: wrap;
      }

      .actions a {
        text-decoration: none;
        background: #e31e24;
        color: #fff;
        font-weight: 700;
        padding: 0.7rem 1rem;
        border-radius: 12px;
      }

      .actions a.secondary {
        background: rgba(255,255,255,0.12);
        color: #fff;
        border: 1px solid rgba(255,255,255,0.25);
      }

      .grid {
        margin-top: 1rem;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
        gap: 0.85rem;
      }

      article {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(180, 80, 220, 0.2);
        border-radius: 16px;
        padding: 1rem;
        color: #e8d8ff;
      }

      h2 {
        margin: 0;
        font-size: 1.02rem;
        color: #fff;
      }

      p {
        margin-bottom: 0;
      }

      @keyframes rise {
        from {
          opacity: 0;
          transform: translateY(16px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `
  ]
})
export class HomePageComponent {
  pilares = [
    {
      titulo: 'Controle centralizado',
      texto: 'As compras nascem no painel do funcionario para evitar fraudes e garantir rastreabilidade.'
    },
    {
      titulo: 'Vinculo por QR Code',
      texto: 'Cada compra gera um token temporario, usado uma unica vez pelo cliente autenticado.'
    },
    {
      titulo: 'Fidelizacao simples no MVP',
      texto: 'Pontos, metas e recompensas com regras configuraveis para validar operacao primeiro.'
    }
  ];
}
