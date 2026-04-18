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
        background: linear-gradient(135deg, rgba(227,30,36,0.05) 0%, rgba(74,22,109,0.05) 100%), #ffffff;
        border: 1px solid #eaeaea;
        border-radius: 24px;
        padding: 2rem;
        box-shadow: 0 12px 40px rgba(0,0,0,0.06);
        animation: rise 450ms ease-out;
      }

      .badge {
        width: fit-content;
        background: #e31e24;
        color: #fff;
        font-size: 0.8rem;
        font-weight: 700;
        padding: 0.35rem 0.75rem;
        border-radius: 999px;
      }

      h1 {
        margin: 1rem 0;
        font-family: 'Sora', sans-serif;
        font-size: clamp(2rem, 5vw, 3.2rem);
        line-height: 1.15;
        color: #333;
      }

      .subtitle {
        max-width: 62ch;
        color: #555;
        font-size: 1.1rem;
        line-height: 1.6;
      }

      .actions {
        margin-top: 1.5rem;
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .actions a {
        text-decoration: none;
        background: #e31e24;
        color: #fff;
        font-weight: 700;
        padding: 0.85rem 1.4rem;
        border-radius: 12px;
        transition: all 0.2s;
        box-shadow: 0 4px 10px rgba(227, 30, 36, 0.2);
      }

      .actions a:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 15px rgba(227, 30, 36, 0.3);
      }

      .actions a.secondary {
        background: #ffffff;
        color: #333;
        border: 1px solid #ddd;
        box-shadow: none;
      }

      .actions a.secondary:hover {
        border-color: #ccc;
        background: #fdfdfd;
      }

      .grid {
        margin-top: 1.5rem;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
      }

      article {
        background: #ffffff;
        border: 1px solid #eaeaea;
        border-radius: 16px;
        padding: 1.5rem;
        color: #555;
        box-shadow: 0 4px 15px rgba(0,0,0,0.03);
        transition: transform 0.2s;
      }

      article:hover {
        transform: translateY(-3px);
      }

      h2 {
        margin: 0;
        font-size: 1.25rem;
        color: #333;
        font-family: 'Sora', sans-serif;
      }

      p {
        margin-top: 0.5rem;
        margin-bottom: 0;
        line-height: 1.5;
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
