alter table form_questions
  add column if not exists text_en text,
  add column if not exists text_es text;
