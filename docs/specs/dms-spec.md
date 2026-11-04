# Especificação - Document Management System

## 1. Objetivo

Entregar uma aplicação web que permita a um usuário enviar, listar e baixar seus documentos, mantendo os arquivos no filesystem local e os metadados em memória.

## 2. Escopo

### Dentro do escopo

- Upload de um documento por requisição.
- Listagem dos documentos associados ao usuário da requisição.
- Download de um documento pelo identificador, limitado ao usuário proprietário.
- Identificação simples do proprietário por um identificador enviado pelo cliente.
- Interface web React para executar os fluxos de upload, listagem e download.
- Armazenamento de arquivos em `backend/storage`, com `multer` e `diskStorage`.
- Armazenamento dos metadados em memória durante a execução do backend.

### Fora do escopo

- Armazenamento em nuvem, banco de dados ou qualquer serviço externo.
- Autenticação, autorização baseada em credenciais, cadastro de usuários ou recuperação de senha.
- Versionamento, edição, exclusão, compartilhamento, busca ou categorização de documentos.
- Upload de múltiplos arquivos em uma única requisição.
- Recuperação automática dos metadados após reiniciar o backend.
- Garantia de persistência dos metadados entre reinicializações.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O usuário pode enviar um arquivo por vez usando o campo multipart `file`. |
| RF-02 | O sistema valida a presença do arquivo e rejeita uploads que excedam o limite configurado. |
| RF-03 | O sistema grava o conteúdo do arquivo em `backend/storage` usando `multer` com `diskStorage`; não deve manter o conteúdo completo do arquivo em memória. |
| RF-04 | O sistema atribui ao documento um identificador único e um nome interno de armazenamento que não depende do nome original enviado pelo cliente. |
| RF-05 | O sistema registra os metadados do documento em memória após o upload ser gravado com sucesso. |
| RF-06 | O usuário pode listar somente os documentos associados ao seu identificador de proprietário. Uma lista sem documentos retorna sucesso com uma coleção vazia. |
| RF-07 | O usuário pode baixar um documento pelo identificador se o documento existir e pertencer a ele. O download deve ser enviado como anexo usando o nome original para apresentação ao usuário. |
| RF-08 | O sistema não revela se um identificador de documento existe quando o documento não pertence ao usuário solicitante; nesses casos, responde como não encontrado. |
| RF-09 | A interface permite selecionar e enviar um arquivo, exibir o resultado ou erro, apresentar os documentos do usuário e iniciar o download de um documento listado. |
| RF-10 | A interface apresenta estados de carregamento e mensagens de erro para falhas de upload, listagem ou download, sem perder a possibilidade de tentar novamente. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | O backend é implementado em Node.js e Express, em CommonJS; o frontend usa React e Vite em ES modules. |
| RNF-02 | O armazenamento dos arquivos é estritamente local, em `backend/storage`, por meio de `multer` com `diskStorage`. Não usar provedores ou serviços de armazenamento externos. |
| RNF-03 | Os metadados permanecem em memória. Uma reinicialização do backend perde o índice de metadados; arquivos locais remanescentes não são reconstruídos nem removidos automaticamente nesta fase. |
| RNF-04 | Configurações operacionais, como porta, diretório de armazenamento e limite de upload, devem ser obtidas de variáveis de ambiente, com valores padrão documentados. |
| RNF-05 | O limite padrão de upload é 10 MiB (10.485.760 bytes) e pode ser alterado por `MAX_FILE_SIZE_BYTES`. O backend deve rejeitar arquivos maiores com HTTP 413. |
| RNF-06 | Na ausência de configuração, o backend escuta na porta 3000 e grava em `backend/storage`, resolvendo o caminho a partir do diretório da aplicação, não do diretório de trabalho atual. |
| RNF-07 | O frontend chama a API pelo prefixo `/api`; em desenvolvimento, o proxy do Vite remove esse prefixo e encaminha a chamada ao backend local. |
| RNF-08 | Erros da API têm formato JSON uniforme e não expõem caminhos locais, stack traces ou detalhes internos. |
| RNF-09 | O código backend mantém dependências direcionadas `routes -> controllers -> services -> repositories`; regras de negócio não dependem de Express ou de detalhes da interface. |
| RNF-10 | A identidade por cabeçalho descrita nesta especificação é apenas uma convenção para a primeira fase, não um mecanismo de autenticação ou uma fronteira de segurança para produção. |

## 5. Identidade e modelo de dados

### Identidade do usuário

As três operações de documentos exigem o cabeçalho `X-User-Id`. Seu valor é tratado como um identificador opaco, após remoção de espaços nas extremidades, e deve conter de 1 a 128 caracteres. Cabeçalho ausente ou inválido resulta em HTTP 400. O cliente deve enviar o mesmo identificador nas operações de upload, listagem e download.

Como esta fase não implementa autenticação, o cliente pode declarar qualquer identificador. Portanto, o isolamento por `owner` é funcional para separar os dados enviados por clientes cooperativos, mas não protege contra falsificação de identidade. A autenticação fica explicitamente fora do escopo.

### Metadados do documento

| Campo | Tipo | Exposição | Descrição |
| --- | --- | --- | --- |
| `id` | string | API e interno | Identificador único, gerado pelo servidor. |
| `originalName` | string | API e interno | Nome original fornecido pelo cliente, usado apenas para exibição e nome do download. Nunca é usado como caminho de gravação. |
| `size` | number | API e interno | Tamanho do arquivo em bytes, informado pelo armazenamento após o upload. |
| `uploadedAt` | string | API e interno | Instante de conclusão do upload em formato ISO 8601 UTC. |
| `owner` | string | API e interno | Valor validado de `X-User-Id` que enviou o arquivo. |
| `storageName` | string | Somente interno | Nome gerado pelo servidor para localizar o arquivo dentro do diretório de armazenamento. Não deve conter caminho fornecido pelo cliente. |

O repositório mantém os registros em memória, indexados por `id`. Respostas públicas não incluem `storageName` nem caminhos do filesystem. O campo multipart `file` pode conter qualquer tipo de arquivo nesta fase; não há allowlist de extensões ou tipos MIME.

## 6. Contratos de API

### Convenções

- As rotas públicas são descritas com o prefixo `/api`, usado pelo frontend e pelo proxy do Vite. No Express, as rotas correspondentes são `/upload`, `/documents` e `/documents/:id/download` depois do rewrite do proxy.
- `Content-Type` para respostas de erro e metadados: `application/json; charset=utf-8`.
- Erro padrão: `{ "error": { "code": "string", "message": "string" } }`.
- Todas as rotas abaixo exigem `X-User-Id`.

### `POST /api/upload`

Envia um arquivo e cria os metadados do documento.

- Entrada: `multipart/form-data` com exatamente um campo de arquivo chamado `file`.
- Limite: valor de `MAX_FILE_SIZE_BYTES`, padrão de 10 MiB.
- Sucesso: HTTP 201 e o objeto público do documento.

```json
{
  "id": "uuid",
  "originalName": "relatorio.pdf",
  "size": 24576,
  "uploadedAt": "2026-11-04T12:00:00.000Z",
  "owner": "usuario-123"
}
```

- HTTP 400 `INVALID_USER_ID`: cabeçalho ausente ou inválido.
- HTTP 400 `FILE_REQUIRED`: campo `file` ausente.
- HTTP 400 `INVALID_UPLOAD`: corpo multipart inválido ou quantidade de arquivos não permitida.
- HTTP 413 `FILE_TOO_LARGE`: arquivo acima do limite configurado.
- HTTP 500 `UPLOAD_FAILED`: falha inesperada ao gravar arquivo ou registrar metadados. O sistema deve tentar remover o arquivo gravado se não conseguir concluir o registro.

### `GET /api/documents`

Lista os documentos do proprietário identificado no cabeçalho.

- Entrada: sem corpo.
- Sucesso: HTTP 200, coleção ordenada por `uploadedAt` decrescente.

```json
{
  "documents": [
    {
      "id": "uuid",
      "originalName": "relatorio.pdf",
      "size": 24576,
      "uploadedAt": "2026-11-04T12:00:00.000Z",
      "owner": "usuario-123"
    }
  ]
}
```

Uma lista vazia é representada por `{ "documents": [] }`. Cabeçalho ausente ou inválido resulta em HTTP 400 `INVALID_USER_ID`.

### `GET /api/documents/:id/download`

Transfere o conteúdo do documento como anexo.

- Entrada: `id` no caminho e `X-User-Id` no cabeçalho; sem corpo.
- Sucesso: HTTP 200 com o conteúdo binário, `Content-Disposition: attachment` e um nome de download derivado de `originalName` com tratamento apropriado para header HTTP.
- HTTP 400 `INVALID_USER_ID`: cabeçalho ausente ou inválido.
- HTTP 404 `DOCUMENT_NOT_FOUND`: documento inexistente, de outro proprietário ou cujo arquivo não está disponível. A resposta não distingue esses casos.
- HTTP 500 `DOWNLOAD_FAILED`: erro inesperado de leitura ou transferência, sem detalhes internos na resposta.

## 7. Decisões arquiteturais

### Backend

- `routes/`: registra endpoints, aplica o middleware de upload e encaminha requisições. O middleware de `multer` configura `diskStorage`, valida o campo `file` e aplica o limite de tamanho.
- `controllers/`: lê parâmetros, cabeçalhos, arquivo recebido e estado HTTP; valida a entrada do limite HTTP e converte o resultado do caso de uso em resposta HTTP. Não contém regras de negócio nem acessa diretamente o filesystem.
- `services/`: coordena upload, listagem e download; aplica as regras de proprietário, cria os metadados e trata a consistência entre arquivo e registro.
- `repositories/`: mantém o índice de metadados em memória e fornece operações necessárias para gravar/localizar/ler/remover arquivos no diretório local. Detalhes de filesystem ficam atrás desta camada.
- `app.js`: compõe middleware, rotas e endpoint de saúde existente. A rota `GET /health` continua disponível e retorna `{ "status": "ok" }`.

O middleware de upload grava o arquivo local antes do controller. O fluxo de serviço deve registrar os metadados apenas após a gravação bem-sucedida e tentar limpar o arquivo se a criação do registro falhar. Controllers não importam repositórios; services não conhecem objetos `req`/`res`.

### Frontend

- Componentes React são organizados nas áreas existentes de `components/`, `pages/` e `services/` conforme a responsabilidade.
- Um serviço de API centraliza chamadas `fetch` ao prefixo `/api` e envia o mesmo `X-User-Id` nas operações. Como não há login nesta fase, a origem desse identificador deve ser simples e consistente e não deve ser apresentada como autenticação.
- A interface fornece seleção de arquivo, envio, listagem e ação de download. Erros HTTP são interpretados pelo contrato JSON; respostas binárias de download não são tratadas como JSON.
- O proxy de desenvolvimento já configurado no Vite encaminha `/api` para `http://localhost:3000` e remove o prefixo antes de enviar a chamada.

### Armazenamento e consistência

- O diretório `backend/storage` deve existir ou ser criado antes do upload; falta de permissão ou falha de escrita resulta em erro controlado.
- O nome físico é gerado pelo servidor e não reutiliza o nome original. A transferência não usa um caminho vindo da requisição.
- Como os metadados são voláteis, reiniciar o backend torna os arquivos anteriores inacessíveis pela API, embora possam permanecer no disco. Reconstrução, limpeza e retenção automática desses arquivos não fazem parte desta fase.

## 8. Critérios de aceite

- Um upload válido responde 201, cria um arquivo em `backend/storage` e retorna metadados sem expor o nome físico ou caminho local.
- Um upload sem arquivo responde 400; um arquivo maior que o limite configurado responde 413.
- A listagem retorna somente registros com `owner` correspondente ao cabeçalho e retorna coleção vazia quando não houver registros.
- O proprietário consegue baixar o conteúdo original; outro identificador recebe 404.
- Cabeçalho de usuário ausente ou inválido é rejeitado pelas rotas de documentos.
- Erros da API seguem o formato comum e não expõem stack traces nem caminhos locais.
- A interface consegue enviar, listar e baixar arquivos pela API `/api`, comunicando estados de sucesso, carregamento e falha.
- O endpoint `/health` continua respondendo com status saudável.

## 9. Plano de execução

Etapas planejadas para implementação futura. Esta especificação não executa nem altera arquivos de backend ou frontend.

1. Definir e validar configuração do backend: porta, caminho absoluto de `backend/storage` e `MAX_FILE_SIZE_BYTES`, mantendo `/health`.
2. Implementar o repositório de metadados em memória e as operações locais de arquivo, com geração segura de nomes físicos e tratamento de falhas.
3. Implementar middleware `multer` com `diskStorage`, campo único `file`, limite configurável e tratamento de erros de upload.
4. Implementar serviços para upload, listagem e download, incluindo escopo por proprietário e compensação de arquivo em caso de falha ao registrar metadados.
5. Implementar controllers e rotas HTTP com os contratos, status e formato de erro especificados.
6. Adicionar testes backend com `node:test` para sucesso, validações, limite de tamanho, isolamento por proprietário, download, falhas de armazenamento e preservação de `/health`.
7. Implementar no frontend o serviço de API e a interface para enviar, listar e baixar, usando `/api` e o mesmo identificador de usuário.
8. Validar o build do frontend e o fluxo integrado entre Vite e backend; revisar critérios de aceite e documentação operacional.
