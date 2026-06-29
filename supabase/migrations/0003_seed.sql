-- ============================================================
-- 0003_seed.sql  –  Dados de demo (dev/test only)
-- Nota: os auth.users reais precisam ser criados pelo Supabase Auth
-- antes de rodar este seed. Execute via supabase db seed.
-- ============================================================

-- ─── Demo clients ────────────────────────────────────────────
insert into clients (id, name, slug) values
  ('c1000000-0000-0000-0000-000000000001', 'Acme Corp',   'acme'),
  ('c1000000-0000-0000-0000-000000000002', 'Globotech',   'globotech')
on conflict (id) do nothing;

-- ─── Demo cycle ──────────────────────────────────────────────
insert into cycles (id, name, status, opens_at, closes_at) values
  ('ca000000-0000-0000-0000-000000000001', 'Q2 2026', 'open', '2026-04-01', '2026-06-30')
on conflict (id) do nothing;

-- ─── Demo form version ───────────────────────────────────────
insert into form_versions (id, cycle_id, self_weight, client_weight) values
  ('fa000000-0000-0000-0000-000000000001', 'ca000000-0000-0000-0000-000000000001', 0.30, 0.70)
on conflict (id) do nothing;

-- ─── Perguntas (mesmas para self e client) ───────────────────
-- Cada pergunta é inserida duas vezes: uma para self, outra para client.
insert into form_questions (form_version_id, dimension, text, order_index, applies_to) values
  -- tech
  ('fa000000-0000-0000-0000-000000000001','tech','Escreve código legível, bem estruturado e seguindo padrões de boas práticas (SOLID, Clean Code, convenções do projeto).',1,'self'),
  ('fa000000-0000-0000-0000-000000000001','tech','Escreve código legível, bem estruturado e seguindo padrões de boas práticas (SOLID, Clean Code, convenções do projeto).',1,'client'),
  ('fa000000-0000-0000-0000-000000000001','tech','Demonstra domínio da stack utilizada no projeto, entendendo impactos técnicos das decisões e propondo melhorias quando apropriado.',2,'self'),
  ('fa000000-0000-0000-0000-000000000001','tech','Demonstra domínio da stack utilizada no projeto, entendendo impactos técnicos das decisões e propondo melhorias quando apropriado.',2,'client'),
  ('fa000000-0000-0000-0000-000000000001','tech','Resolve problemas técnicos de forma eficiente, aplicando lógica de programação adequada e considerando performance e escalabilidade.',3,'self'),
  ('fa000000-0000-0000-0000-000000000001','tech','Resolve problemas técnicos de forma eficiente, aplicando lógica de programação adequada e considerando performance e escalabilidade.',3,'client'),
  ('fa000000-0000-0000-0000-000000000001','tech','Busca ativamente aprender novas tecnologias, acompanha tendências do mercado e aplica conhecimentos adquiridos no dia a dia.',4,'self'),
  ('fa000000-0000-0000-0000-000000000001','tech','Busca ativamente aprender novas tecnologias, acompanha tendências do mercado e aplica conhecimentos adquiridos no dia a dia.',4,'client'),
  ('fa000000-0000-0000-0000-000000000001','tech','Contribui ativamente para a qualidade do projeto através de code reviews construtivos, testes automatizados e refatorações.',5,'self'),
  ('fa000000-0000-0000-0000-000000000001','tech','Contribui ativamente para a qualidade do projeto através de code reviews construtivos, testes automatizados e refatorações.',5,'client'),
  -- delivery
  ('fa000000-0000-0000-0000-000000000001','delivery','Cumpre prazos acordados de forma consistente, comunicando proativamente quando identifica riscos ou impedimentos.',1,'self'),
  ('fa000000-0000-0000-0000-000000000001','delivery','Cumpre prazos acordados de forma consistente, comunicando proativamente quando identifica riscos ou impedimentos.',1,'client'),
  ('fa000000-0000-0000-0000-000000000001','delivery','Entrega funcionalidades completas, testadas e com baixo índice de bugs, atendendo aos critérios de aceitação definidos.',2,'self'),
  ('fa000000-0000-0000-0000-000000000001','delivery','Entrega funcionalidades completas, testadas e com baixo índice de bugs, atendendo aos critérios de aceitação definidos.',2,'client'),
  ('fa000000-0000-0000-0000-000000000001','delivery','Mantém produtividade adequada ao seu nível, demonstrando evolução na velocidade e qualidade das entregas ao longo do tempo.',3,'self'),
  ('fa000000-0000-0000-0000-000000000001','delivery','Mantém produtividade adequada ao seu nível, demonstrando evolução na velocidade e qualidade das entregas ao longo do tempo.',3,'client'),
  ('fa000000-0000-0000-0000-000000000001','delivery','Demonstra comprometimento com os objetivos do projeto e da equipe, priorizando entregas de valor para o produto.',4,'self'),
  ('fa000000-0000-0000-0000-000000000001','delivery','Demonstra comprometimento com os objetivos do projeto e da equipe, priorizando entregas de valor para o produto.',4,'client'),
  ('fa000000-0000-0000-0000-000000000001','delivery','Mantém desempenho consistente ao longo do tempo, sem oscilações significativas de qualidade ou produtividade.',5,'self'),
  ('fa000000-0000-0000-0000-000000000001','delivery','Mantém desempenho consistente ao longo do tempo, sem oscilações significativas de qualidade ou produtividade.',5,'client'),
  -- comm
  ('fa000000-0000-0000-0000-000000000001','comm','Comunica-se de forma clara e objetiva, adaptando a linguagem ao público (técnico ou não-técnico) e contexto da situação.',1,'self'),
  ('fa000000-0000-0000-0000-000000000001','comm','Comunica-se de forma clara e objetiva, adaptando a linguagem ao público (técnico ou não-técnico) e contexto da situação.',1,'client'),
  ('fa000000-0000-0000-0000-000000000001','comm','Reporta proativamente o status das tarefas, antecipa riscos e comunica impedimentos antes que se tornem problemas críticos.',2,'self'),
  ('fa000000-0000-0000-0000-000000000001','comm','Reporta proativamente o status das tarefas, antecipa riscos e comunica impedimentos antes que se tornem problemas críticos.',2,'client'),
  ('fa000000-0000-0000-0000-000000000001','comm','Recebe feedback de forma construtiva, demonstra abertura para críticas e implementa melhorias sugeridas.',3,'self'),
  ('fa000000-0000-0000-0000-000000000001','comm','Recebe feedback de forma construtiva, demonstra abertura para críticas e implementa melhorias sugeridas.',3,'client'),
  ('fa000000-0000-0000-0000-000000000001','comm','Produz documentação técnica clara e útil (READMEs, comentários no código, wikis), facilitando a manutenção e onboarding.',4,'self'),
  ('fa000000-0000-0000-0000-000000000001','comm','Produz documentação técnica clara e útil (READMEs, comentários no código, wikis), facilitando a manutenção e onboarding.',4,'client'),
  ('fa000000-0000-0000-0000-000000000001','comm','Participa ativamente de reuniões, contribuindo com ideias relevantes, fazendo perguntas pertinentes e respeitando o tempo dos demais.',5,'self'),
  ('fa000000-0000-0000-0000-000000000001','comm','Participa ativamente de reuniões, contribuindo com ideias relevantes, fazendo perguntas pertinentes e respeitando o tempo dos demais.',5,'client'),
  -- collab
  ('fa000000-0000-0000-0000-000000000001','collab','Trabalha bem em equipe, compartilhando conhecimento, participando de pair programming e contribuindo para o sucesso coletivo.',1,'self'),
  ('fa000000-0000-0000-0000-000000000001','collab','Trabalha bem em equipe, compartilhando conhecimento, participando de pair programming e contribuindo para o sucesso coletivo.',1,'client'),
  ('fa000000-0000-0000-0000-000000000001','collab','Demonstra disposição genuína para ajudar colegas, oferecendo suporte técnico e mentoria quando solicitado ou quando percebe necessidade.',2,'self'),
  ('fa000000-0000-0000-0000-000000000001','collab','Demonstra disposição genuína para ajudar colegas, oferecendo suporte técnico e mentoria quando solicitado ou quando percebe necessidade.',2,'client'),
  ('fa000000-0000-0000-0000-000000000001','collab','Mantém atitude positiva e construtiva mesmo em situações desafiadoras, evitando comportamentos que prejudiquem o clima da equipe.',3,'self'),
  ('fa000000-0000-0000-0000-000000000001','collab','Mantém atitude positiva e construtiva mesmo em situações desafiadoras, evitando comportamentos que prejudiquem o clima da equipe.',3,'client'),
  ('fa000000-0000-0000-0000-000000000001','collab','Respeita decisões técnicas do time mesmo quando discorda, expressando opiniões de forma profissional e acatando o consenso.',4,'self'),
  ('fa000000-0000-0000-0000-000000000001','collab','Respeita decisões técnicas do time mesmo quando discorda, expressando opiniões de forma profissional e acatando o consenso.',4,'client'),
  ('fa000000-0000-0000-0000-000000000001','collab','Contribui ativamente para um ambiente de trabalho saudável, inclusivo e psicologicamente seguro para todos os membros.',5,'self'),
  ('fa000000-0000-0000-0000-000000000001','collab','Contribui ativamente para um ambiente de trabalho saudável, inclusivo e psicologicamente seguro para todos os membros.',5,'client'),
  -- autonomy
  ('fa000000-0000-0000-0000-000000000001','autonomy','Trabalha de forma independente no nível esperado para seu cargo, buscando ajuda apenas quando realmente necessário.',1,'self'),
  ('fa000000-0000-0000-0000-000000000001','autonomy','Trabalha de forma independente no nível esperado para seu cargo, buscando ajuda apenas quando realmente necessário.',1,'client'),
  ('fa000000-0000-0000-0000-000000000001','autonomy','Identifica e resolve problemas proativamente, sem esperar que sejam reportados ou que alguém solicite a correção.',2,'self'),
  ('fa000000-0000-0000-0000-000000000001','autonomy','Identifica e resolve problemas proativamente, sem esperar que sejam reportados ou que alguém solicite a correção.',2,'client'),
  ('fa000000-0000-0000-0000-000000000001','autonomy','Propõe melhorias técnicas, de processo ou de produto de forma embasada, com argumentos claros sobre benefícios e impactos.',3,'self'),
  ('fa000000-0000-0000-0000-000000000001','autonomy','Propõe melhorias técnicas, de processo ou de produto de forma embasada, com argumentos claros sobre benefícios e impactos.',3,'client'),
  ('fa000000-0000-0000-0000-000000000001','autonomy','Voluntaria-se para assumir responsabilidades e desafios além do escopo básico, demonstrando interesse em crescer.',4,'self'),
  ('fa000000-0000-0000-0000-000000000001','autonomy','Voluntaria-se para assumir responsabilidades e desafios além do escopo básico, demonstrando interesse em crescer.',4,'client'),
  ('fa000000-0000-0000-0000-000000000001','autonomy','Gerencia bem seu tempo e tarefas, mantendo organização pessoal e cumprindo compromissos sem necessidade de microgerenciamento.',5,'self'),
  ('fa000000-0000-0000-0000-000000000001','autonomy','Gerencia bem seu tempo e tarefas, mantendo organização pessoal e cumprindo compromissos sem necessidade de microgerenciamento.',5,'client')
on conflict do nothing;
