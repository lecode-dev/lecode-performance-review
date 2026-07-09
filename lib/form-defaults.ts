import type { DimensionKey } from '@/lib/supabase/types'

type QuestionTemplate = {
  dimension: DimensionKey
  text: string
  text_en: string
  text_es: string
  order_index: number
  applies_to: 'self' | 'client'
}

const rows: { dimension: DimensionKey; text: string; text_en: string; text_es: string; order_index: number }[] = [
  // Competência Técnica
  {
    dimension: 'tech', order_index: 1,
    text:    'Escreve código legível, bem estruturado e seguindo padrões de boas práticas (SOLID, Clean Code, convenções do projeto).',
    text_en: 'Writes readable, well-structured code following best practices (SOLID, Clean Code, project conventions).',
    text_es: 'Escribe código legible, bien estructurado y siguiendo buenas prácticas del proyecto (SOLID, Clean Code, convenciones del proyecto).',
  },
  {
    dimension: 'tech', order_index: 2,
    text:    'Demonstra domínio da stack utilizada no projeto, entendendo impactos técnicos das decisões e propondo melhorias quando apropriado.',
    text_en: "Demonstrates command of the project's stack, understands the technical impact of decisions, and proposes improvements when appropriate.",
    text_es: 'Demuestra dominio del stack utilizado en el proyecto, entiende el impacto técnico de las decisiones y propone mejoras cuando corresponde.',
  },
  {
    dimension: 'tech', order_index: 3,
    text:    'Resolve problemas técnicos de forma eficiente, aplicando lógica de programação adequada e considerando performance e escalabilidade.',
    text_en: 'Solves technical problems efficiently, applying sound programming logic and considering performance and scalability.',
    text_es: 'Resuelve problemas técnicos de forma eficiente, aplicando lógica de programación adecuada y considerando el rendimiento y la escalabilidad.',
  },
  {
    dimension: 'tech', order_index: 4,
    text:    'Busca ativamente aprender novas tecnologias, acompanha tendências do mercado e aplica conhecimentos adquiridos no dia a dia.',
    text_en: 'Actively seeks to learn new technologies, follows market trends, and applies acquired knowledge day to day.',
    text_es: 'Busca activamente aprender nuevas tecnologías, sigue las tendencias del mercado y aplica los conocimientos adquiridos en el día a día.',
  },
  {
    dimension: 'tech', order_index: 5,
    text:    'Contribui ativamente para a qualidade do projeto através de code reviews construtivos, testes automatizados e refatorações.',
    text_en: 'Actively contributes to project quality through constructive code reviews, automated tests, and refactoring.',
    text_es: 'Contribuye activamente a la calidad del proyecto mediante code reviews constructivos, pruebas automatizadas y refactorizaciones.',
  },
  // Entrega e Resultados
  {
    dimension: 'delivery', order_index: 1,
    text:    'Cumpre prazos acordados de forma consistente, comunicando proativamente quando identifica riscos ou impedimentos.',
    text_en: 'Consistently meets agreed deadlines, proactively communicating when they identify risks or blockers.',
    text_es: 'Cumple los plazos acordados de forma consistente, comunicando proactivamente cuando identifica riesgos o impedimentos.',
  },
  {
    dimension: 'delivery', order_index: 2,
    text:    'Entrega funcionalidades completas, testadas e com baixo índice de bugs, atendendo aos critérios de aceitação definidos.',
    text_en: 'Delivers complete, tested features with a low bug rate, meeting the defined acceptance criteria.',
    text_es: 'Entrega funcionalidades completas, probadas y con baja tasa de errores, cumpliendo los criterios de aceptación definidos.',
  },
  {
    dimension: 'delivery', order_index: 3,
    text:    'Mantém produtividade adequada ao seu nível, demonstrando evolução na velocidade e qualidade das entregas ao longo do tempo.',
    text_en: 'Maintains productivity appropriate to their level, demonstrating improvement in speed and quality of delivery over time.',
    text_es: 'Mantiene una productividad acorde a su nivel, demostrando evolución en velocidad y calidad de las entregas a lo largo del tiempo.',
  },
  {
    dimension: 'delivery', order_index: 4,
    text:    'Demonstra comprometimento com os objetivos do projeto e da equipe, priorizando entregas de valor para o produto.',
    text_en: "Shows commitment to the project's and team's objectives, prioritizing high-value deliveries for the product.",
    text_es: 'Demuestra compromiso con los objetivos del proyecto y del equipo, priorizando entregas de valor para el producto.',
  },
  {
    dimension: 'delivery', order_index: 5,
    text:    'Mantém desempenho consistente ao longo do tempo, sem oscilações significativas de qualidade ou produtividade.',
    text_en: 'Maintains consistent performance over time, without significant swings in quality or productivity.',
    text_es: 'Mantiene un desempeño consistente a lo largo del tiempo, sin variaciones significativas de calidad o productividad.',
  },
  // Comunicação
  {
    dimension: 'comm', order_index: 1,
    text:    'Comunica-se de forma clara e objetiva, adaptando a linguagem ao público (técnico ou não-técnico) e contexto da situação.',
    text_en: 'Communicates clearly and objectively, adapting language to the audience (technical or non-technical) and situational context.',
    text_es: 'Se comunica de forma clara y objetiva, adaptando el lenguaje al público (técnico o no técnico) y al contexto de la situación.',
  },
  {
    dimension: 'comm', order_index: 2,
    text:    'Reporta proativamente o status das tarefas, antecipa riscos e comunica impedimentos antes que se tornem problemas críticos.',
    text_en: 'Proactively reports task status, anticipates risks, and flags blockers before they become critical issues.',
    text_es: 'Reporta proactivamente el estado de las tareas, anticipa riesgos y comunica impedimentos antes de que se vuelvan problemas críticos.',
  },
  {
    dimension: 'comm', order_index: 3,
    text:    'Recebe feedback de forma construtiva, demonstra abertura para críticas e implementa melhorias sugeridas.',
    text_en: 'Receives feedback constructively, shows openness to criticism, and implements suggested improvements.',
    text_es: 'Recibe el feedback de forma constructiva, muestra apertura a la crítica e implementa las mejoras sugeridas.',
  },
  {
    dimension: 'comm', order_index: 4,
    text:    'Produz documentação técnica clara e útil (READMEs, comentários no código, wikis), facilitando a manutenção e onboarding.',
    text_en: 'Produces clear, useful technical documentation (READMEs, code comments, wikis), easing maintenance and onboarding.',
    text_es: 'Produce documentación técnica clara y útil (READMEs, comentarios en el código, wikis), facilitando el mantenimiento y el onboarding.',
  },
  {
    dimension: 'comm', order_index: 5,
    text:    'Participa ativamente de reuniões, contribuindo com ideias relevantes, fazendo perguntas pertinentes e respeitando o tempo dos demais.',
    text_en: "Actively participates in meetings, contributing relevant ideas, asking pertinent questions, and respecting others' time.",
    text_es: 'Participa activamente en reuniones, aportando ideas relevantes, haciendo preguntas pertinentes y respetando el tiempo de los demás.',
  },
  // Colaboração
  {
    dimension: 'collab', order_index: 1,
    text:    'Trabalha bem em equipe, compartilhando conhecimento, participando de pair programming e contribuindo para o sucesso coletivo.',
    text_en: 'Works well in a team, shares knowledge, participates in pair programming, and contributes to collective success.',
    text_es: 'Trabaja bien en equipo, comparte conocimiento, participa en pair programming y contribuye al éxito colectivo.',
  },
  {
    dimension: 'collab', order_index: 2,
    text:    'Demonstra disposição genuína para ajudar colegas, oferecendo suporte técnico e mentoria quando solicitado ou quando percebe necessidade.',
    text_en: 'Shows genuine willingness to help colleagues, offering technical support and mentoring when asked or when they notice a need.',
    text_es: 'Muestra disposición genuina para ayudar a colegas, ofreciendo soporte técnico y mentoría cuando se le solicita o cuando percibe la necesidad.',
  },
  {
    dimension: 'collab', order_index: 3,
    text:    'Mantém atitude positiva e construtiva mesmo em situações desafiadoras, evitando comportamentos que prejudiquem o clima da equipe.',
    text_en: 'Keeps a positive, constructive attitude even in challenging situations, avoiding behaviors that harm team morale.',
    text_es: 'Mantiene una actitud positiva y constructiva incluso en situaciones difíciles, evitando comportamientos que afecten el clima del equipo.',
  },
  {
    dimension: 'collab', order_index: 4,
    text:    'Respeita decisões técnicas do time mesmo quando discorda, expressando opiniões de forma profissional e acatando o consenso.',
    text_en: "Respects the team's technical decisions even when disagreeing, expressing opinions professionally and accepting consensus.",
    text_es: 'Respeta las decisiones técnicas del equipo aun cuando no está de acuerdo, expresando opiniones de forma profesional y aceptando el consenso.',
  },
  {
    dimension: 'collab', order_index: 5,
    text:    'Contribui ativamente para um ambiente de trabalho saudável, inclusivo e psicologicamente seguro para todos os membros.',
    text_en: 'Actively contributes to a healthy, inclusive, and psychologically safe work environment for all members.',
    text_es: 'Contribuye activamente a un entorno de trabajo sano, inclusivo y psicológicamente seguro para todos los miembros.',
  },
  // Autonomia e Iniciativa
  {
    dimension: 'autonomy', order_index: 1,
    text:    'Trabalha de forma independente no nível esperado para seu cargo, buscando ajuda apenas quando realmente necessário.',
    text_en: 'Works independently at the level expected for their role, seeking help only when truly necessary.',
    text_es: 'Trabaja de forma independiente al nivel esperado para su puesto, buscando ayuda solo cuando realmente es necesario.',
  },
  {
    dimension: 'autonomy', order_index: 2,
    text:    'Identifica e resolve problemas proativamente, sem esperar que sejam reportados ou que alguém solicite a correção.',
    text_en: 'Identifies and resolves problems proactively, without waiting for them to be reported or for someone to request a fix.',
    text_es: 'Identifica y resuelve problemas proactivamente, sin esperar a que sean reportados o a que alguien solicite la corrección.',
  },
  {
    dimension: 'autonomy', order_index: 3,
    text:    'Propõe melhorias técnicas, de processo ou de produto de forma embasada, com argumentos claros sobre benefícios e impactos.',
    text_en: 'Proposes technical, process, or product improvements in a well-founded way, with clear arguments about benefits and impact.',
    text_es: 'Propone mejoras técnicas, de proceso o de producto de forma fundamentada, con argumentos claros sobre beneficios e impactos.',
  },
  {
    dimension: 'autonomy', order_index: 4,
    text:    'Voluntaria-se para assumir responsabilidades e desafios além do escopo básico, demonstrando interesse em crescer.',
    text_en: 'Volunteers to take on responsibilities and challenges beyond the basic scope, showing interest in growing.',
    text_es: 'Se ofrece para asumir responsabilidades y desafíos más allá del alcance básico, mostrando interés en crecer.',
  },
  {
    dimension: 'autonomy', order_index: 5,
    text:    'Gerencia bem seu tempo e tarefas, mantendo organização pessoal e cumprindo compromissos sem necessidade de microgerenciamento.',
    text_en: 'Manages time and tasks well, staying personally organized and meeting commitments without the need for micromanagement.',
    text_es: 'Gestiona bien su tiempo y sus tareas, mantiene organización personal y cumple compromisos sin necesidad de microgestión.',
  },
]

export const DEFAULT_QUESTIONS: QuestionTemplate[] = rows.flatMap((r) => [
  { ...r, applies_to: 'self' },
  { ...r, applies_to: 'client' },
])
