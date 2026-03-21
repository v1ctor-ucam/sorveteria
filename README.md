# Sorveteria Fideliza

Aplicacao web responsiva para fidelizacao gamificada em lanchonete com:
- frontend Angular
- backend C# (ASP.NET Core)
- banco MySQL

## Estrutura

- `web/`: frontend Angular com home, painel admin completo e area do cliente
- `backend/Sorveteria.Api/`: API REST com JWT, vendas por QR, catalogo, campanhas, recompensas e administracao
- `database/schema.sql`: schema MySQL completo do MVP atual

## Fluxo principal do MVP

1. Funcionario monta a compra no painel administrativo.
2. API gera venda pendente e `qrToken` unico com expiracao curta.
3. Cliente escaneia o QR, autentica, e vincula a compra.
4. API processa pontos e bonus de campanha simples.
5. Historico e auditoria ficam registrados.

## Como rodar o frontend

```bash
cd web
npm install
npm start
```

## Como rodar o backend

Pre-requisitos:
- .NET SDK 8+
- MySQL 8+

Preparar banco local (sem Docker):

```bash
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -h 127.0.0.1 -P 3306 -u root -p"84153703cC!" < database/schema.sql
```

```bash
cd backend/Sorveteria.Api
dotnet restore
dotnet run
```

API base esperada: `https://localhost:5001` ou `http://localhost:5000`.

As portas locais da API estao fixas no perfil de desenvolvimento em:
- `backend/Sorveteria.Api/Properties/launchSettings.json`

Swagger fica habilitado automaticamente quando `ASPNETCORE_ENVIRONMENT=Development`.

Nao existe obrigacao de Docker neste projeto. O fluxo principal de execucao previsto e local (MySQL instalado no servidor/VPS).

## Configuracoes

- Ajuste a conexao MySQL em `backend/Sorveteria.Api/appsettings.json`.
- Troque a chave JWT de desenvolvimento antes de publicar.

## Endpoints principais (MVP)

- `POST /api/auth/register-customer`
- `POST /api/auth/login`
- `GET /api/catalog/products`
- `POST /api/catalog/products` (admin)
- `PUT /api/catalog/products/{id}` (admin)
- `GET /api/admin/dashboard` (admin)
- `GET /api/admin/employees` (admin)
- `POST /api/admin/employees` (admin)
- `PUT /api/admin/employees/{id}` (admin)
- `GET /api/admin/campaign-rules` (admin)
- `POST /api/admin/campaign-rules` (admin)
- `PUT /api/admin/campaign-rules/{id}` (admin)
- `GET /api/admin/reward-definitions` (admin)
- `POST /api/admin/reward-definitions` (admin)
- `PUT /api/admin/reward-definitions/{id}` (admin)
- `GET /api/admin/reward-redemptions` (admin)
- `POST /api/admin/reward-redemptions/{id}/use` (admin)
- `POST /api/admin/sales` (admin/funcionario)
- `GET /api/admin/sales` (admin/funcionario)
- `POST /api/customer/link-sale` (cliente)
- `GET /api/customer/overview` (cliente)
- `GET /api/customer/profile` (cliente)
- `PUT /api/customer/profile` (cliente)
- `GET /api/customer/history` (cliente)
- `GET /api/customer/loyalty-transactions` (cliente)
- `GET /api/customer/campaign-progress` (cliente)
- `GET /api/customer/rewards` (cliente)
- `POST /api/customer/rewards/redeem` (cliente)

## Fluxo ponta a ponta real (Angular + API)

Com a integracao atual, ja e possivel testar no browser:

1. Suba backend e frontend.
2. Abra `http://localhost:4200/admin`.
3. Login funcionario/admin com seed inicial:
	- e-mail: `admin@sorveteria.local`
	- senha: `Admin@123`
4. Selecione itens e gere a venda para receber o `qrToken`.
5. Abra `http://localhost:4200/cliente`.
6. Faca cadastro/login de cliente, cole o `qrToken` e vincule a compra.
7. Veja pontos, historico, campanhas e recompensas atualizados na tela do cliente.
8. No painel admin, acompanhe vendas, resgates pendentes, funcionarios, produtos e campanhas.

Observacao: para frontend local em `4200`, CORS no backend ja esta habilitado em ambiente `Development`.

## Regras de fidelizacao implementadas no bootstrap

- Pontos por item: usa `basePoints` do produto multiplicado pela quantidade.
- Bonus de combo: +5 quando a compra tem item de `Salgados` e `Bebidas`.
- Campanhas configuraveis por quantidade de categoria e por meta de pontos.
- Catalogo de recompensas resgataveis por pontos.
- QR Code (token) com validade configuravel (`QrCode:TokenMinutes`).
- Compra pendente so pode ser vinculada uma vez.
- Recompensas podem ser geradas automaticamente por campanha e marcadas como usadas no admin.

## Pendencia deixada para depois

1. Recuperacao de senha por e-mail. Isso exige configurar um provedor SMTP/servico transacional gratuito ou de baixo custo na VPS.

## Proximos passos recomendados

1. Criar migracoes EF Core e pipeline CI.
2. Endurecer regras de autorizacao e auditoria para producao.
3. Implementar notificacoes/recuperacao por e-mail.
4. Publicar frontend e backend na VPS com Nginx + systemd ou IIS conforme ambiente.
5. Adicionar testes automatizados (unitarios, integracao e e2e).
