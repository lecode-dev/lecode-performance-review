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

-- ─── Perguntas Self-review ────────────────────────────────────
insert into form_questions (form_version_id, dimension, text, order_index, applies_to) values
  -- tech
  ('fa000000-0000-0000-0000-000000000001','tech',     'Aplico boas práticas de código (SOLID, Clean Code)?',                  1,'self'),
  ('fa000000-0000-0000-0000-000000000001','tech',     'Entrego código com cobertura de testes adequada?',                      2,'self'),
  ('fa000000-0000-0000-0000-000000000001','tech',     'Demonstro domínio das tecnologias do projeto?',                         3,'self'),
  ('fa000000-0000-0000-0000-000000000001','tech',     'Resolvo problemas técnicos complexos de forma eficaz?',                 4,'self'),
  ('fa000000-0000-0000-0000-000000000001','tech',     'Proponho melhorias técnicas proativamente?',                            5,'self'),
  -- delivery
  ('fa000000-0000-0000-0000-000000000001','delivery', 'Cumpro os prazos acordados consistentemente?',                          1,'self'),
  ('fa000000-0000-0000-0000-000000000001','delivery', 'Estimo tarefas com precisão?',                                         2,'self'),
  ('fa000000-0000-0000-0000-000000000001','delivery', 'Antecipo impedimentos e comunico cedo?',                                3,'self'),
  ('fa000000-0000-0000-0000-000000000001','delivery', 'Mantenho qualidade de entrega mesmo sob pressão?',                     4,'self'),
  ('fa000000-0000-0000-0000-000000000001','delivery', 'Finalizo o que começo sem deixar débitos abertos?',                    5,'self'),
  -- comm
  ('fa000000-0000-0000-0000-000000000001','comm',     'Comunico status e bloqueios de forma clara e proativa?',                1,'self'),
  ('fa000000-0000-0000-0000-000000000001','comm',     'Escrevo documentação e comentários úteis?',                            2,'self'),
  ('fa000000-0000-0000-0000-000000000001','comm',     'Adapto minha linguagem ao perfil do interlocutor?',                    3,'self'),
  ('fa000000-0000-0000-0000-000000000001','comm',     'Ouço ativamente e incorporo feedbacks?',                               4,'self'),
  ('fa000000-0000-0000-0000-000000000001','comm',     'Facilito reuniões e discussões técnicas com objetividade?',            5,'self'),
  -- collab
  ('fa000000-0000-0000-0000-000000000001','collab',   'Apoio colegas e compartilho conhecimento ativamente?',                  1,'self'),
  ('fa000000-0000-0000-0000-000000000001','collab',   'Faço revisões de código construtivas e tempestivas?',                  2,'self'),
  ('fa000000-0000-0000-0000-000000000001','collab',   'Contribuo para um ambiente de trabalho positivo e inclusivo?',         3,'self'),
  ('fa000000-0000-0000-0000-000000000001','collab',   'Alinhos expectativas com stakeholders antes de executar?',             4,'self'),
  ('fa000000-0000-0000-0000-000000000001','collab',   'Trabalho bem em times distribuídos e assíncronos?',                    5,'self'),
  -- autonomy
  ('fa000000-0000-0000-0000-000000000001','autonomy', 'Tomo decisões técnicas sem depender de aprovação constante?',          1,'self'),
  ('fa000000-0000-0000-0000-000000000001','autonomy', 'Aprendo e aplico tecnologias novas com velocidade?',                   2,'self'),
  ('fa000000-0000-0000-0000-000000000001','autonomy', 'Identifico e executo melhorias de processo sem ser solicitado?',       3,'self'),
  ('fa000000-0000-0000-0000-000000000001','autonomy', 'Gerencio meu próprio tempo e prioridades com eficácia?',               4,'self'),
  ('fa000000-0000-0000-0000-000000000001','autonomy', 'Mantenho foco em atividades de alto impacto?',                         5,'self')
on conflict do nothing;

-- ─── Perguntas Client-review ──────────────────────────────────
insert into form_questions (form_version_id, dimension, text, order_index, applies_to) values
  -- tech
  ('fa000000-0000-0000-0000-000000000001','tech',     'O contratado aplica boas práticas de código?',                         1,'client'),
  ('fa000000-0000-0000-0000-000000000001','tech',     'O contratado entrega código testável e de qualidade?',                 2,'client'),
  ('fa000000-0000-0000-0000-000000000001','tech',     'O contratado domina as tecnologias do projeto?',                       3,'client'),
  ('fa000000-0000-0000-0000-000000000001','tech',     'O contratado resolve problemas técnicos de forma eficaz?',             4,'client'),
  ('fa000000-0000-0000-0000-000000000001','tech',     'O contratado propõe melhorias técnicas proativamente?',                5,'client'),
  -- delivery
  ('fa000000-0000-0000-0000-000000000001','delivery', 'O contratado cumpre os prazos acordados?',                             1,'client'),
  ('fa000000-0000-0000-0000-000000000001','delivery', 'O contratado estima tarefas com precisão?',                           2,'client'),
  ('fa000000-0000-0000-0000-000000000001','delivery', 'O contratado antecipa impedimentos e comunica cedo?',                  3,'client'),
  ('fa000000-0000-0000-0000-000000000001','delivery', 'O contratado mantém qualidade sob pressão?',                          4,'client'),
  ('fa000000-0000-0000-0000-000000000001','delivery', 'O contratado finaliza o que começa?',                                  5,'client'),
  -- comm
  ('fa000000-0000-0000-0000-000000000001','comm',     'O contratado comunica status claramente?',                             1,'client'),
  ('fa000000-0000-0000-0000-000000000001','comm',     'O contratado documenta seu trabalho adequadamente?',                   2,'client'),
  ('fa000000-0000-0000-0000-000000000001','comm',     'O contratado adapta a linguagem ao contexto?',                        3,'client'),
  ('fa000000-0000-0000-0000-000000000001','comm',     'O contratado ouve e incorpora feedbacks?',                            4,'client'),
  ('fa000000-0000-0000-0000-000000000001','comm',     'O contratado facilita discussões técnicas?',                          5,'client'),
  -- collab
  ('fa000000-0000-0000-0000-000000000001','collab',   'O contratado apoia a equipe e compartilha conhecimento?',              1,'client'),
  ('fa000000-0000-0000-0000-000000000001','collab',   'O contratado realiza revisões de código de qualidade?',               2,'client'),
  ('fa000000-0000-0000-0000-000000000001','collab',   'O contratado contribui para ambiente de trabalho positivo?',           3,'client'),
  ('fa000000-0000-0000-0000-000000000001','collab',   'O contratado alinha expectativas com stakeholders?',                   4,'client'),
  ('fa000000-0000-0000-0000-000000000001','collab',   'O contratado trabalha bem em times distribuídos?',                    5,'client'),
  -- autonomy
  ('fa000000-0000-0000-0000-000000000001','autonomy', 'O contratado toma decisões autônomas com segurança?',                 1,'client'),
  ('fa000000-0000-0000-0000-000000000001','autonomy', 'O contratado aprende novas tecnologias rapidamente?',                 2,'client'),
  ('fa000000-0000-0000-0000-000000000001','autonomy', 'O contratado melhora processos sem ser solicitado?',                  3,'client'),
  ('fa000000-0000-0000-0000-000000000001','autonomy', 'O contratado gerencia bem seu tempo e prioridades?',                  4,'client'),
  ('fa000000-0000-0000-0000-000000000001','autonomy', 'O contratado mantém foco em atividades de alto impacto?',             5,'client')
on conflict do nothing;
