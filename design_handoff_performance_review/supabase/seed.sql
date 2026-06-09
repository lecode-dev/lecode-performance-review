-- =============================================================================
-- seed.sql · LeCode Performance Review
-- Dados de demonstração espelhando o protótipo (design/store.jsx).
--
-- NOTA: usuários reais vivem em auth.users (criados via Supabase Auth). Este seed
-- popula o domínio e o formulário. Para vincular profiles a contas de teste,
-- crie os usuários no Auth e use os mesmos UUIDs, ou rode assign_role() depois.
-- Aqui usamos UUIDs fixos p/ profiles de demo; ajuste conforme seu fluxo de Auth.
-- =============================================================================

-- ---- Formulário (versão 1, ativa) ----
insert into form_versions (id, version, self_weight, client_weight, is_active)
values ('00000000-0000-0000-0000-0000000000f1', 1, 0.30, 0.70, true);

insert into form_questions (form_version_id, dimension, position, text) values
-- Competência Técnica
('00000000-0000-0000-0000-0000000000f1','tech',1,'Escreve código legível, bem estruturado e seguindo boas práticas (SOLID, Clean Code, convenções do projeto).'),
('00000000-0000-0000-0000-0000000000f1','tech',2,'Demonstra domínio da stack, entende impactos técnicos das decisões e propõe melhorias quando apropriado.'),
('00000000-0000-0000-0000-0000000000f1','tech',3,'Resolve problemas técnicos de forma eficiente, considerando performance e escalabilidade.'),
('00000000-0000-0000-0000-0000000000f1','tech',4,'Busca aprender novas tecnologias, acompanha tendências e aplica conhecimentos no dia a dia.'),
('00000000-0000-0000-0000-0000000000f1','tech',5,'Contribui para a qualidade via code reviews construtivos, testes automatizados e refatorações.'),
-- Entrega e Resultados
('00000000-0000-0000-0000-0000000000f1','delivery',1,'Cumpre prazos acordados de forma consistente, comunicando proativamente riscos e impedimentos.'),
('00000000-0000-0000-0000-0000000000f1','delivery',2,'Entrega funcionalidades completas, testadas e com baixo índice de bugs, atendendo aos critérios de aceitação.'),
('00000000-0000-0000-0000-0000000000f1','delivery',3,'Mantém produtividade adequada ao nível, evoluindo em velocidade e qualidade ao longo do tempo.'),
('00000000-0000-0000-0000-0000000000f1','delivery',4,'Demonstra comprometimento com os objetivos do projeto, priorizando entregas de valor.'),
('00000000-0000-0000-0000-0000000000f1','delivery',5,'Mantém desempenho consistente, sem oscilações significativas de qualidade ou produtividade.'),
-- Comunicação
('00000000-0000-0000-0000-0000000000f1','comm',1,'Comunica-se de forma clara e objetiva, adaptando a linguagem ao público e contexto.'),
('00000000-0000-0000-0000-0000000000f1','comm',2,'Reporta proativamente o status, antecipa riscos e comunica impedimentos antes que virem problemas críticos.'),
('00000000-0000-0000-0000-0000000000f1','comm',3,'Recebe feedback de forma construtiva, com abertura para críticas, e implementa melhorias sugeridas.'),
('00000000-0000-0000-0000-0000000000f1','comm',4,'Produz documentação técnica clara e útil (READMEs, comentários, wikis), facilitando manutenção e onboarding.'),
('00000000-0000-0000-0000-0000000000f1','comm',5,'Participa ativamente de reuniões, contribui com ideias relevantes e respeita o tempo dos demais.'),
-- Colaboração
('00000000-0000-0000-0000-0000000000f1','collab',1,'Trabalha bem em equipe, compartilha conhecimento e contribui para o sucesso coletivo.'),
('00000000-0000-0000-0000-0000000000f1','collab',2,'Demonstra disposição genuína para ajudar colegas, oferecendo suporte técnico e mentoria.'),
('00000000-0000-0000-0000-0000000000f1','collab',3,'Mantém atitude positiva mesmo em situações desafiadoras, preservando o clima da equipe.'),
('00000000-0000-0000-0000-0000000000f1','collab',4,'Respeita decisões técnicas do time mesmo quando discorda, de forma profissional.'),
('00000000-0000-0000-0000-0000000000f1','collab',5,'Contribui para um ambiente de trabalho saudável, inclusivo e psicologicamente seguro.'),
-- Autonomia e Iniciativa
('00000000-0000-0000-0000-0000000000f1','autonomy',1,'Trabalha de forma independente no nível esperado para o cargo, buscando ajuda apenas quando necessário.'),
('00000000-0000-0000-0000-0000000000f1','autonomy',2,'Identifica e resolve problemas proativamente, sem esperar que sejam reportados.'),
('00000000-0000-0000-0000-0000000000f1','autonomy',3,'Propõe melhorias técnicas, de processo ou de produto de forma embasada.'),
('00000000-0000-0000-0000-0000000000f1','autonomy',4,'Voluntaria-se para assumir responsabilidades além do escopo básico, demonstrando interesse em crescer.'),
('00000000-0000-0000-0000-0000000000f1','autonomy',5,'Gerencia bem seu tempo e tarefas, sem necessidade de microgerenciamento.');

-- ---- Clientes ----
insert into clients (id, name, industry) values
('00000000-0000-0000-0000-0000000000c1','Fintrack','Fintech · Pagamentos'),
('00000000-0000-0000-0000-0000000000c2','Helsa Health','HealthTech'),
('00000000-0000-0000-0000-0000000000c3','RetailNova','E-commerce · Varejo');

-- ---- Ciclos (2 encerrados, 1 aberto) · janelas: dia 1 → 15 (envio) → fim do mês (apuração) ----
insert into cycles (id, label, starts_on, submit_ends_on, ends_on, status, closed_at) values
('00000000-0000-0000-0000-0000000000a1','Jul/2025','2025-07-01','2025-07-15','2025-07-31','closed','2025-08-01'),
('00000000-0000-0000-0000-0000000000a2','Jan/2026','2026-01-01','2026-01-15','2026-01-31','closed','2026-02-01'),
('00000000-0000-0000-0000-0000000000a3','Jun/2026','2026-06-01','2026-06-15','2026-06-30','open',null);

-- ---------------------------------------------------------------------------
-- PROFILES / CONTRACTORS / ALLOCATIONS
-- Descomente e ajuste os UUIDs para casar com auth.users reais.
-- Exemplo (1 admin, 1 rep, 1 contratado):
--
-- insert into profiles (id, full_name, email, role, client_id) values
--   ('<uuid-auth-admin>',  'Marcos Tavares','marcos@lecode.dev','lecode_admin', null),
--   ('<uuid-auth-rep>',    'Marina Alves', 'marina@fintrack.com','client_rep','00000000-0000-0000-0000-0000000000c1'),
--   ('<uuid-auth-dev>',    'Rafael Moreira','rafael@lecode.dev','contractor',  null);
--
-- insert into contractors (id, profile_id, role_title, track, seniority, started_on) values
--   ('00000000-0000-0000-0000-0000000000d1','<uuid-auth-dev>','Senior Frontend Engineer','Dev','Sênior','2024-02-01');
--
-- insert into allocations (contractor_id, client_id, started_on) values
--   ('00000000-0000-0000-0000-0000000000d1','00000000-0000-0000-0000-0000000000c1','2024-02-01');
-- ---------------------------------------------------------------------------
