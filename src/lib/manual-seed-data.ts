// Conteúdo do Manual Operativo de Balcão Volto Drive — v1.1 consolidada (09 março 2026)
// Estruturado a partir do PDF original. Cada artigo contém HTML rich-text pronto para Tiptap.

export type SeedArticle = {
  title: string;
  content: string;
};

export type SeedCategory = {
  name: string;
  description?: string;
  color?: string;
  order: number;
  articles: SeedArticle[];
};

export const manualSeed: { categories: SeedCategory[] } = {
  categories: [
    {
      name: "Princípios e gestão diária",
      description: "Princípios operativos, modelo de gestão e abertura do balcão",
      color: "#2e3c8f",
      order: 1,
      articles: [
        {
          title: "1. Princípios operativos da Volto Drive",
          content: `<p>A operação de balcão da Volto Drive assenta em <strong>cinco princípios</strong>: serviço impecável, decisão rápida, disciplina documental, controlo diário da frota e registo digital de tudo o que impacta o cliente ou a viatura.</p>
<ul>
<li><strong>Serviço premium:</strong> o cliente não chega apenas para levantar ou devolver um carro; chega a um destino e deve sentir acompanhamento imediato, claro e seguro.</li>
<li><strong>Operação programável:</strong> o dia deve ser planeado com base em pickups, drop-offs, stock e picos de carga administrativa.</li>
<li><strong>Transparência total:</strong> inspeções, danos, valores cobrados e decisões devem ser explicados ao cliente no momento em que acontecem.</li>
<li><strong>Execução no balcão:</strong> sempre que possível, o balcão resolve sem depender da sede; a sede entra em exceção, escalada e decisões de frota.</li>
<li><strong>Registo obrigatório:</strong> tudo o que não estiver registado no sistema ou no canal definido é considerado <em>não executado</em>.</li>
</ul>
<blockquote><strong>Regra-mãe de operação.</strong> Na dúvida entre rapidez e falta de controlo, a equipa deve escolher um processo simples mas auditável. A consistência é mais valiosa do que improvisações não documentadas.</blockquote>`,
        },
        {
          title: "2. Modelo diário de gestão do balcão",
          content: `<p>O gestor do balcão começa o dia a planear carga, equipa, janelas de pausa e prioridades. A gestão do dia <strong>não é reativa</strong>; é uma rotina de leitura do negócio e de organização operacional.</p>
<h3>Cadência mínima de controlo diário</h3>
<ul>
<li><strong>Abertura (AM)</strong> — Ler trabalho previsto do dia e identificar picos. Saída esperada: plano do dia, distribuição de tarefas e alertas.</li>
<li><strong>Meio do dia</strong> — Revalidar desvios, atrasos, falta de carros e equipas. Saída esperada: ajuste de pausas, lavagens e prioridades.</li>
<li><strong>Fecho / final do dia</strong> — Validar no-shows, não devoluções e pendências. Saída esperada: lista de ação, contactos a clientes e pendências para sede.</li>
</ul>
<ul>
<li>Em <strong>época intermédia e baixa</strong>: AM, almoço e fecho são obrigatórios.</li>
<li>Em <strong>época alta</strong>: pode ser necessário acompanhar picos ao longo do dia em janelas de 2 horas, sobretudo quando a base estiver a operar perto da red line.</li>
<li>O resumo operacional deve estar sempre visível: parede, ecrã ou dashboard dedicado no sistema.</li>
</ul>`,
        },
        {
          title: "3. Abertura do balcão e dashboard diário",
          content: `<p>Na abertura, o gestor ou operador sénior deve consultar o quadro diário e validar se a operação consegue cumprir o serviço prometido nas horas seguintes.</p>
<h3>Dashboard diário obrigatório</h3>
<ul>
<li><strong>Pickups do dia</strong> — Carga de entregas prevista. Ação: distribuir equipa, preparar contratos e inspeções.</li>
<li><strong>Drop-offs do dia</strong> — Carga de devoluções prevista. Ação: reservar janelas de inspeção e parque.</li>
<li><strong>Stock disponível</strong> — Capacidade real de cumprimento. Ação: confirmar carros prontos, limpos e com autonomia.</li>
<li><strong>Contratos em atraso de devolução</strong> — Risco de indisponibilidade. Ação: contactar clientes e avaliar extensões.</li>
<li><strong>Contratos em atraso de pickup</strong> — No-show potencial. Ação: libertar capacidade após decisão.</li>
<li><strong>Picos por faixa horária</strong> — Risco de fila e sobrecarga. Ação: reposicionar equipa e pausas.</li>
</ul>
<blockquote><strong>Ponto vindo da reunião de 05 março.</strong> O dashboard deve ser simples no arranque: pickups, drop-offs e stock. Depois poderá evoluir para visão por blocos horários. A informação vem do sistema; o trabalho é torná-la visível e accionável.</blockquote>
<h3>Checklist de abertura</h3>
<ul>
<li>Abrir WWM e confirmar pickups, drop-offs e stock do dia.</li>
<li>Validar contratos em atraso de devolução e pickups não realizados.</li>
<li>Confirmar viaturas prontas: limpas, carregadas/abastecidas e sem bloqueios.</li>
<li>Verificar se há reservas de última hora (8-24h) relevantes.</li>
<li>Distribuir responsáveis por pickup, drop-off, parque e atendimento.</li>
<li>Confirmar TPA/multibanco, tablet de inspeção, scanner e telefone.</li>
<li>Confirmar que a pasta física e o portal interno estão acessíveis.</li>
</ul>`,
        },
      ],
    },
    {
      name: "Atendimento e pickup",
      description: "Script base de atendimento e processo completo de levantamento de viatura",
      color: "#f29220",
      order: 2,
      articles: [
        {
          title: "4. Atendimento ao cliente e script base",
          content: `<p>O atendimento deve ser <strong>curto, cordial e orientado a desbloquear a operação</strong>. A equipa não deve criar discurso excessivo; deve criar confiança e avançar.</p>
<h3>Script base por momento de contacto</h3>
<ul>
<li><strong>Chegada ao balcão</strong> — Receber e identificar.<br><em>"Bom dia, bem-vindo à Volto Drive. Tem reserva connosco?"</em></li>
<li><strong>Cliente que regressa / devolução</strong> — Agradecer e abrir conversa de serviço.<br><em>"Obrigado por voltar. Correu tudo bem com a viagem e com a viatura?"</em></li>
<li><strong>Explicação de extras broker</strong> — Enquadrar diferença de produto.<br><em>"Esta reserva vem por broker; vou explicar o que já está incluído e o que pode ser adicionado."</em></li>
<li><strong>Explicação de dano</strong> — Ser transparente e concreto.<br><em>"Este dano não constava da inspeção inicial; está aqui fotografado e o valor aplicável é este."</em></li>
<li><strong>Encerramento</strong> — Fechar de forma positiva.<br><em>"Obrigado por escolher a Volto Drive. Ficamos à disposição para a próxima reserva."</em></li>
</ul>
<ul>
<li>A primeira pergunta operacional é sempre: <strong>o cliente tem reserva ou não tem reserva?</strong></li>
<li>A segunda leitura é: <strong>a reserva é direta Volto Drive ou broker?</strong></li>
<li>O discurso muda; o processo nuclear de validação, inspeção, pagamento e entrega volta a convergir.</li>
</ul>`,
        },
        {
          title: "5. Processo completo de pickup — cliente com reserva",
          content: `<p>O pickup só termina quando o cliente está validado, a viatura está associada, o contrato está fechado no sistema e o cliente percebeu o estado da viatura e as condições do serviço.</p>
<h3>Fluxograma de pickup com reserva</h3>
<ol>
<li>Cliente chega e é recebido no balcão.</li>
<li>Confirmar nome, reserva e origem da reserva.</li>
<li>Abrir reserva no WWM.</li>
<li>Verificar se documentação está completa e válida.</li>
<li>Validar ou carregar documentação em falta.</li>
<li>Verificar pagamento, caução ou pendências.</li>
<li>Confirmar viatura atribuída e inspeção prévia.</li>
<li>Apresentar estado da viatura e fotografias.</li>
<li>Assinar contrato e concluir entrega.</li>
</ol>
<blockquote><strong>Decisão: Reserva é broker?</strong><br><strong>SIM</strong> → Explicar coberturas, depósito e extras aplicáveis antes da assinatura.<br><strong>NÃO</strong> → Avançar sem upselling desnecessário; manter apenas extras realmente necessários.</blockquote>`,
        },
        {
          title: "5.1 Origem da reserva — direta vs broker",
          content: `<p>A identificação de origem deve ser <strong>evidente no sistema</strong>. Reservas broker devem ter discurso específico; reservas diretas devem privilegiar simplicidade e zero fricção.</p>
<ul>
<li><strong>Reserva direta Volto Drive:</strong> evitar painéis de upselling irrelevantes; manter apenas extras obrigatórios ou efetivamente úteis.</li>
<li><strong>Reserva broker:</strong> explicar o que a reserva inclui, o que não inclui e quais são as regras de danos, depósito e coberturas externas.</li>
<li>Quando a reserva vier com cobertura contratada no broker, essa cobertura <strong>não substitui automaticamente</strong> obrigações financeiras perante a Volto Drive.</li>
</ul>`,
        },
        {
          title: "5.2 Documentação obrigatória",
          content: `<ul>
<li>Documento de identificação <strong>original e físico</strong>.</li>
<li>Carta de condução <strong>original e física</strong>.</li>
<li>Dados do titular e contacto telefónico válidos.</li>
<li>Método de pagamento aceite pela política em vigor.</li>
<li>Fotografia/digitalização dos documentos para a plataforma, <strong>nunca retenção informal fora do sistema</strong>.</li>
</ul>
<blockquote><strong>Regra operacional.</strong> A reserva não avança apenas com cópias enviadas anteriormente. O operador tem de ver os documentos fisicamente e registar o resultado na plataforma.</blockquote>`,
        },
        {
          title: "5.3 Captura documental e fotografia do cliente",
          content: `<p>Sempre que a configuração técnica o permita, a captura deve ser feita <strong>diretamente por câmara/tablet</strong> para upload imediato. Se não for possível, utiliza-se scanner e upload subsequente. A política pretendida é <em>digital-only capture</em>, com o mínimo de passos locais.</p>
<ul>
<li>Sempre carregar os documentos na plataforma.</li>
<li>Não guardar cópias avulsas no balcão, desktop local ou impressões não controladas.</li>
<li>Sempre que definido pela política interna, recolher fotografia do cliente para reforço de identificação e trilho de auditoria.</li>
</ul>`,
        },
        {
          title: "5.4 Pagamento, libertação da viatura e email de confirmação",
          content: `<p>Antes de libertar a viatura, o operador deve confirmar se a reserva já está paga, se existe caução ou depósito aplicável e se há qualquer bloqueio de faturação. Em caso de falha de cobrança online, a regularização deve ser feita no <strong>TPA físico/multibanco</strong> disponível no balcão.</p>
<h3>Email automático de confirmação de reserva</h3>
<p>O email automático de confirmação de reserva deve funcionar como reforço operacional e de expectativa do cliente. Sempre que possível, deve ser enviado no momento da reserva.</p>
<h3>Conteúdo mínimo obrigatório</h3>
<ul>
<li>Local e hora de levantamento.</li>
<li>Documentos obrigatórios a apresentar no balcão.</li>
<li>Política de combustível, quilometragem, seguro e franquias — <em>apenas nos casos de exceção ou quando essa informação tenha sido solicitada pelo player, agência ou parceiro</em>.</li>
<li>Aviso expresso de que, mesmo quando não exista caução, podem existir <strong>débitos posteriores</strong> por danos resultantes de negligência, multas, portagens, via verde, taxas administrativas ou outros valores contratualmente devidos.</li>
</ul>
<blockquote><strong>Regra operacional.</strong> O conteúdo do email deve ser coerente com as condições da reserva e com a política comercial aplicável ao canal de origem. Informação contraditória entre email, reserva e contrato gera conflito evitável no balcão e na devolução.</blockquote>`,
        },
      ],
    },
    {
      name: "Drop-off, danos e cobrança",
      description: "Devolução de viatura, vistoria, política de danos e gestão de cobrança",
      color: "#ffc429",
      order: 3,
      articles: [
        {
          title: "6. Processo completo de drop-off — devolução da viatura",
          content: `<p>A devolução é o <strong>último contacto do cliente com a marca</strong> e, por isso, é simultaneamente um momento de serviço e de controlo.</p>
<h3>Fluxograma de drop-off</h3>
<ol>
<li>Cliente chega ao balcão/zona de devolução.</li>
<li>Agradecer o regresso e perguntar pela experiência.</li>
<li>Acompanhar o cliente até à viatura.</li>
<li>Abrir inspeção de devolução no sistema.</li>
<li>Mostrar danos já registados e comparar com estado atual.</li>
<li>Registar novos danos, fotografias e observações.</li>
<li>Apurar valor a cobrar, se aplicável.</li>
<li>Cobrar no momento.</li>
<li>Fechar contrato no sistema.</li>
</ol>
<blockquote><strong>Decisão: Existem novos danos cobrados?</strong><br><strong>SIM</strong> → Cobrar, registar e só depois fechar contrato.<br><strong>NÃO</strong> → Fechar contrato e libertar cliente.</blockquote>
<h3>6.1 Script de receção na devolução</h3>
<ul>
<li>Agradecer explicitamente o retorno do cliente.</li>
<li>Perguntar como correu a viagem e se houve qualquer problema com a viatura.</li>
<li>Abrir a inspeção <strong>com o cliente presente</strong>; nunca inspecionar primeiro e explicar depois.</li>
</ul>
<h3>6.2 Inspeção sempre acompanhada</h3>
<p>O operador deve percorrer a viatura com o cliente, mostrar os danos previamente existentes e validar, no momento, qualquer diferença identificada. <strong>Transparência reduz conflito.</strong></p>
<h3>6.3 Fecho administrativo</h3>
<ul>
<li>Após pagamento/regularização, fechar reserva e contrato no sistema.</li>
<li>Os danos registados ficam disponíveis para a sede avaliar reparação, prioridade e permanência da viatura em operação.</li>
<li>A decisão de reparar, retirar ou manter a viatura é central; o papel do balcão é <strong>registar, cobrar e sinalizar</strong>.</li>
</ul>`,
        },
        {
          title: "7. Política de inspeção, danos e cobrança",
          content: `<p>A inspeção deve ser <strong>simples, coerente e executável</strong>. No arranque, a política de danos deve privilegiar objetividade e baixa ambiguidade.</p>
<h3>Regras-base de danos operacionais</h3>
<ul>
<li><strong>Estado geral</strong> — Viatura sem odores desagradáveis e sem sujidade incompatível com nova entrega. Se impeditivo, retirar de serviço.</li>
<li><strong>Danos menores</strong> — Riscos até ao limiar interno definido não geram tratamento especial, salvo exceção documentada. Aplicar sempre a mesma regra em toda a rede.</li>
<li><strong>Danos cobrados</strong> — Novos danos visíveis acima do limiar definido, para-choques partidos, vidro, jante, interior ou outros danos materialmente relevantes. Cobrança conforme tabela interna em vigor.</li>
<li><strong>Prova</strong> — Sempre fotografar e anexar à inspeção. Sem fotografia, o caso fica fragilizado.</li>
<li><strong>Cobrança</strong> — No momento da devolução, por cartão/multibanco. Não deixar o cliente sair sem resolução ou acordo formal registado.</li>
</ul>
<blockquote><strong>Tabela de danos.</strong> A tabela detalhada de preços deve existir como anexo controlado por versão. O balcão não deve improvisar valores; deve usar a grelha em vigor.</blockquote>`,
        },
        {
          title: "7.1 Vistoria de saída — interior, contadores e verificação funcional",
          content: `<p>Na vistoria de saída, a equipa deve validar não apenas o exterior da viatura, mas também o interior, os contadores principais e uma verificação funcional rápida. Esta etapa <strong>protege a operação</strong> e evita discussões na devolução.</p>
<h3>Interior</h3>
<ul>
<li>Fotografar bancos da frente e de trás, tablier e bagageira.</li>
<li>Confirmar o estado geral do interior, sem rasgos, manchas graves, odores ou falta de componentes relevantes.</li>
<li>Verificar se a viatura contém os documentos obrigatórios, manual e restantes itens que devam acompanhar a entrega.</li>
</ul>
<h3>Contadores e leituras de saída</h3>
<ul>
<li>Registar quilometragem, nível de combustível ou carga e qualquer indicador relevante visível no quadro.</li>
<li>Garantir que a leitura de saída fica associada à inspeção para comparação direta no regresso.</li>
</ul>
<h3>Verificação funcional rápida</h3>
<ul>
<li>Confirmar funcionamento básico de luzes principais, piscas e limpeza do para-brisas.</li>
<li>Sempre que operacionalmente possível, validar ausência de alertas críticos visíveis no painel antes da entrega.</li>
<li>Avisar o cliente para comunicar imediatamente qualquer anomalia que detete logo após a saída da base ou nos primeiros minutos de utilização.</li>
</ul>
<blockquote><strong>Princípio de execução.</strong> A vistoria de saída deve ser simples, repetível e suficientemente completa para criar prova objetiva do estado da viatura no momento da entrega.</blockquote>`,
        },
        {
          title: "7.2 Cliente recusa pagar — matriz de escalada",
          content: `<p>Quando o cliente recusa pagar, o operador deve manter <strong>postura calma</strong>, explicar a origem do valor, mostrar a evidência e pedir pagamento. Persistindo a recusa, aplica-se a matriz de escalada.</p>
<ol>
<li>Reexplicar o dano, a inspeção inicial e a evidência fotográfica.</li>
<li>Solicitar pagamento imediato e registar a recusa.</li>
<li>Chamar responsável do balcão.</li>
<li>Escalar para sede/apoio definido.</li>
<li>Se necessário, formalizar participação às autoridades por falta de pagamento de serviço ou seguir o circuito jurídico definido.</li>
</ol>`,
        },
      ],
    },
    {
      name: "Operação e exceções",
      description: "Atrasos, no-shows, extensões, upgrades, downgrades e walk-ins",
      color: "#5a6bba",
      order: 4,
      articles: [
        {
          title: "8. Contratos em atraso, no-show, extensões e pendências",
          content: `<p>No fecho, o balcão deve tratar as <strong>reservas que não levantaram</strong> e os <strong>contratos cuja data de fim já passou</strong> sem devolução confirmada.</p>
<h3>Pendências operacionais obrigatórias no fecho</h3>
<ul>
<li><strong>Não devolveu</strong> — Contrato ativo com data de fim anterior ao momento atual. Ação: contactar cliente, registar resultado e, se houver extensão, atualizar data de fim.</li>
<li><strong>Não levantou</strong> — Reserva/contrato com data de início passada e sem inspeção/pickup concluído. Ação: contactar cliente e decidir libertação do carro.</li>
<li><strong>Cliente pede extensão</strong> — Contacto telefónico ou presencial. Ação: verificar disponibilidade, atualizar sistema e confirmar cobrança adicional.</li>
<li><strong>Cliente não atende</strong> — Pendência mantém-se visível. Ticket continua aberto até resolução.</li>
</ul>
<blockquote><strong>Decisão operacional inicial.</strong> Na fase de arranque, o contacto a clientes com atraso/no-show será feito no próprio balcão, sobretudo em períodos de menor carga. Mais tarde, poderá transitar para a sede se o volume o justificar.</blockquote>
<h3>8.1 Registo de contacto</h3>
<p>A chamada deve idealmente ser efetuada por <strong>VoIP integrado com CRM</strong>, com registo automático do número, resultado e, quando aplicável, link da gravação. Se o sistema ainda não estiver implementado, o operador deve registar manualmente o outcome no local definido.</p>
<ul>
<li><strong>Atendeu e pediu mais tempo</strong> → validar disponibilidade, prolongar no sistema e confirmar nova cobrança.</li>
<li><strong>Atendeu e recusou/está em incumprimento</strong> → escalar conforme matriz.</li>
<li><strong>Não atendeu</strong> → manter pendência ativa e repetir tentativa segundo a política.</li>
<li><strong>Pickup não realizado</strong> → decidir libertação do carro segundo janela operacional definida.</li>
</ul>`,
        },
        {
          title: "9. Upgrades, downgrades, indisponibilidade e compensação",
          content: `<p>Este é um dos processos <strong>mais sensíveis da operação</strong> porque impacta diretamente satisfação, imagem da marca e utilização de frota.</p>
<h3>Árvore de decisão para indisponibilidade</h3>
<ol>
<li>Cliente tem reserva para categoria/características definidas.</li>
<li>Viatura reservada não está disponível.</li>
<li>Procurar viatura do mesmo segmento e mesmas características críticas.</li>
<li>Se não houver, procurar upgrade imediato.</li>
<li>Se não houver upgrade, avaliar downgrade com aceitação do cliente.</li>
<li>Se nenhuma solução satisfatória existir, escalar e procurar solução externa/concorrência.</li>
</ol>
<blockquote><strong>Decisão: Existe viatura equivalente em transmissão e energia?</strong><br><strong>SIM</strong> → Atribuir equivalente e manter experiência.<br><strong>NÃO</strong> → Aplicar upgrade; se impossível, negociar downgrade com ajuste/compensação.</blockquote>
<h3>9.1 Regras de equivalência</h3>
<ul>
<li>As características críticas são, no mínimo, <strong>transmissão</strong> e <strong>tipo de motorização/energia</strong>.</li>
<li>Cliente que reservou automático deve receber automático sempre que operacionalmente possível.</li>
<li>Cliente que reservou elétrico deve receber elétrico ou solução previamente aprovada; a expectativa é alta e não deve ser tratada como detalhe.</li>
<li>Nunca entregar categoria inferior por conveniência interna sem explicar, obter aceitação e ajustar preço/compensação.</li>
</ul>
<h3>9.2 Prioridade de solução</h3>
<ol>
<li>Mesma categoria e mesmas características.</li>
<li>Upgrade gratuito para categoria superior.</li>
<li>Downgrade aceite pelo cliente com ajuste financeiro e compensação adequada.</li>
<li>Escalada imediata para sede quando não há carro ou quando a solução afeta outra reserva crítica.</li>
</ol>
<h3>9.3 Regra de downgrade</h3>
<p>Quando houver downgrade, a regra comercial deve estar numa <strong>folha A4 simples e inequívoca</strong> para o balcão. O operador precisa de saber o que pode decidir sozinho.</p>
<ul>
<li><strong>Preço</strong> — Cobrar preço do downgrade segundo regra comercial em vigor ou aplicar desconto equivalente aprovado.</li>
<li><strong>Compensação</strong> — Pode incluir ajuste de preço, dia oferecido, crédito futuro ou outro gesto autorizado.</li>
<li><strong>Aceitação</strong> — Cliente tem de aceitar explicitamente a solução.</li>
<li><strong>Registo</strong> — Upgrade/downgrade deve ficar associado à reserva e matrículas para BI e auditoria.</li>
</ul>
<blockquote><strong>Indicador de gestão.</strong> Upgrades e downgrades devem ser extraídos para BI para medir quebra de serviço, pressão de frota e custo comercial da operação.</blockquote>`,
        },
        {
          title: "10. Walk-ins, indisponibilidade e argumentário comercial",
          content: `<p>O cliente sem reserva é menos frequente, mas continua a ser uma <strong>oportunidade de receita e de marca</strong>.</p>
<h3>10.1 Processo walk-in</h3>
<ol>
<li>Perguntar para quando quer a reserva e por quanto tempo.</li>
<li>Identificar categoria pretendida e necessidades críticas.</li>
<li>Consultar disponibilidade no calendário.</li>
<li>Se houver carro, criar reserva em nome do cliente e seguir processo normal de documentação, pagamento e pickup.</li>
<li>Se não houver, aplicar argumentário comercial por segmento.</li>
</ol>
<h3>10.2 Argumentário de substituição comercial</h3>
<ul>
<li><strong>Categoria pedida não existe</strong> → Apresentar alternativa superior pelo melhor diferencial possível. Objetivo: converter venda.</li>
<li><strong>Existe categoria inferior</strong> → Explicar prós e contras de forma honesta e propor ajuste de preço. Objetivo: salvar venda sem frustração excessiva.</li>
<li><strong>Cliente precisa de comercial/carrinha</strong> → Explicar capacidade real disponível e propor combinação possível. Objetivo: evitar promessa irreal.</li>
<li><strong>Sem carros</strong> → Convidar a reservar em janela posterior ou canal digital; recolher contacto. Objetivo: não perder lead.</li>
</ul>
<blockquote><strong>Ticketing e filas.</strong> Quando a operação ganhar escala, implementar sistema de ticketing/senha pode reduzir pressão física no balcão e aproveitar o contexto do shopping center. Enquanto não existir, a equipa gere a fila manualmente com prioridade clara.</blockquote>`,
        },
        {
          title: "19. Broker vs direto — comunicação, depósito e danos",
          content: `<p>As reservas broker exigem comunicação diferente porque o cliente compra sobretudo preço e, frequentemente, coberturas externas que não estão integradas com a operação Volto Drive.</p>
<h3>Diferenças operacionais por origem da reserva</h3>
<ul>
<li><strong>Discurso de venda</strong> — Direta: simplicidade, tudo incluído e mínimo upselling. Broker: explicar o que vem incluído e o que não vem.</li>
<li><strong>Extras</strong> — Direta: só os efetivamente necessários. Broker: pode haver venda adicional de proteção, kms ou extras aplicáveis.</li>
<li><strong>Coberturas externas</strong> — Direta: normalmente não aplicável. Broker: cliente pode ter cobertura com broker, mas a Volto Drive pode cobrar primeiro.</li>
<li><strong>Depósito/caução</strong> — Direta: segundo política direta. Broker: explicar claramente a regra antes da assinatura.</li>
<li><strong>Danos</strong> — Direta: processo normal. Broker: cliente paga à Volto Drive; eventual reembolso é tratado com o broker.</li>
</ul>
<blockquote><strong>Mensagem-chave ao cliente broker.</strong> A cobertura comprada no broker não significa, por si só, que a Volto Drive abdica de cobrança no momento devido. O balcão deve explicar isto antes da entrega para evitar conflito na devolução.</blockquote>
<h3>19.1 Script sugerido — reserva broker</h3>
<ul>
<li><em>"A sua reserva vem através de parceiro externo; vou confirmar consigo o que está incluído e o que fica fora."</em></li>
<li><em>"Se existir dano ou cobrança aplicável, a regularização é feita connosco e depois pode tratar o reembolso com o broker, se a sua cobertura o permitir."</em></li>
<li><em>"Vou mostrar-lhe agora as condições essenciais antes de avançarmos."</em></li>
</ul>`,
        },
      ],
    },
    {
      name: "Sistemas, segurança e comunicação",
      description: "Documentação, fraude, sistemas e níveis de autonomia entre balcão e sede",
      color: "#8390cb",
      order: 5,
      articles: [
        {
          title: "11. Documentação, pagamentos, depósitos e fraude",
          content: `<p>A disciplina financeira e documental <strong>protege a operação</strong> de risco operacional, fraude e incumprimento.</p>
<h3>11.1 Política de pagamento</h3>
<ul>
<li>Sempre confirmar no sistema se a reserva está paga ou não.</li>
<li>Sempre que o pagamento online falhar ou seja insuficiente, regularizar em TPA físico/multibanco antes de libertar a viatura.</li>
<li>A política de depósito/caução deve estar clara por origem da reserva, tipo de cliente e categoria de viatura.</li>
<li>Reservas broker com coberturas externas exigem comunicação clara: a Volto Drive pode ter de cobrar primeiro e o cliente reclamar depois ao broker.</li>
</ul>
<h3>11.2 Sinais de alerta de fraude ou risco</h3>
<ul>
<li>Pressa excessiva e tentativa de pressionar o operador a ignorar etapas.</li>
<li>Inconsistência entre titular, cartão, documentos e comportamento.</li>
<li>Perguntas anómalas sobre peças, versões específicas ou detalhes sem relação com o aluguer normal.</li>
<li>Recusa em apresentar documentos físicos originais.</li>
<li>Tentativa de usar cartões temporários/limites improváveis sem alternativa credível.</li>
<li>Sinais de álcool, incapacidade evidente de condução ou comportamento agressivo.</li>
</ul>
<blockquote><strong>Direito de recusa.</strong> A Volto Drive reserva-se o direito de recusar entrega quando não estejam reunidas condições de segurança, documentação, pagamento ou confiança mínima. A recusa deve ser objetiva, calma e registada.</blockquote>
<h3>11.3 Cadeiras de criança e extras obrigatórios</h3>
<p>As cadeiras e outros equipamentos regulados devem obedecer ao quick-reference legal em vigor e ao stock efetivamente disponível. <strong>O balcão não deve improvisar regras com base em memória</strong>; deve consultar o guia interno atualizado.</p>`,
        },
        {
          title: "12. Sistemas, registos e ecossistema operacional",
          content: `<p>O operador <strong>não trabalha apenas no WWM</strong>. O posto de trabalho deve ser concebido como um ecossistema simples e encadeado.</p>
<h3>Sistemas nucleares por função</h3>
<ul>
<li><strong>WWM</strong> — Reserva, contrato, inspeção e estado do cliente. Sistema-mestre da operação.</li>
<li><strong>VoIP/telefonia</strong> — Contacto a clientes e registo de chamadas. Preferir integração automática com CRM.</li>
<li><strong>CRM</strong> — Histórico de contactos e comunicações. Sobretudo relevante para follow-up e auditoria.</li>
<li><strong>Google Workspace/portal interno</strong> — Procedimentos, formulários e reportes. Fonte oficial de documentos em vigor.</li>
<li><strong>TPA/multibanco</strong> — Cobrança presencial. Obrigatório disponível e testado no início do dia.</li>
</ul>
<blockquote><strong>Princípio de desenho.</strong> Sempre que possível, reduzir o número de ecrãs e cliques visíveis ao operador. O facto de existirem vários sistemas não deve transformar o balcão num cockpit caótico.</blockquote>
<h3>12.1 Reporting mínimo do balcão</h3>
<ul>
<li>Resumo do dia: pickups, drop-offs, stock, atrasos e exceções.</li>
<li>Lista de contactos a clientes com outcome.</li>
<li>Upgrades/downgrades realizados.</li>
<li>Danos cobrados e contratos encerrados com observação.</li>
<li>Incidentes de pagamento, fraude, recusa de entrega e reclamações.</li>
</ul>`,
        },
        {
          title: "13. Comunicação com sede e níveis de autonomia",
          content: `<p>Nem tudo deve subir à sede. O manual só é útil se separar claramente o que o balcão decide sozinho do que exige escalada.</p>
<h3>Matriz de autonomia</h3>
<ul>
<li><strong>Validação documental</strong> — Balcão decide segundo regra. Escalar quando a documentação gera dúvida material.</li>
<li><strong>Extensão com disponibilidade</strong> — Balcão decide. Escalar quando afeta reserva futura crítica ou exceção comercial.</li>
<li><strong>Upgrade simples</strong> — Balcão decide. Escalar quando implica custo relevante ou última unidade crítica.</li>
<li><strong>Downgrade com compensação padrão</strong> — Balcão decide se estiver na folha A4. Escalar quando exige exceção fora da grelha.</li>
<li><strong>Cliente em incumprimento sério</strong> — Sempre escalar para sede.</li>
<li><strong>Reparação/retirada de frota</strong> — Sempre escalar para sede.</li>
<li><strong>Conflito grave/ameaça/polícia</strong> — Sempre escalar e <strong>de imediato</strong>.</li>
</ul>`,
        },
      ],
    },
    {
      name: "Gestão, formação e KPI",
      description: "Gestão documental, formação, KPI, operação em shopping e anexos práticos",
      color: "#adb5dd",
      order: 6,
      articles: [
        {
          title: "14. Gestão documental, versões e disponibilidade dos procedimentos",
          content: `<p>Os procedimentos precisam de estar disponíveis online e em papel controlado. <strong>O que mata a consistência não é a falta de documentos; é a coexistência de documentos errados.</strong></p>
<ul>
<li>Existe sempre uma versão oficial online com histórico de revisões.</li>
<li>Cada balcão mantém pasta física de consulta rápida para situações sem acesso imediato ao portal.</li>
<li>Toda a impressão local deve indicar versão e data em vigor.</li>
<li>Sempre que um procedimento muda, a base deve substituir a versão física e registar a atualização.</li>
<li>Uma decisão tomada hoje será auditada contra a versão em vigor nessa data, <strong>não contra versões futuras</strong>.</li>
</ul>
<h3>Controlo de versões — campos mínimos</h3>
<ul>
<li><strong>Código do documento</strong> — Ex.: VD-OPS-BALC-001.</li>
<li><strong>Versão</strong> — v1.0, v1.1, etc.</li>
<li><strong>Data de entrada em vigor</strong> — Data exata.</li>
<li><strong>Responsável pela aprovação</strong> — Nome/função.</li>
<li><strong>Resumo da alteração</strong> — O que mudou.</li>
<li><strong>Distribuição</strong> — Bases/equipas afetadas.</li>
</ul>`,
        },
        {
          title: "15. Formação, certificação e arranque de equipas",
          content: `<p>A formação deve cobrir <strong>processos, sistemas e critérios de decisão</strong>. Não basta saber clicar; é preciso saber decidir.</p>
<h3>Pacote mínimo de formação de arranque</h3>
<ul>
<li><strong>WWM</strong> — Reservas, contratos, inspeções, estados e alertas.</li>
<li><strong>Pagamentos</strong> — TPA, reservas pagas, falhas e depósitos.</li>
<li><strong>Telefonia/CRM</strong> — Chamadas, registos e outcomes.</li>
<li><strong>Procedimentos</strong> — Pickup, drop-off, danos, atrasos, upgrades, fraude.</li>
<li><strong>Atendimento</strong> — Scripts e gestão de conflito.</li>
<li><strong>Portal interno</strong> — Onde consultar regras, anexos e versões.</li>
</ul>
<blockquote><strong>Boas práticas de aprendizagem.</strong> No arranque, cada operador deve fazer shadowing, checklist assistida e teste final breve. O objetivo é evitar improvisação quando chegarem as ondas de clientes.</blockquote>`,
        },
        {
          title: "16. KPI operacionais do balcão",
          content: `<p>Medir a operação permite <strong>corrigir processos antes que o problema chegue ao cliente</strong>.</p>
<h3>KPI recomendados</h3>
<ul>
<li><strong>Tempo médio de pickup</strong> — Da chegada ao fecho do contrato. Uso: dimensionamento de equipa e simplificação.</li>
<li><strong>Tempo médio de drop-off</strong> — Da receção ao fecho do contrato. Uso: eficiência e experiência final.</li>
<li><strong>% reservas com documentação validada à primeira</strong> — Qualidade do processo. Uso: treino e UX.</li>
<li><strong>% upgrades/downgrades</strong> — Pressão de frota. Uso: planeamento e imagem.</li>
<li><strong>No-shows e atrasos por base</strong> — Disciplina comercial. Uso: ação preventiva.</li>
<li><strong>Danos cobrados/danos contestados</strong> — Qualidade da inspeção. Uso: treino e política.</li>
<li><strong>NPS/rating/reviews</strong> — Experiência do cliente. Uso: incentivos e coaching.</li>
</ul>`,
        },
        {
          title: "17. Operação em shopping center e gestão de picos",
          content: `<p>Operar em shopping center tem vantagens e restrições: <strong>conforto para o cliente, visibilidade e conveniência</strong>, mas também programas de loja, ondas de procura e pressão de staff.</p>
<ul>
<li>Confirmar horários de operação acordados com segurança/gestão do centro.</li>
<li>Dimensionar pausas e presença com base nos voos, chegadas e janelas de pico relevantes.</li>
<li>Manter o balcão limpo, legível e com informação simples.</li>
<li>Quando a fila crescer, concentrar a equipa em desbloquear identificação, documentação e clientes já prontos.</li>
<li>Explorar progressivamente pré-check-in, app e tablet para retirar tempo administrativo do balcão.</li>
</ul>
<blockquote><strong>Pré-check-in.</strong> É recomendável incentivar check-in prévio e carregamento antecipado de documentos, sobretudo em reservas diretas e broker com alto volume. Isto reduz tempo ao balcão, mas <strong>não elimina verificação física dos documentos</strong>.</blockquote>`,
        },
        {
          title: "18. Anexos operacionais — checklists prontos a usar",
          content: `<h3>Checklist de pickup — balcão</h3>
<ul>
<li>Cumprimentar e identificar cliente.</li>
<li>Confirmar se a reserva é direta ou broker.</li>
<li>Abrir reserva no WWM.</li>
<li>Ver documentos físicos originais.</li>
<li>Carregar/validar documentação na plataforma.</li>
<li>Confirmar pagamento/depósito/pendências.</li>
<li>Confirmar viatura e inspeção prévia.</li>
<li>Explicar danos existentes e condições do contrato.</li>
<li>Recolher assinatura.</li>
<li>Entregar viatura e encerrar atendimento.</li>
</ul>
<h3>Checklist de drop-off — balcão</h3>
<ul>
<li>Agradecer a devolução e perguntar pela experiência.</li>
<li>Acompanhar cliente à viatura.</li>
<li>Abrir inspeção de devolução.</li>
<li>Mostrar danos já existentes.</li>
<li>Registar novos danos e fotografias.</li>
<li>Aplicar tabela de danos.</li>
<li>Cobrar no momento, se aplicável.</li>
<li>Fechar contrato no sistema.</li>
<li>Sinalizar viatura para sede/frota quando necessário.</li>
</ul>
<h3>Checklist de fecho do dia</h3>
<ul>
<li>Validar contratos em atraso de devolução.</li>
<li>Validar pickups não realizados.</li>
<li>Efetuar contactos pendentes e registar resultados.</li>
<li>Rever stock disponível para o dia seguinte.</li>
<li>Identificar carros a lavar/reparar/retirar.</li>
<li>Fechar caixa e conciliar pagamentos.</li>
<li>Enviar ou gravar resumo operacional.</li>
</ul>
<h3>18.1 Folha A4 — decisão rápida para upgrades e downgrades</h3>
<ul>
<li><strong>Tenho carro igual em categoria, transmissão e energia?</strong><br>SIM → Entregar e seguir. NÃO → Passar à pergunta seguinte.</li>
<li><strong>Tenho upgrade aceitável imediato?</strong><br>SIM → Fazer upgrade e registar. NÃO → Passar à pergunta seguinte.</li>
<li><strong>Cliente aceita downgrade com ajuste/compensação?</strong><br>SIM → Executar, registar e confirmar valor. NÃO → Escalar.</li>
<li><strong>Tenho solução externa autorizada/sede?</strong><br>SIM → Aplicar solução. NÃO → Comunicar indisponibilidade segundo script e escalar.</li>
</ul>
<h3>18.2 Checklist complementar — vistoria de saída</h3>
<ul>
<li>Fotografar bancos frente/trás, tablier e bagageira.</li>
<li>Verificar documentos da viatura e manual.</li>
<li>Registar quilometragem e combustível/carga.</li>
<li>Validar luzes, piscas e limpeza do para-brisas.</li>
<li>Informar o cliente para reportar de imediato qualquer anomalia.</li>
</ul>
<blockquote><strong>Fecho.</strong> Este manual é um documento vivo. Deve mudar pouco, mas deve mudar quando a aprendizagem operacional o justificar. A força do sistema está em <strong>repetir um processo simples, claro e treinado</strong>.</blockquote>`,
        },
        {
          title: "20. Gestão de filas, ticketing e pré-check-in",
          content: `<p>Quando houver ondas de procura, o balcão deve <strong>proteger tempo operacional</strong>. O objetivo é evitar filas desorganizadas e clientes bloqueados no espaço.</p>
<h3>Ferramentas recomendadas de descongestionamento</h3>
<ul>
<li><strong>Pré-check-in digital</strong> — Reduzir tempo de balcão e captura manual. Prioridade alta.</li>
<li><strong>Tablet no balcão</strong> — Assinatura, captura e apoio rápido. Prioridade alta.</li>
<li><strong>Ticketing/senha</strong> — Permitir ao cliente circular no shopping enquanto espera. Prioridade média.</li>
<li><strong>Comms proativas</strong> — Incentivar app, check-in e documentação prévia. Prioridade alta.</li>
</ul>
<h3>20.1 Regras de triagem em fila</h3>
<ul>
<li>Clientes com pré-check-in e documentos prontos devem ser encaminhados mais rapidamente.</li>
<li>Clientes com devolução simples devem ser absorvidos sem ficarem presos atrás de pickups complexos.</li>
<li>Sempre que possível, separar trabalho de balcão e trabalho de parque/inspeção.</li>
<li>Em pico, o operador deve fazer só o essencial e evitar explicações longas que possam ser remetidas para material já preparado.</li>
</ul>
<blockquote><strong>Aplicação e app.</strong> A app deve ser usada como alavanca comercial e operacional: reservar, carregar dados, receber indicação de atendimento e reduzir tempo morto.</blockquote>`,
        },
        {
          title: "21. Horários, staffing e organização humana da base",
          content: `<p>O horário deve ser definido <strong>pelo serviço real e pelas regras do local</strong>. O shopping influencia, mas a necessidade do cliente e a operação de chegadas/partidas também contam.</p>
<h3>Princípios de staffing</h3>
<ul>
<li><strong>Cobertura mínima</strong> — Garantir capacidade de atendimento, inspeção e pausa sem deixar o balcão exposto.</li>
<li><strong>Picos</strong> — Sobrepor pessoas nas horas de maior carga, não distribuir uniforme todo o dia.</li>
<li><strong>Baixas/ausências</strong> — Ter plano de contingência por base.</li>
<li><strong>Fecho do dia</strong> — Reservar tempo administrativo para atrasos, contactos e reconciliação.</li>
<li><strong>Época alta</strong> — Aceitar que parte do trabalho administrativo migra para fim do dia/horas de menor movimento.</li>
</ul>
<blockquote><strong>Seleção e formação.</strong> O gestor local deve confirmar logo em recrutamento se a pessoa compreende o regime de horários de shopping/turismo. Não é detalhe; é condição de permanência operacional.</blockquote>`,
        },
        {
          title: "22. Incentivos, qualidade e disciplina de serviço",
          content: `<p>Mesmo em operação de balcão, a equipa precisa de perceber o que é valorizado. A remuneração variável <strong>não deve empurrar para venda forçada</strong>; deve empurrar para serviço, disciplina e contribuição comercial útil.</p>
<h3>Componentes recomendadas de avaliação</h3>
<ul>
<li><strong>Qualidade de serviço</strong> — NPS, reviews, rating broker e qualidade de atendimento.</li>
<li><strong>Disciplina operacional</strong> — Cumprimento de processos, reconciliação e registo correto.</li>
<li><strong>Performance comercial</strong> — Extras legítimos, conversão walk-in e resultados da base.</li>
<li><strong>Long term incentive</strong> — Benefício ligado à permanência e estabilidade na empresa.</li>
<li><strong>Avaliação 360</strong> — Autoavaliação, pares e superior com pesos definidos.</li>
</ul>
<blockquote><strong>Princípio de desenho de incentivos.</strong> O balcão não deve vender cadeiras, extras ou upgrades a qualquer custo. Deve vender o que faz sentido para o cliente e para a operação, <strong>sem destruir confiança</strong>.</blockquote>`,
        },
      ],
    },
  ],
};
