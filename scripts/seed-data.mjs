import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://pwadgofokyteldlerodb.supabase.co'
const SERVICE_KEY = process.argv[2] || process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SERVICE_KEY) { console.error('Passe a service_role key como argumento'); process.exit(1) }

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const CONTRACTORS = [
  { name: 'Lucas Ferreira',   email: 'lucas.ferreira@lecode.dev',   seniority: 'Senior', track: 'Dev' },
  { name: 'Ana Rodrigues',    email: 'ana.rodrigues@lecode.dev',    seniority: 'Pleno',  track: 'Dev' },
  { name: 'Pedro Almeida',    email: 'pedro.almeida@lecode.dev',    seniority: 'Junior', track: 'Dev' },
  { name: 'Mariana Costa',    email: 'mariana.costa@lecode.dev',    seniority: 'Senior', track: 'Project' },
  { name: 'Rafael Oliveira',  email: 'rafael.oliveira@lecode.dev',  seniority: 'Pleno',  track: 'Dev' },
]

const DIMENSIONS = ['tech', 'delivery', 'comm', 'collab', 'autonomy']

const SELF_QUESTIONS = [
  { dim: 'tech',      texts: ['Como avalio minha competência técnica?', 'Como avalio a qualidade do meu código?', 'Como avalio minha capacidade de resolver problemas complexos?', 'Como avalio meu domínio das tecnologias do projeto?', 'Como avalio minha evolução técnica no período?'] },
  { dim: 'delivery',  texts: ['Como avalio meu cumprimento de prazos?', 'Como avalio minha produtividade?', 'Como avalio a qualidade das minhas entregas?', 'Como avalio minha organização de tarefas?', 'Como avalio minha consistência de entrega?'] },
  { dim: 'comm',      texts: ['Como avalio minha comunicação com a equipe?', 'Como avalio minha proatividade em reportar status?', 'Como avalio a clareza da minha documentação?', 'Como avalio minha participação em reuniões?', 'Como avalio minha receptividade a feedback?'] },
  { dim: 'collab',    texts: ['Como avalio minha colaboração com colegas?', 'Como avalio meu suporte a outros membros?', 'Como avalio minha atitude em equipe?', 'Como avalio minha disposição para code review?', 'Como avalio minha contribuição em decisões coletivas?'] },
  { dim: 'autonomy',  texts: ['Como avalio minha autonomia na resolução de problemas?', 'Como avalio minha proatividade em melhorias?', 'Como avalio minha capacidade de tomar decisões?', 'Como avalio minha iniciativa em propor soluções?', 'Como avalio minha independência no dia a dia?'] },
]

const CLIENT_QUESTIONS = [
  { dim: 'tech',      texts: ['Competência técnica do contratado?', 'Qualidade do código entregue?', 'Resolução de problemas técnicos?', 'Domínio das tecnologias utilizadas?', 'Evolução técnica percebida?'] },
  { dim: 'delivery',  texts: ['Cumprimento dos prazos acordados?', 'Produtividade geral?', 'Qualidade das entregas?', 'Organização e priorização?', 'Consistência nas entregas?'] },
  { dim: 'comm',      texts: ['Comunicação sobre andamento?', 'Proatividade em reportar bloqueios?', 'Clareza na documentação?', 'Participação em cerimônias?', 'Receptividade a feedback?'] },
  { dim: 'collab',    texts: ['Trabalho em equipe?', 'Suporte a outros membros?', 'Postura colaborativa?', 'Engajamento em revisões?', 'Contribuição em decisões?'] },
  { dim: 'autonomy',  texts: ['Autonomia na resolução?', 'Proatividade em melhorias?', 'Capacidade de decisão?', 'Iniciativa em soluções?', 'Independência operacional?'] },
]

function randScore() {
  const weights = [0.05, 0.15, 0.30, 0.35, 0.15]
  const r = Math.random()
  let cum = 0
  for (let i = 0; i < weights.length; i++) {
    cum += weights[i]
    if (r <= cum) return i + 1
  }
  return 4
}

function genScoresForContractor(baseSkill) {
  const offsets = { tech: 0, delivery: 0.1, comm: -0.1, collab: 0, autonomy: 0.05 }
  const scores = {}
  for (const dim of DIMENSIONS) {
    scores[dim] = []
    for (let i = 0; i < 5; i++) {
      let s = baseSkill + (Math.random() - 0.5) * 2 + (offsets[dim] || 0)
      s = Math.max(1, Math.min(5, Math.round(s)))
      scores[dim].push(s)
    }
  }
  return scores
}

const OPEN_TEXTS = [
  { strengths: 'Forte em resolução de problemas e comunicação assertiva.', growth: 'Pode melhorar documentação técnica.', extra: 'Tem se destacado no time.' },
  { strengths: 'Código limpo e bem estruturado, boa organização.', growth: 'Precisa ser mais proativo em reuniões.', extra: 'Entrega consistente.' },
  { strengths: 'Muito colaborativo e sempre disponível para ajudar.', growth: 'Autonomia nas decisões técnicas pode crescer.', extra: 'Evolução visível.' },
  { strengths: 'Entrega rápida e com qualidade, domínio técnico alto.', growth: 'Comunicação com stakeholders pode melhorar.', extra: 'Excelente performance.' },
  { strengths: 'Boa gestão de tempo e priorização de tarefas.', growth: 'Pode explorar mais tecnologias novas.', extra: 'Profissional confiável.' },
]

async function main() {
  console.log('🔧 Populando banco com dados de teste...\n')

  // 1. Get existing client (Acme Corp)
  const { data: acme } = await admin.from('clients').select('id').eq('slug', 'acme').single()
  if (!acme) { console.error('❌ Cliente Acme não encontrado. Rode o seed básico primeiro.'); process.exit(1) }
  const clientId = acme.id
  console.log('✔ Cliente: Acme Corp (' + clientId + ')')

  // 2. Get client rep
  const { data: clientRep } = await admin.from('profiles').select('id').eq('email', 'cliente@lecode.dev').single()
  if (!clientRep) { console.error('❌ Client rep não encontrado.'); process.exit(1) }
  console.log('✔ Client rep: cliente@lecode.dev')

  // 3. Create 5 contractors
  const contractorIds = []
  for (const c of CONTRACTORS) {
    const { data: existing } = await admin.from('profiles').select('id').eq('email', c.email).single()
    if (existing) {
      contractorIds.push(existing.id)
      console.log('⏭ ' + c.name + ' já existe')
      continue
    }

    const { data: authUser, error: authErr } = await admin.auth.admin.createUser({
      email: c.email, password: '123456', email_confirm: true,
      user_metadata: { full_name: c.name },
      app_metadata: { role: 'contractor' },
    })
    if (authErr) { console.error('❌ ' + c.email + ': ' + authErr.message); continue }

    const uid = authUser.user.id
    contractorIds.push(uid)

    await admin.from('profiles').update({ full_name: c.name, email: c.email }).eq('id', uid)
    await admin.from('contractors').upsert({ id: uid, seniority: c.seniority, track: c.track, since: '2025-01' })

    // Allocate to Acme
    await admin.from('allocations').insert({ contractor_id: uid, client_id: clientId, started_on: '2025-01-01' })
    console.log('✔ ' + c.name + ' criado e alocado')
  }

  console.log('\n📋 ' + contractorIds.length + ' contractors prontos\n')

  // 4. Ensure we have closed cycles with history
  const closedCycleNames = ['Q3 2025', 'Q4 2025', 'Q1 2026']

  // Check existing cycles
  const { data: existingCycles } = await admin.from('cycles').select('id, name, status')
  const existingNames = new Set((existingCycles ?? []).map(c => c.name))

  const allCycles = []

  for (const name of closedCycleNames) {
    if (existingNames.has(name)) {
      const c = existingCycles.find(c => c.name === name)
      allCycles.push(c)
      console.log('⏭ Ciclo ' + name + ' já existe (' + c.status + ')')
      continue
    }

    const quarter = parseInt(name.split('Q')[1])
    const year = parseInt(name.split(' ')[1])
    const month = (quarter - 1) * 3 + 1
    const opensAt = year + '-' + String(month).padStart(2, '0') + '-01'
    const closesAt = year + '-' + String(month + 2).padStart(2, '0') + '-28'

    const { data: cycle, error } = await admin.from('cycles').insert({
      name, status: 'closed', opens_at: opensAt, closes_at: closesAt, closed_at: new Date().toISOString(),
    }).select('id, name, status').single()

    if (error) { console.error('❌ Ciclo ' + name + ': ' + error.message); continue }
    allCycles.push(cycle)

    // Create form version
    await admin.from('form_versions').insert({ cycle_id: cycle.id, self_weight: 0.30, client_weight: 0.70 })
    console.log('✔ Ciclo ' + name + ' criado (closed)')
  }

  // Ensure Q2 2026 exists and is open
  let openCycle = existingCycles?.find(c => c.name === 'Q2 2026')
  if (!openCycle) {
    const { data: oc } = await admin.from('cycles').insert({
      name: 'Q2 2026', status: 'open', opens_at: '2026-04-01', closes_at: '2026-06-28',
    }).select('id, name, status').single()
    openCycle = oc
    await admin.from('form_versions').insert({ cycle_id: oc.id, self_weight: 0.30, client_weight: 0.70 })
    console.log('✔ Ciclo Q2 2026 criado (open)')
  } else {
    console.log('⏭ Ciclo Q2 2026 já existe (' + openCycle.status + ')')
  }

  // 5. Add questions to all form versions that don't have them
  for (const cycle of [...allCycles, openCycle]) {
    if (!cycle) continue
    const { data: fv } = await admin.from('form_versions').select('id').eq('cycle_id', cycle.id).single()
    if (!fv) continue

    const { data: existingQs } = await admin.from('form_questions').select('id').eq('form_version_id', fv.id)
    if (existingQs?.length >= 25) continue

    console.log('📝 Adicionando perguntas ao ciclo ' + cycle.name + '...')
    const questions = []
    for (const group of SELF_QUESTIONS) {
      group.texts.forEach((text, i) => {
        questions.push({ form_version_id: fv.id, dimension: group.dim, text, order_index: i + 1, applies_to: 'self' })
      })
    }
    for (const group of CLIENT_QUESTIONS) {
      group.texts.forEach((text, i) => {
        questions.push({ form_version_id: fv.id, dimension: group.dim, text, order_index: i + 1, applies_to: 'client' })
      })
    }
    await admin.from('form_questions').insert(questions)
  }

  // 6. Create reviews + answers for closed cycles
  const skillLevels = [4.2, 3.5, 2.8, 4.6, 3.8] // base skill per contractor

  for (const cycle of allCycles) {
    if (!cycle || cycle.status !== 'closed') continue

    const { data: fv } = await admin.from('form_versions').select('id, self_weight, client_weight').eq('cycle_id', cycle.id).single()
    if (!fv) continue

    const { data: selfQs } = await admin.from('form_questions').select('id, dimension').eq('form_version_id', fv.id).eq('applies_to', 'self')
    const { data: clientQs } = await admin.from('form_questions').select('id, dimension').eq('form_version_id', fv.id).eq('applies_to', 'client')

    if (!selfQs?.length || !clientQs?.length) continue

    console.log('\n📊 Populando reviews para ' + cycle.name + '...')

    for (let ci = 0; ci < contractorIds.length; ci++) {
      const cId = contractorIds[ci]
      const texts = OPEN_TEXTS[ci % OPEN_TEXTS.length]

      // Check if reviews already exist
      const { data: existingReviews } = await admin.from('reviews').select('id, type')
        .eq('cycle_id', cycle.id).eq('contractor_id', cId)
      if (existingReviews?.length >= 2) {
        console.log('  ⏭ ' + CONTRACTORS[ci].name + ' já tem reviews')
        continue
      }

      // Self review
      const { data: selfReview } = await admin.from('reviews').upsert({
        cycle_id: cycle.id, contractor_id: cId, type: 'self', author_id: cId,
        status: 'submitted', submitted_at: new Date().toISOString(),
        strengths: texts.strengths, growth: texts.growth, extra: texts.extra,
      }, { onConflict: 'cycle_id,contractor_id,type' }).select('id').single()

      // Client review
      const { data: clientReview } = await admin.from('reviews').upsert({
        cycle_id: cycle.id, contractor_id: cId, type: 'client', author_id: clientRep.id,
        status: 'submitted', submitted_at: new Date().toISOString(),
        strengths: 'Profissional dedicado e competente.', growth: 'Pode assumir mais responsabilidades.',
        extra: 'Recomendo para projetos futuros.',
      }, { onConflict: 'cycle_id,contractor_id,type' }).select('id').single()

      if (!selfReview || !clientReview) continue

      // Self answers
      const selfScores = genScoresForContractor(skillLevels[ci] - 0.2)
      const selfAnswers = selfQs.map(q => ({
        review_id: selfReview.id, question_id: q.id,
        score: selfScores[q.dimension]?.pop() || 3,
      }))
      await admin.from('review_answers').upsert(selfAnswers, { onConflict: 'review_id,question_id' })

      // Client answers
      const clientScores = genScoresForContractor(skillLevels[ci])
      const clientAnswerRows = clientQs.map(q => ({
        review_id: clientReview.id, question_id: q.id,
        score: clientScores[q.dimension]?.pop() || 3,
      }))
      await admin.from('review_answers').upsert(clientAnswerRows, { onConflict: 'review_id,question_id' })

      // Calculate averages and snapshot
      const selfAvg = selfQs.reduce((sum, q) => sum + (selfScores[q.dimension]?.length != null ? selfAnswers.find(a => a.question_id === q.id)?.score || 3 : 3), 0) / selfQs.length
      const clientAvg = clientQs.reduce((sum, q) => sum + (clientAnswerRows.find(a => a.question_id === q.id)?.score || 3), 0) / clientQs.length
      const finalScore = Math.round((selfAvg * fv.self_weight + clientAvg * fv.client_weight) * 100) / 100

      await admin.from('contractor_history').upsert({
        cycle_id: cycle.id, contractor_id: cId,
        self_avg: Math.round(selfAvg * 100) / 100,
        client_avg: Math.round(clientAvg * 100) / 100,
        final_score: finalScore,
        self_weight: fv.self_weight, client_weight: fv.client_weight,
      }, { onConflict: 'cycle_id,contractor_id' })

      console.log('  ✔ ' + CONTRACTORS[ci].name + ' → self:' + selfAvg.toFixed(1) + ' client:' + clientAvg.toFixed(1) + ' final:' + finalScore.toFixed(2))
    }
  }

  // 7. Create partial reviews for open cycle (Q2 2026)
  if (openCycle) {
    const { data: fv } = await admin.from('form_versions').select('id').eq('cycle_id', openCycle.id).single()
    if (fv) {
      const { data: selfQs } = await admin.from('form_questions').select('id, dimension').eq('form_version_id', fv.id).eq('applies_to', 'self')
      const { data: clientQs } = await admin.from('form_questions').select('id, dimension').eq('form_version_id', fv.id).eq('applies_to', 'client')

      console.log('\n📝 Populando ciclo aberto Q2 2026...')

      for (let ci = 0; ci < Math.min(3, contractorIds.length); ci++) {
        const cId = contractorIds[ci]

        const { data: existing } = await admin.from('reviews').select('id').eq('cycle_id', openCycle.id).eq('contractor_id', cId)
        if (existing?.length) { console.log('  ⏭ ' + CONTRACTORS[ci].name + ' já tem reviews no ciclo aberto'); continue }

        // Self review - submitted for first 2, draft for 3rd
        const isSubmitted = ci < 2
        const { data: selfReview } = await admin.from('reviews').insert({
          cycle_id: openCycle.id, contractor_id: cId, type: 'self', author_id: cId,
          status: isSubmitted ? 'submitted' : 'draft',
          submitted_at: isSubmitted ? new Date().toISOString() : null,
          strengths: isSubmitted ? OPEN_TEXTS[ci].strengths : null,
          growth: isSubmitted ? OPEN_TEXTS[ci].growth : null,
        }).select('id').single()

        if (selfReview && selfQs) {
          const scores = genScoresForContractor(skillLevels[ci])
          const answers = selfQs.map(q => ({
            review_id: selfReview.id, question_id: q.id,
            score: scores[q.dimension]?.pop() || 3,
          }))
          await admin.from('review_answers').upsert(answers, { onConflict: 'review_id,question_id' })
        }

        // Client review - submitted for first one only
        if (ci === 0) {
          const { data: clientReview } = await admin.from('reviews').insert({
            cycle_id: openCycle.id, contractor_id: cId, type: 'client', author_id: clientRep.id,
            status: 'submitted', submitted_at: new Date().toISOString(),
            strengths: 'Excelente profissional, proativo e dedicado.',
            growth: 'Pode liderar mais iniciativas técnicas.',
          }).select('id').single()

          if (clientReview && clientQs) {
            const scores = genScoresForContractor(skillLevels[ci])
            const answers = clientQs.map(q => ({
              review_id: clientReview.id, question_id: q.id,
              score: scores[q.dimension]?.pop() || 3,
            }))
            await admin.from('review_answers').upsert(answers, { onConflict: 'review_id,question_id' })
          }
        }

        console.log('  ✔ ' + CONTRACTORS[ci].name + (isSubmitted ? ' (self submitted)' : ' (self draft)') + (ci === 0 ? ' + client submitted' : ''))
      }
    }
  }

  console.log('\n✅ Seed completo!\n')
  console.log('📊 Dados criados:')
  console.log('   • 5 contractors com perfis e alocações')
  console.log('   • 3 ciclos fechados com reviews completas (self + client)')
  console.log('   • 1 ciclo aberto com reviews parciais')
  console.log('   • Histórico de scores por ciclo')
  console.log('   • 50 perguntas por ciclo (25 self + 25 client)')
  console.log('\n🔑 Credenciais dos contractors:')
  for (const c of CONTRACTORS) console.log('   ' + c.email + ' / 123456')
}

main().catch(err => { console.error('Erro fatal:', err); process.exit(1) })
