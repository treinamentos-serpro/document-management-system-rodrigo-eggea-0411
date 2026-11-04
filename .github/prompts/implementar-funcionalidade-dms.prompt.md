---
description: Implementa uma funcionalidade do DMS alinhada à especificação do projeto.
name: implementar-funcionalidade-dms
argument-hint: descreva a funcionalidade ou mudança desejada
agent: agent
---

# Implementar funcionalidade do DMS

Implemente a seguinte demanda no Document Management System:

`${input:demanda:descreva a funcionalidade ou mudança desejada}`

Antes de editar:

- Consulte `docs/specs/dms-spec.md` como contrato funcional e `/.github/copilot-instructions.md` para as convenções do repositório.
- Inspecione os módulos e testes próximos à funcionalidade para identificar o ponto de extensão existente.
- Se a demanda conflitar com a especificação ou exigir uma decisão que ela não define, explicite a divergência e escolha a alternativa compatível de menor escopo; não altere a especificação por conta própria.

Regras de implementação:

- Faça somente as mudanças necessárias à demanda; preserve APIs e comportamentos existentes que não precisem mudar.
- No backend, siga o fluxo `routes -> controllers -> services -> repositories`. Mantenha validação HTTP nos controllers, regras de negócio nos services e persistência nos repositories.
- Arquivos enviados devem permanecer no filesystem local em `backend/storage`, usando `multer` com `diskStorage`. Metadados permanecem em memória. Não adicione armazenamento em nuvem, serviços externos ou dependências sem necessidade justificada.
- No frontend, use React funcional com hooks, organize responsabilidades em `components/`, `pages/` e `services/`, e centralize chamadas ao backend via `fetch` com prefixo `/api`.
- Preserve os contratos da especificação, incluindo cabeçalho `X-User-Id`, formato de erros e isolamento de documentos por proprietário quando aplicável.
- Use nomes de símbolos em inglês e mensagens ao usuário/comentários em português. Evite duplicação, abstrações desnecessárias e alterações não relacionadas.
- Não crie nem altere arquivos fora do escopo solicitado, exceto testes diretamente necessários.

Validação e conclusão:

- Adicione ou ajuste testes focados seguindo os testes e ferramentas já existentes. Não introduza um novo framework de testes.
- Execute a validação mais específica disponível para a área alterada; use `npm --prefix backend test` para o backend e `npm --prefix frontend run build` para o frontend quando aplicável.
- Corrija falhas causadas pela mudança e repita a validação relevante. Se uma validação não puder ser executada, informe o motivo.
- Ao concluir, resuma o comportamento implementado, os arquivos alterados e os comandos de validação executados.