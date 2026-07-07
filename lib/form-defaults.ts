import type { DimensionKey } from '@/lib/supabase/types'

type QuestionTemplate = {
  dimension: DimensionKey
  text: string
  order_index: number
  applies_to: 'self' | 'client'
}

const rows: { dimension: DimensionKey; text: string; order_index: number }[] = [
  // Competência Técnica
  { dimension: 'tech', order_index: 1, text: 'Escreve código legível, bem estruturado e seguindo padrões de boas práticas (SOLID, Clean Code, convenções do projeto).' },
  { dimension: 'tech', order_index: 2, text: 'Demonstra domínio da stack utilizada no projeto, entendendo impactos técnicos das decisões e propondo melhorias quando apropriado.' },
  { dimension: 'tech', order_index: 3, text: 'Resolve problemas técnicos de forma eficiente, aplicando lógica de programação adequada e considerando performance e escalabilidade.' },
  { dimension: 'tech', order_index: 4, text: 'Busca ativamente aprender novas tecnologias, acompanha tendências do mercado e aplica conhecimentos adquiridos no dia a dia.' },
  { dimension: 'tech', order_index: 5, text: 'Contribui ativamente para a qualidade do projeto através de code reviews construtivos, testes automatizados e refatorações.' },
  // Entrega e Resultados
  { dimension: 'delivery', order_index: 1, text: 'Cumpre prazos acordados de forma consistente, comunicando proativamente quando identifica riscos ou impedimentos.' },
  { dimension: 'delivery', order_index: 2, text: 'Entrega funcionalidades completas, testadas e com baixo índice de bugs, atendendo aos critérios de aceitação definidos.' },
  { dimension: 'delivery', order_index: 3, text: 'Mantém produtividade adequada ao seu nível, demonstrando evolução na velocidade e qualidade das entregas ao longo do tempo.' },
  { dimension: 'delivery', order_index: 4, text: 'Demonstra comprometimento com os objetivos do projeto e da equipe, priorizando entregas de valor para o produto.' },
  { dimension: 'delivery', order_index: 5, text: 'Mantém desempenho consistente ao longo do tempo, sem oscilações significativas de qualidade ou produtividade.' },
  // Comunicação
  { dimension: 'comm', order_index: 1, text: 'Comunica-se de forma clara e objetiva, adaptando a linguagem ao público (técnico ou não-técnico) e contexto da situação.' },
  { dimension: 'comm', order_index: 2, text: 'Reporta proativamente o status das tarefas, antecipa riscos e comunica impedimentos antes que se tornem problemas críticos.' },
  { dimension: 'comm', order_index: 3, text: 'Recebe feedback de forma construtiva, demonstra abertura para críticas e implementa melhorias sugeridas.' },
  { dimension: 'comm', order_index: 4, text: 'Produz documentação técnica clara e útil (READMEs, comentários no código, wikis), facilitando a manutenção e onboarding.' },
  { dimension: 'comm', order_index: 5, text: 'Participa ativamente de reuniões, contribuindo com ideias relevantes, fazendo perguntas pertinentes e respeitando o tempo dos demais.' },
  // Colaboração
  { dimension: 'collab', order_index: 1, text: 'Trabalha bem em equipe, compartilhando conhecimento, participando de pair programming e contribuindo para o sucesso coletivo.' },
  { dimension: 'collab', order_index: 2, text: 'Demonstra disposição genuína para ajudar colegas, oferecendo suporte técnico e mentoria quando solicitado ou quando percebe necessidade.' },
  { dimension: 'collab', order_index: 3, text: 'Mantém atitude positiva e construtiva mesmo em situações desafiadoras, evitando comportamentos que prejudiquem o clima da equipe.' },
  { dimension: 'collab', order_index: 4, text: 'Respeita decisões técnicas do time mesmo quando discorda, expressando opiniões de forma profissional e acatando o consenso.' },
  { dimension: 'collab', order_index: 5, text: 'Contribui ativamente para um ambiente de trabalho saudável, inclusivo e psicologicamente seguro para todos os membros.' },
  // Autonomia e Iniciativa
  { dimension: 'autonomy', order_index: 1, text: 'Trabalha de forma independente no nível esperado para seu cargo, buscando ajuda apenas quando realmente necessário.' },
  { dimension: 'autonomy', order_index: 2, text: 'Identifica e resolve problemas proativamente, sem esperar que sejam reportados ou que alguém solicite a correção.' },
  { dimension: 'autonomy', order_index: 3, text: 'Propõe melhorias técnicas, de processo ou de produto de forma embasada, com argumentos claros sobre benefícios e impactos.' },
  { dimension: 'autonomy', order_index: 4, text: 'Voluntaria-se para assumir responsabilidades e desafios além do escopo básico, demonstrando interesse em crescer.' },
  { dimension: 'autonomy', order_index: 5, text: 'Gerencia bem seu tempo e tarefas, mantendo organização pessoal e cumprindo compromissos sem necessidade de microgerenciamento.' },
]

export const DEFAULT_QUESTIONS: QuestionTemplate[] = rows.flatMap((r) => [
  { ...r, applies_to: 'self' },
  { ...r, applies_to: 'client' },
])
