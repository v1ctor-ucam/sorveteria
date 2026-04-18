# Documentação do Sistema: Sorveteria +Açaí Sabor

Bem-vindo(a) à documentação do sistema de fidelidade. Este guia foi criado para auxiliar o gerente ou o apresentador no treinamento da equipe sobre como usar a plataforma.

## 1. Visão Geral
O sistema possui duas áreas principais:
- **Área do Cliente**: Onde o cliente se cadastra, visualiza seu progresso (pontos/selos), faz login pelo celular e gera um código QR para ser "bipado" no caixa.
- **Painel Administrativo**: A área do lojista (caixa ou gerente) onde as vendas são registradas, produtos são gerenciados e as campanhas e recompensas são criadas.

---

## 2. O que é "Conta Campanha"? (Entendendo os Produtos)

Na tela de criação ou edição de um Produto, existe um campo (checkbox) chamado **"Conta campanha"**. 

**Para que serve?**
- Marcar como **"Conta campanha"** significa que aquele produto em específico participa do programa de fidelidade atual. 
- Ou seja, ao comprar este item, o cliente *acumula carimbos ou pontos*.
- Produtos desmarcados (ex: água, balinhas, complementos baratos) podem não contar pontos de campanha.

*Exemplo Prático:* Se a campanha atual é "Compre 10 Açaís Grandes e ganhe 1 Açaí Pequeno", marcamos apenas o "Açaí Grande" como **Conta Campanha**. Assim, ao lançar uma venda de "1 Açaí Grande + 1 Água", o sistema detecta que há 1 produto elegível, e dá 1 ponto/carimbo para o cliente.

---

## 3. Gestão de Campanhas e Recompensas

Para gerenciar o sistema de fidelidade, existem duas telas conjuntas que o gerente ajusta.

### Campanhas (A Regra do Jogo)
A campanha define como o usuário junta os pontos e quando a campanha acaba.
- **Nome**: Ex: "Fidelidade de Verão".
- **Condição (X)**: Quantos pontos ou carimbos o cliente precisa juntar.
- **Datas**: Início e fim da promoção de pontos.

### Recompensas (O Prêmio)
Configura o que o cliente de fato ganha ao atingir os pontos exigidos pela campanha.
- **Nome do Prêmio**: Ex: "Um Açaí de 300ml Grátis".
- **Pontos Necessários**: Geralmente alinhado com o da campanha (ex: 10 pontos).
- Após o cliente atingir o limite, a recompensa fica disponível para ele resgatar no balcão de forma gratuita.

---

## 4. O Fluxo do Caixa (Como lançar uma venda)

1. O cliente chega no balcão e faz seu pedido.
2. Na hora de pagar, o cliente abre o celular, entra na "Área do Cliente" e fornece o **QR Code** dele.
3. O funcionário clica em **Escanear Cliente** no sistema, que carrega as informações do comprador.
4. O funcionário vai na tela **"Vender"** e seleciona a quantidade dos produtos que ele está comprando (`+` ou `-`).
5. Ao confirmar a compra, o sistema checa quais itens têm a marcação **"Conta Campanha"** e repassa os pontos direto para a conta que acabou de ser escaneada.

## 5. Áreas do Sistema
- **Vender**: Interface de caixa para lançar as compras.
- **Produtos**: Onde você cadastra o cardápio, com foto, preço e definições.
- **Funcionários**: Defina quem pode acessar o sistema no caixa e quem é gerente/admin.
- **Auditoria**: Extrato inalterável das transações. Útil para verificar que funcionário deu o ponto de qual venda para conferir a veracidade da transação.