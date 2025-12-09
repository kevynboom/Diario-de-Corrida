# Diário de Corrida (Full-Stack .NET + JS)

## Sobre o Projeto
Este é um projeto full-stack simplificado que implementa um "Diário de Corrida" digital. A aplicação permite o registo e gestão (CRUD completo) de atividades físicas com foco em desempenho e histórico.

O objetivo é demonstrar a integração entre um backend .NET Web API e um frontend em JavaScript (Vanilla) de forma direta, utilizando SQLite como base de dados local.

## Funcionalidades
### 📊 Dashboard e Estatísticas
* **Visão Geral:** Cards com o total de corridas realizadas, distância total acumulada e pace médio geral de todas as atividades.
* **Cálculo Automático de Pace:** O sistema calcula o ritmo (min/km) automaticamente com base na distância e tempo inseridos.

### 🏃 Gestão de Corridas (CRUD)
* **Registar:** Criação de novos registos com validação de dados (impedindo datas futuras ou valores negativos).
* **Listar:** Visualização do histórico completo.
* **Editar:** Atualização de dados de corridas existentes (modo de edição com destaque visual).
* **Excluir:** Remoção de registos com confirmação de segurança.

### 🔍 Organização e Navegação
* **Filtros e Ordenação:** Permite ordenar a lista por **Data**, **Distância**, **Tempo** ou **Pace**, tanto em ordem crescente quanto decrescente.
* **Paginação:** O histórico é dividido em páginas (10 itens por página) para melhor performance e usabilidade.

### 🎨 Interface (UI/UX)
* **Design:** Interface moderna em Dark Mode.
* **Feedback Visual:** Mensagens de carregamento ("loading"), tratamento de erros e validação visual nos campos do formulário (bordas vermelhas para inputs inválidos).

## Tecnologias Utilizadas

**Backend:**
* .NET 8 (Web API)
* Entity Framework Core
* SQLite (Base de dados)
* Swagger / OpenAPI

**Frontend:**
* HTML5
* CSS3 (Flexbox, Grid, CSS Variables)
* JavaScript (ES6+, Fetch API, Manipulação de DOM)

---

## 1. Software Necessário (Pré-requisitos)
Garanta que tem instalado:
* [.NET SDK](https://dotnet.microsoft.com/download) (Versão 8.0).
* [Visual Studio Code](https://code.visualstudio.com/).

**Extensões do VSCode recomendadas:**
* C# Dev Kit.
* Live Server (de ritwickdey).
* SQLite Viewer (Opcional).

---

## 2. Configuração (Ajuste da Porta)
O frontend precisa saber em que porta o backend está a rodar para enviar os dados.

1.  **Descubra a Porta do Backend:**
    * Abra o terminal na pasta `backend`.
    * Execute `dotnet run`.
    * Observe a saída (ex: `Now listening on: http://localhost:5184`).

2.  **Atualize o Frontend:**
    * Abra o ficheiro `frontend/dashboard.js`.
    * Na primeira linha, altere a constante `API_CORRIDAS_URL` para a porta correta:
    ```javascript
    const API_CORRIDAS_URL = 'http://localhost:5184/api/Corridas';
    ```

---

## 3. Como Executar o Projeto

### A. Backend (API)
1.  Abra o terminal na pasta `backend`.
2.  (Se for a primeira vez ou após limpar o projeto) Recrie a base de dados:
    ```bash
    dotnet ef migrations add Initial
    dotnet ef database update
    ```
3.  Inicie o servidor:
    ```bash
    dotnet run
    ```
    *Mantenha este terminal aberto.*

### B. Frontend (Site)
1.  No VSCode, navegue até à pasta `frontend`.
2.  Clique com o botão direito em `dashboard.html`.
3.  Selecione **"Open with Live Server"**.

O navegador abrirá o painel de controlo e poderá gerir as suas corridas imediatamente.