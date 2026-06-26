-- ============================================================
-- 0010_performance_indexes.sql  –  Indexes para queries frequentes
-- ============================================================

-- reviews: filtradas por cycle_id + contractor_id em todas as pages de historico
CREATE INDEX IF NOT EXISTS idx_reviews_cycle_contractor ON reviews(cycle_id, contractor_id);

-- reviews: filtradas por author_id + status (badges do layout para client_rep)
CREATE INDEX IF NOT EXISTS idx_reviews_author_status ON reviews(author_id, status);

-- review_answers: sempre filtradas por review_id (JOIN em calculos de score)
CREATE INDEX IF NOT EXISTS idx_review_answers_review_id ON review_answers(review_id);

-- allocations: filtradas por contractor_id e por client_id + ended_on
CREATE INDEX IF NOT EXISTS idx_allocations_contractor ON allocations(contractor_id);
CREATE INDEX IF NOT EXISTS idx_allocations_client_active ON allocations(client_id, ended_on);

-- contractor_history: filtrada por cycle_id + contractor_id (dashboard admin)
CREATE INDEX IF NOT EXISTS idx_contractor_history_cycle ON contractor_history(cycle_id, contractor_id);

-- form_questions: filtradas por form_version_id (formulario de avaliacao)
CREATE INDEX IF NOT EXISTS idx_form_questions_version ON form_questions(form_version_id);

-- profiles: filtradas por client_id (paginas de client e admin)
CREATE INDEX IF NOT EXISTS idx_profiles_client ON profiles(client_id);

-- cycles: filtradas por status (busca de ciclo aberto no layout)
CREATE INDEX IF NOT EXISTS idx_cycles_status ON cycles(status);
