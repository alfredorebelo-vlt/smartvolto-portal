"use strict";(()=>{var a={};a.id=2700,a.ids=[2700],a.modules={261:a=>{a.exports=require("next/dist/shared/lib/router/utils/app-paths")},3295:a=>{a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},4573:a=>{a.exports=require("node:buffer")},4989:(a,b,c)=>{c.d(b,{A:()=>e});var d=c(81561);async function e(a){let{session:b,action:c,entity:e,entityId:f,meta:g}=a,h=b?.user??null;try{await d.z.auditLog.create({data:{userId:h?.id??null,userEmail:h?.email??null,userName:(h?.givenName&&h?.familyName?`${h.givenName} ${h.familyName}`:h?.name)??null,action:c,entity:e,entityId:f??null,meta:g||void 0}})}catch(a){console.error("[audit] Failed to write log:",a)}}},8815:(a,b,c)=>{c.d(b,{j2:()=>j,Y9:()=>i,Jv:()=>k});var d=c(4967),e=c(86946),f=c(93021),g=c(81561);let h={pages:{signIn:"/login",error:"/login"},callbacks:{async signIn({user:a,profile:b}){let c=a?.email??b?.email;return!!c&&(c.split("@")[1]?.toLowerCase()==="voltodrive.com"||"/login?error=AccessDenied")},authorized({auth:a,request:b}){let c=!!a?.user,{pathname:d}=b.nextUrl;return!!(d.startsWith("/login")||d.startsWith("/api/auth")||d.startsWith("/api/restart")||d.startsWith("/_next")||d.startsWith("/brand"))||"/favicon.ico"===d||c}},providers:[]},{handlers:i,auth:j,signIn:k,signOut:l}=(0,d.Ay)({...h,adapter:(0,f.y)(g.z),session:{strategy:"jwt"},providers:[(0,e.A)({clientId:process.env.AUTH_GOOGLE_ID||process.env.GOOGLE_CLIENT_ID,clientSecret:process.env.AUTH_GOOGLE_SECRET||process.env.GOOGLE_CLIENT_SECRET,allowDangerousEmailAccountLinking:!0,authorization:{params:{prompt:"select_account",access_type:"offline",response_type:"code",scope:"openid email profile https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/tasks.readonly"}}})],callbacks:{...h.callbacks,async signIn(a){let b=await h.callbacks.signIn(a);if(!0!==b)return b;let{account:c,profile:d,user:e}=a,f=e?.email??d?.email;if(c?.provider==="google"&&d&&f)try{let a=await g.z.user.upsert({where:{email:f},create:{email:f,name:[d.given_name,d.family_name].filter(Boolean).join(" ")||f,googleUserId:d.sub??void 0,givenName:d.given_name??void 0,familyName:d.family_name??void 0,image:d.picture??void 0},update:{googleUserId:d.sub??void 0,givenName:d.given_name??void 0,familyName:d.family_name??void 0,image:d.picture??void 0}});if(c.access_token&&a){let b=await g.z.account.findFirst({where:{userId:a.id,provider:"google"}});b?await g.z.account.update({where:{id:b.id},data:{access_token:c.access_token,refresh_token:c.refresh_token??b.refresh_token,expires_at:c.expires_at??void 0,scope:c.scope??void 0,providerAccountId:c.providerAccountId}}):await g.z.account.create({data:{userId:a.id,type:c.type,provider:c.provider,providerAccountId:c.providerAccountId,access_token:c.access_token,refresh_token:c.refresh_token??void 0,expires_at:c.expires_at??void 0,token_type:c.token_type??void 0,scope:c.scope??void 0,id_token:c.id_token??void 0}})}}catch(a){console.error("[signIn callback]",a)}return!0},async jwt({token:a,user:b,trigger:c}){if(b?.email||"update"===c){let c=b?.email??a.email;if(c){let b=await g.z.user.findUnique({where:{email:c},include:{role:!0}});b&&(a.id=b.id,a.isAdmin=b.role?.name==="Admin"||b.isAdmin,a.roleId=b.roleId??null,a.givenName=b.givenName,a.familyName=b.familyName,a.jobTitle=b.jobTitle,a.department=b.department,a.sections=b.isAdmin?["*"]:b.role?.sections??[])}}return a},async session({session:a,token:b}){if(a.user&&b){let c=a.user;c.id=b.id??b.sub,c.isAdmin=b.isAdmin??!1,c.roleId=b.roleId??null,c.givenName=b.givenName??null,c.familyName=b.familyName??null,c.jobTitle=b.jobTitle??null,c.department=b.department??null,c.sections=b.sections??[]}return a}}})},10846:a=>{a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},19121:a=>{a.exports=require("next/dist/server/app-render/action-async-storage.external.js")},19225:(a,b,c)=>{a.exports=c(44870)},21820:a=>{a.exports=require("os")},26849:a=>{a.exports=require("@prisma/client/runtime/client")},27910:a=>{a.exports=require("stream")},29021:a=>{a.exports=require("fs")},29294:a=>{a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},30523:a=>{a.exports=import("@prisma/client/runtime/query_compiler_fast_bg.mysql.wasm-base64.mjs")},34631:a=>{a.exports=require("tls")},41204:a=>{a.exports=require("string_decoder")},44870:a=>{a.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},55511:a=>{a.exports=require("crypto")},63033:a=>{a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},68347:(a,b,c)=>{c.r(b),c.d(b,{handler:()=>H,patchFetch:()=>G,routeModule:()=>C,serverHooks:()=>F,workAsyncStorage:()=>D,workUnitAsyncStorage:()=>E});var d={};c.r(d),c.d(d,{POST:()=>B});var e=c(19225),f=c(84006),g=c(8317),h=c(99373),i=c(34775),j=c(24235),k=c(261),l=c(54365),m=c(90771),n=c(73461),o=c(67798),p=c(92280),q=c(62018),r=c(45696),s=c(47929),t=c(86439),u=c(37527),v=c(23211),w=c(8815),x=c(81561),y=c(4989);let z={categories:[{name:"Princ\xedpios e gest\xe3o di\xe1ria",description:"Princ\xedpios operativos, modelo de gest\xe3o e abertura do balc\xe3o",color:"#2e3c8f",order:1,articles:[{title:"1. Princ\xedpios operativos da Volto Drive",content:`<p>A opera\xe7\xe3o de balc\xe3o da Volto Drive assenta em <strong>cinco princ\xedpios</strong>: servi\xe7o impec\xe1vel, decis\xe3o r\xe1pida, disciplina documental, controlo di\xe1rio da frota e registo digital de tudo o que impacta o cliente ou a viatura.</p>
<ul>
<li><strong>Servi\xe7o premium:</strong> o cliente n\xe3o chega apenas para levantar ou devolver um carro; chega a um destino e deve sentir acompanhamento imediato, claro e seguro.</li>
<li><strong>Opera\xe7\xe3o program\xe1vel:</strong> o dia deve ser planeado com base em pickups, drop-offs, stock e picos de carga administrativa.</li>
<li><strong>Transpar\xeancia total:</strong> inspe\xe7\xf5es, danos, valores cobrados e decis\xf5es devem ser explicados ao cliente no momento em que acontecem.</li>
<li><strong>Execu\xe7\xe3o no balc\xe3o:</strong> sempre que poss\xedvel, o balc\xe3o resolve sem depender da sede; a sede entra em exce\xe7\xe3o, escalada e decis\xf5es de frota.</li>
<li><strong>Registo obrigat\xf3rio:</strong> tudo o que n\xe3o estiver registado no sistema ou no canal definido \xe9 considerado <em>n\xe3o executado</em>.</li>
</ul>
<blockquote><strong>Regra-m\xe3e de opera\xe7\xe3o.</strong> Na d\xfavida entre rapidez e falta de controlo, a equipa deve escolher um processo simples mas audit\xe1vel. A consist\xeancia \xe9 mais valiosa do que improvisa\xe7\xf5es n\xe3o documentadas.</blockquote>`},{title:"2. Modelo di\xe1rio de gest\xe3o do balc\xe3o",content:`<p>O gestor do balc\xe3o come\xe7a o dia a planear carga, equipa, janelas de pausa e prioridades. A gest\xe3o do dia <strong>n\xe3o \xe9 reativa</strong>; \xe9 uma rotina de leitura do neg\xf3cio e de organiza\xe7\xe3o operacional.</p>
<h3>Cad\xeancia m\xednima de controlo di\xe1rio</h3>
<ul>
<li><strong>Abertura (AM)</strong> — Ler trabalho previsto do dia e identificar picos. Sa\xedda esperada: plano do dia, distribui\xe7\xe3o de tarefas e alertas.</li>
<li><strong>Meio do dia</strong> — Revalidar desvios, atrasos, falta de carros e equipas. Sa\xedda esperada: ajuste de pausas, lavagens e prioridades.</li>
<li><strong>Fecho / final do dia</strong> — Validar no-shows, n\xe3o devolu\xe7\xf5es e pend\xeancias. Sa\xedda esperada: lista de a\xe7\xe3o, contactos a clientes e pend\xeancias para sede.</li>
</ul>
<ul>
<li>Em <strong>\xe9poca interm\xe9dia e baixa</strong>: AM, almo\xe7o e fecho s\xe3o obrigat\xf3rios.</li>
<li>Em <strong>\xe9poca alta</strong>: pode ser necess\xe1rio acompanhar picos ao longo do dia em janelas de 2 horas, sobretudo quando a base estiver a operar perto da red line.</li>
<li>O resumo operacional deve estar sempre vis\xedvel: parede, ecr\xe3 ou dashboard dedicado no sistema.</li>
</ul>`},{title:"3. Abertura do balc\xe3o e dashboard di\xe1rio",content:`<p>Na abertura, o gestor ou operador s\xe9nior deve consultar o quadro di\xe1rio e validar se a opera\xe7\xe3o consegue cumprir o servi\xe7o prometido nas horas seguintes.</p>
<h3>Dashboard di\xe1rio obrigat\xf3rio</h3>
<ul>
<li><strong>Pickups do dia</strong> — Carga de entregas prevista. A\xe7\xe3o: distribuir equipa, preparar contratos e inspe\xe7\xf5es.</li>
<li><strong>Drop-offs do dia</strong> — Carga de devolu\xe7\xf5es prevista. A\xe7\xe3o: reservar janelas de inspe\xe7\xe3o e parque.</li>
<li><strong>Stock dispon\xedvel</strong> — Capacidade real de cumprimento. A\xe7\xe3o: confirmar carros prontos, limpos e com autonomia.</li>
<li><strong>Contratos em atraso de devolu\xe7\xe3o</strong> — Risco de indisponibilidade. A\xe7\xe3o: contactar clientes e avaliar extens\xf5es.</li>
<li><strong>Contratos em atraso de pickup</strong> — No-show potencial. A\xe7\xe3o: libertar capacidade ap\xf3s decis\xe3o.</li>
<li><strong>Picos por faixa hor\xe1ria</strong> — Risco de fila e sobrecarga. A\xe7\xe3o: reposicionar equipa e pausas.</li>
</ul>
<blockquote><strong>Ponto vindo da reuni\xe3o de 05 mar\xe7o.</strong> O dashboard deve ser simples no arranque: pickups, drop-offs e stock. Depois poder\xe1 evoluir para vis\xe3o por blocos hor\xe1rios. A informa\xe7\xe3o vem do sistema; o trabalho \xe9 torn\xe1-la vis\xedvel e accion\xe1vel.</blockquote>
<h3>Checklist de abertura</h3>
<ul>
<li>Abrir WWM e confirmar pickups, drop-offs e stock do dia.</li>
<li>Validar contratos em atraso de devolu\xe7\xe3o e pickups n\xe3o realizados.</li>
<li>Confirmar viaturas prontas: limpas, carregadas/abastecidas e sem bloqueios.</li>
<li>Verificar se h\xe1 reservas de \xfaltima hora (8-24h) relevantes.</li>
<li>Distribuir respons\xe1veis por pickup, drop-off, parque e atendimento.</li>
<li>Confirmar TPA/multibanco, tablet de inspe\xe7\xe3o, scanner e telefone.</li>
<li>Confirmar que a pasta f\xedsica e o portal interno est\xe3o acess\xedveis.</li>
</ul>`}]},{name:"Atendimento e pickup",description:"Script base de atendimento e processo completo de levantamento de viatura",color:"#f29220",order:2,articles:[{title:"4. Atendimento ao cliente e script base",content:`<p>O atendimento deve ser <strong>curto, cordial e orientado a desbloquear a opera\xe7\xe3o</strong>. A equipa n\xe3o deve criar discurso excessivo; deve criar confian\xe7a e avan\xe7ar.</p>
<h3>Script base por momento de contacto</h3>
<ul>
<li><strong>Chegada ao balc\xe3o</strong> — Receber e identificar.<br><em>"Bom dia, bem-vindo \xe0 Volto Drive. Tem reserva connosco?"</em></li>
<li><strong>Cliente que regressa / devolu\xe7\xe3o</strong> — Agradecer e abrir conversa de servi\xe7o.<br><em>"Obrigado por voltar. Correu tudo bem com a viagem e com a viatura?"</em></li>
<li><strong>Explica\xe7\xe3o de extras broker</strong> — Enquadrar diferen\xe7a de produto.<br><em>"Esta reserva vem por broker; vou explicar o que j\xe1 est\xe1 inclu\xeddo e o que pode ser adicionado."</em></li>
<li><strong>Explica\xe7\xe3o de dano</strong> — Ser transparente e concreto.<br><em>"Este dano n\xe3o constava da inspe\xe7\xe3o inicial; est\xe1 aqui fotografado e o valor aplic\xe1vel \xe9 este."</em></li>
<li><strong>Encerramento</strong> — Fechar de forma positiva.<br><em>"Obrigado por escolher a Volto Drive. Ficamos \xe0 disposi\xe7\xe3o para a pr\xf3xima reserva."</em></li>
</ul>
<ul>
<li>A primeira pergunta operacional \xe9 sempre: <strong>o cliente tem reserva ou n\xe3o tem reserva?</strong></li>
<li>A segunda leitura \xe9: <strong>a reserva \xe9 direta Volto Drive ou broker?</strong></li>
<li>O discurso muda; o processo nuclear de valida\xe7\xe3o, inspe\xe7\xe3o, pagamento e entrega volta a convergir.</li>
</ul>`},{title:"5. Processo completo de pickup — cliente com reserva",content:`<p>O pickup s\xf3 termina quando o cliente est\xe1 validado, a viatura est\xe1 associada, o contrato est\xe1 fechado no sistema e o cliente percebeu o estado da viatura e as condi\xe7\xf5es do servi\xe7o.</p>
<h3>Fluxograma de pickup com reserva</h3>
<ol>
<li>Cliente chega e \xe9 recebido no balc\xe3o.</li>
<li>Confirmar nome, reserva e origem da reserva.</li>
<li>Abrir reserva no WWM.</li>
<li>Verificar se documenta\xe7\xe3o est\xe1 completa e v\xe1lida.</li>
<li>Validar ou carregar documenta\xe7\xe3o em falta.</li>
<li>Verificar pagamento, cau\xe7\xe3o ou pend\xeancias.</li>
<li>Confirmar viatura atribu\xedda e inspe\xe7\xe3o pr\xe9via.</li>
<li>Apresentar estado da viatura e fotografias.</li>
<li>Assinar contrato e concluir entrega.</li>
</ol>
<blockquote><strong>Decis\xe3o: Reserva \xe9 broker?</strong><br><strong>SIM</strong> → Explicar coberturas, dep\xf3sito e extras aplic\xe1veis antes da assinatura.<br><strong>N\xc3O</strong> → Avan\xe7ar sem upselling desnecess\xe1rio; manter apenas extras realmente necess\xe1rios.</blockquote>`},{title:"5.1 Origem da reserva — direta vs broker",content:`<p>A identifica\xe7\xe3o de origem deve ser <strong>evidente no sistema</strong>. Reservas broker devem ter discurso espec\xedfico; reservas diretas devem privilegiar simplicidade e zero fric\xe7\xe3o.</p>
<ul>
<li><strong>Reserva direta Volto Drive:</strong> evitar pain\xe9is de upselling irrelevantes; manter apenas extras obrigat\xf3rios ou efetivamente \xfateis.</li>
<li><strong>Reserva broker:</strong> explicar o que a reserva inclui, o que n\xe3o inclui e quais s\xe3o as regras de danos, dep\xf3sito e coberturas externas.</li>
<li>Quando a reserva vier com cobertura contratada no broker, essa cobertura <strong>n\xe3o substitui automaticamente</strong> obriga\xe7\xf5es financeiras perante a Volto Drive.</li>
</ul>`},{title:"5.2 Documenta\xe7\xe3o obrigat\xf3ria",content:`<ul>
<li>Documento de identifica\xe7\xe3o <strong>original e f\xedsico</strong>.</li>
<li>Carta de condu\xe7\xe3o <strong>original e f\xedsica</strong>.</li>
<li>Dados do titular e contacto telef\xf3nico v\xe1lidos.</li>
<li>M\xe9todo de pagamento aceite pela pol\xedtica em vigor.</li>
<li>Fotografia/digitaliza\xe7\xe3o dos documentos para a plataforma, <strong>nunca reten\xe7\xe3o informal fora do sistema</strong>.</li>
</ul>
<blockquote><strong>Regra operacional.</strong> A reserva n\xe3o avan\xe7a apenas com c\xf3pias enviadas anteriormente. O operador tem de ver os documentos fisicamente e registar o resultado na plataforma.</blockquote>`},{title:"5.3 Captura documental e fotografia do cliente",content:`<p>Sempre que a configura\xe7\xe3o t\xe9cnica o permita, a captura deve ser feita <strong>diretamente por c\xe2mara/tablet</strong> para upload imediato. Se n\xe3o for poss\xedvel, utiliza-se scanner e upload subsequente. A pol\xedtica pretendida \xe9 <em>digital-only capture</em>, com o m\xednimo de passos locais.</p>
<ul>
<li>Sempre carregar os documentos na plataforma.</li>
<li>N\xe3o guardar c\xf3pias avulsas no balc\xe3o, desktop local ou impress\xf5es n\xe3o controladas.</li>
<li>Sempre que definido pela pol\xedtica interna, recolher fotografia do cliente para refor\xe7o de identifica\xe7\xe3o e trilho de auditoria.</li>
</ul>`},{title:"5.4 Pagamento, liberta\xe7\xe3o da viatura e email de confirma\xe7\xe3o",content:`<p>Antes de libertar a viatura, o operador deve confirmar se a reserva j\xe1 est\xe1 paga, se existe cau\xe7\xe3o ou dep\xf3sito aplic\xe1vel e se h\xe1 qualquer bloqueio de fatura\xe7\xe3o. Em caso de falha de cobran\xe7a online, a regulariza\xe7\xe3o deve ser feita no <strong>TPA f\xedsico/multibanco</strong> dispon\xedvel no balc\xe3o.</p>
<h3>Email autom\xe1tico de confirma\xe7\xe3o de reserva</h3>
<p>O email autom\xe1tico de confirma\xe7\xe3o de reserva deve funcionar como refor\xe7o operacional e de expectativa do cliente. Sempre que poss\xedvel, deve ser enviado no momento da reserva.</p>
<h3>Conte\xfado m\xednimo obrigat\xf3rio</h3>
<ul>
<li>Local e hora de levantamento.</li>
<li>Documentos obrigat\xf3rios a apresentar no balc\xe3o.</li>
<li>Pol\xedtica de combust\xedvel, quilometragem, seguro e franquias — <em>apenas nos casos de exce\xe7\xe3o ou quando essa informa\xe7\xe3o tenha sido solicitada pelo player, ag\xeancia ou parceiro</em>.</li>
<li>Aviso expresso de que, mesmo quando n\xe3o exista cau\xe7\xe3o, podem existir <strong>d\xe9bitos posteriores</strong> por danos resultantes de neglig\xeancia, multas, portagens, via verde, taxas administrativas ou outros valores contratualmente devidos.</li>
</ul>
<blockquote><strong>Regra operacional.</strong> O conte\xfado do email deve ser coerente com as condi\xe7\xf5es da reserva e com a pol\xedtica comercial aplic\xe1vel ao canal de origem. Informa\xe7\xe3o contradit\xf3ria entre email, reserva e contrato gera conflito evit\xe1vel no balc\xe3o e na devolu\xe7\xe3o.</blockquote>`}]},{name:"Drop-off, danos e cobran\xe7a",description:"Devolu\xe7\xe3o de viatura, vistoria, pol\xedtica de danos e gest\xe3o de cobran\xe7a",color:"#ffc429",order:3,articles:[{title:"6. Processo completo de drop-off — devolu\xe7\xe3o da viatura",content:`<p>A devolu\xe7\xe3o \xe9 o <strong>\xfaltimo contacto do cliente com a marca</strong> e, por isso, \xe9 simultaneamente um momento de servi\xe7o e de controlo.</p>
<h3>Fluxograma de drop-off</h3>
<ol>
<li>Cliente chega ao balc\xe3o/zona de devolu\xe7\xe3o.</li>
<li>Agradecer o regresso e perguntar pela experi\xeancia.</li>
<li>Acompanhar o cliente at\xe9 \xe0 viatura.</li>
<li>Abrir inspe\xe7\xe3o de devolu\xe7\xe3o no sistema.</li>
<li>Mostrar danos j\xe1 registados e comparar com estado atual.</li>
<li>Registar novos danos, fotografias e observa\xe7\xf5es.</li>
<li>Apurar valor a cobrar, se aplic\xe1vel.</li>
<li>Cobrar no momento.</li>
<li>Fechar contrato no sistema.</li>
</ol>
<blockquote><strong>Decis\xe3o: Existem novos danos cobrados?</strong><br><strong>SIM</strong> → Cobrar, registar e s\xf3 depois fechar contrato.<br><strong>N\xc3O</strong> → Fechar contrato e libertar cliente.</blockquote>
<h3>6.1 Script de rece\xe7\xe3o na devolu\xe7\xe3o</h3>
<ul>
<li>Agradecer explicitamente o retorno do cliente.</li>
<li>Perguntar como correu a viagem e se houve qualquer problema com a viatura.</li>
<li>Abrir a inspe\xe7\xe3o <strong>com o cliente presente</strong>; nunca inspecionar primeiro e explicar depois.</li>
</ul>
<h3>6.2 Inspe\xe7\xe3o sempre acompanhada</h3>
<p>O operador deve percorrer a viatura com o cliente, mostrar os danos previamente existentes e validar, no momento, qualquer diferen\xe7a identificada. <strong>Transpar\xeancia reduz conflito.</strong></p>
<h3>6.3 Fecho administrativo</h3>
<ul>
<li>Ap\xf3s pagamento/regulariza\xe7\xe3o, fechar reserva e contrato no sistema.</li>
<li>Os danos registados ficam dispon\xedveis para a sede avaliar repara\xe7\xe3o, prioridade e perman\xeancia da viatura em opera\xe7\xe3o.</li>
<li>A decis\xe3o de reparar, retirar ou manter a viatura \xe9 central; o papel do balc\xe3o \xe9 <strong>registar, cobrar e sinalizar</strong>.</li>
</ul>`},{title:"7. Pol\xedtica de inspe\xe7\xe3o, danos e cobran\xe7a",content:`<p>A inspe\xe7\xe3o deve ser <strong>simples, coerente e execut\xe1vel</strong>. No arranque, a pol\xedtica de danos deve privilegiar objetividade e baixa ambiguidade.</p>
<h3>Regras-base de danos operacionais</h3>
<ul>
<li><strong>Estado geral</strong> — Viatura sem odores desagrad\xe1veis e sem sujidade incompat\xedvel com nova entrega. Se impeditivo, retirar de servi\xe7o.</li>
<li><strong>Danos menores</strong> — Riscos at\xe9 ao limiar interno definido n\xe3o geram tratamento especial, salvo exce\xe7\xe3o documentada. Aplicar sempre a mesma regra em toda a rede.</li>
<li><strong>Danos cobrados</strong> — Novos danos vis\xedveis acima do limiar definido, para-choques partidos, vidro, jante, interior ou outros danos materialmente relevantes. Cobran\xe7a conforme tabela interna em vigor.</li>
<li><strong>Prova</strong> — Sempre fotografar e anexar \xe0 inspe\xe7\xe3o. Sem fotografia, o caso fica fragilizado.</li>
<li><strong>Cobran\xe7a</strong> — No momento da devolu\xe7\xe3o, por cart\xe3o/multibanco. N\xe3o deixar o cliente sair sem resolu\xe7\xe3o ou acordo formal registado.</li>
</ul>
<blockquote><strong>Tabela de danos.</strong> A tabela detalhada de pre\xe7os deve existir como anexo controlado por vers\xe3o. O balc\xe3o n\xe3o deve improvisar valores; deve usar a grelha em vigor.</blockquote>`},{title:"7.1 Vistoria de sa\xedda — interior, contadores e verifica\xe7\xe3o funcional",content:`<p>Na vistoria de sa\xedda, a equipa deve validar n\xe3o apenas o exterior da viatura, mas tamb\xe9m o interior, os contadores principais e uma verifica\xe7\xe3o funcional r\xe1pida. Esta etapa <strong>protege a opera\xe7\xe3o</strong> e evita discuss\xf5es na devolu\xe7\xe3o.</p>
<h3>Interior</h3>
<ul>
<li>Fotografar bancos da frente e de tr\xe1s, tablier e bagageira.</li>
<li>Confirmar o estado geral do interior, sem rasgos, manchas graves, odores ou falta de componentes relevantes.</li>
<li>Verificar se a viatura cont\xe9m os documentos obrigat\xf3rios, manual e restantes itens que devam acompanhar a entrega.</li>
</ul>
<h3>Contadores e leituras de sa\xedda</h3>
<ul>
<li>Registar quilometragem, n\xedvel de combust\xedvel ou carga e qualquer indicador relevante vis\xedvel no quadro.</li>
<li>Garantir que a leitura de sa\xedda fica associada \xe0 inspe\xe7\xe3o para compara\xe7\xe3o direta no regresso.</li>
</ul>
<h3>Verifica\xe7\xe3o funcional r\xe1pida</h3>
<ul>
<li>Confirmar funcionamento b\xe1sico de luzes principais, piscas e limpeza do para-brisas.</li>
<li>Sempre que operacionalmente poss\xedvel, validar aus\xeancia de alertas cr\xedticos vis\xedveis no painel antes da entrega.</li>
<li>Avisar o cliente para comunicar imediatamente qualquer anomalia que detete logo ap\xf3s a sa\xedda da base ou nos primeiros minutos de utiliza\xe7\xe3o.</li>
</ul>
<blockquote><strong>Princ\xedpio de execu\xe7\xe3o.</strong> A vistoria de sa\xedda deve ser simples, repet\xedvel e suficientemente completa para criar prova objetiva do estado da viatura no momento da entrega.</blockquote>`},{title:"7.2 Cliente recusa pagar — matriz de escalada",content:`<p>Quando o cliente recusa pagar, o operador deve manter <strong>postura calma</strong>, explicar a origem do valor, mostrar a evid\xeancia e pedir pagamento. Persistindo a recusa, aplica-se a matriz de escalada.</p>
<ol>
<li>Reexplicar o dano, a inspe\xe7\xe3o inicial e a evid\xeancia fotogr\xe1fica.</li>
<li>Solicitar pagamento imediato e registar a recusa.</li>
<li>Chamar respons\xe1vel do balc\xe3o.</li>
<li>Escalar para sede/apoio definido.</li>
<li>Se necess\xe1rio, formalizar participa\xe7\xe3o \xe0s autoridades por falta de pagamento de servi\xe7o ou seguir o circuito jur\xeddico definido.</li>
</ol>`}]},{name:"Opera\xe7\xe3o e exce\xe7\xf5es",description:"Atrasos, no-shows, extens\xf5es, upgrades, downgrades e walk-ins",color:"#5a6bba",order:4,articles:[{title:"8. Contratos em atraso, no-show, extens\xf5es e pend\xeancias",content:`<p>No fecho, o balc\xe3o deve tratar as <strong>reservas que n\xe3o levantaram</strong> e os <strong>contratos cuja data de fim j\xe1 passou</strong> sem devolu\xe7\xe3o confirmada.</p>
<h3>Pend\xeancias operacionais obrigat\xf3rias no fecho</h3>
<ul>
<li><strong>N\xe3o devolveu</strong> — Contrato ativo com data de fim anterior ao momento atual. A\xe7\xe3o: contactar cliente, registar resultado e, se houver extens\xe3o, atualizar data de fim.</li>
<li><strong>N\xe3o levantou</strong> — Reserva/contrato com data de in\xedcio passada e sem inspe\xe7\xe3o/pickup conclu\xeddo. A\xe7\xe3o: contactar cliente e decidir liberta\xe7\xe3o do carro.</li>
<li><strong>Cliente pede extens\xe3o</strong> — Contacto telef\xf3nico ou presencial. A\xe7\xe3o: verificar disponibilidade, atualizar sistema e confirmar cobran\xe7a adicional.</li>
<li><strong>Cliente n\xe3o atende</strong> — Pend\xeancia mant\xe9m-se vis\xedvel. Ticket continua aberto at\xe9 resolu\xe7\xe3o.</li>
</ul>
<blockquote><strong>Decis\xe3o operacional inicial.</strong> Na fase de arranque, o contacto a clientes com atraso/no-show ser\xe1 feito no pr\xf3prio balc\xe3o, sobretudo em per\xedodos de menor carga. Mais tarde, poder\xe1 transitar para a sede se o volume o justificar.</blockquote>
<h3>8.1 Registo de contacto</h3>
<p>A chamada deve idealmente ser efetuada por <strong>VoIP integrado com CRM</strong>, com registo autom\xe1tico do n\xfamero, resultado e, quando aplic\xe1vel, link da grava\xe7\xe3o. Se o sistema ainda n\xe3o estiver implementado, o operador deve registar manualmente o outcome no local definido.</p>
<ul>
<li><strong>Atendeu e pediu mais tempo</strong> → validar disponibilidade, prolongar no sistema e confirmar nova cobran\xe7a.</li>
<li><strong>Atendeu e recusou/est\xe1 em incumprimento</strong> → escalar conforme matriz.</li>
<li><strong>N\xe3o atendeu</strong> → manter pend\xeancia ativa e repetir tentativa segundo a pol\xedtica.</li>
<li><strong>Pickup n\xe3o realizado</strong> → decidir liberta\xe7\xe3o do carro segundo janela operacional definida.</li>
</ul>`},{title:"9. Upgrades, downgrades, indisponibilidade e compensa\xe7\xe3o",content:`<p>Este \xe9 um dos processos <strong>mais sens\xedveis da opera\xe7\xe3o</strong> porque impacta diretamente satisfa\xe7\xe3o, imagem da marca e utiliza\xe7\xe3o de frota.</p>
<h3>\xc1rvore de decis\xe3o para indisponibilidade</h3>
<ol>
<li>Cliente tem reserva para categoria/caracter\xedsticas definidas.</li>
<li>Viatura reservada n\xe3o est\xe1 dispon\xedvel.</li>
<li>Procurar viatura do mesmo segmento e mesmas caracter\xedsticas cr\xedticas.</li>
<li>Se n\xe3o houver, procurar upgrade imediato.</li>
<li>Se n\xe3o houver upgrade, avaliar downgrade com aceita\xe7\xe3o do cliente.</li>
<li>Se nenhuma solu\xe7\xe3o satisfat\xf3ria existir, escalar e procurar solu\xe7\xe3o externa/concorr\xeancia.</li>
</ol>
<blockquote><strong>Decis\xe3o: Existe viatura equivalente em transmiss\xe3o e energia?</strong><br><strong>SIM</strong> → Atribuir equivalente e manter experi\xeancia.<br><strong>N\xc3O</strong> → Aplicar upgrade; se imposs\xedvel, negociar downgrade com ajuste/compensa\xe7\xe3o.</blockquote>
<h3>9.1 Regras de equival\xeancia</h3>
<ul>
<li>As caracter\xedsticas cr\xedticas s\xe3o, no m\xednimo, <strong>transmiss\xe3o</strong> e <strong>tipo de motoriza\xe7\xe3o/energia</strong>.</li>
<li>Cliente que reservou autom\xe1tico deve receber autom\xe1tico sempre que operacionalmente poss\xedvel.</li>
<li>Cliente que reservou el\xe9trico deve receber el\xe9trico ou solu\xe7\xe3o previamente aprovada; a expectativa \xe9 alta e n\xe3o deve ser tratada como detalhe.</li>
<li>Nunca entregar categoria inferior por conveni\xeancia interna sem explicar, obter aceita\xe7\xe3o e ajustar pre\xe7o/compensa\xe7\xe3o.</li>
</ul>
<h3>9.2 Prioridade de solu\xe7\xe3o</h3>
<ol>
<li>Mesma categoria e mesmas caracter\xedsticas.</li>
<li>Upgrade gratuito para categoria superior.</li>
<li>Downgrade aceite pelo cliente com ajuste financeiro e compensa\xe7\xe3o adequada.</li>
<li>Escalada imediata para sede quando n\xe3o h\xe1 carro ou quando a solu\xe7\xe3o afeta outra reserva cr\xedtica.</li>
</ol>
<h3>9.3 Regra de downgrade</h3>
<p>Quando houver downgrade, a regra comercial deve estar numa <strong>folha A4 simples e inequ\xedvoca</strong> para o balc\xe3o. O operador precisa de saber o que pode decidir sozinho.</p>
<ul>
<li><strong>Pre\xe7o</strong> — Cobrar pre\xe7o do downgrade segundo regra comercial em vigor ou aplicar desconto equivalente aprovado.</li>
<li><strong>Compensa\xe7\xe3o</strong> — Pode incluir ajuste de pre\xe7o, dia oferecido, cr\xe9dito futuro ou outro gesto autorizado.</li>
<li><strong>Aceita\xe7\xe3o</strong> — Cliente tem de aceitar explicitamente a solu\xe7\xe3o.</li>
<li><strong>Registo</strong> — Upgrade/downgrade deve ficar associado \xe0 reserva e matr\xedculas para BI e auditoria.</li>
</ul>
<blockquote><strong>Indicador de gest\xe3o.</strong> Upgrades e downgrades devem ser extra\xeddos para BI para medir quebra de servi\xe7o, press\xe3o de frota e custo comercial da opera\xe7\xe3o.</blockquote>`},{title:"10. Walk-ins, indisponibilidade e argument\xe1rio comercial",content:`<p>O cliente sem reserva \xe9 menos frequente, mas continua a ser uma <strong>oportunidade de receita e de marca</strong>.</p>
<h3>10.1 Processo walk-in</h3>
<ol>
<li>Perguntar para quando quer a reserva e por quanto tempo.</li>
<li>Identificar categoria pretendida e necessidades cr\xedticas.</li>
<li>Consultar disponibilidade no calend\xe1rio.</li>
<li>Se houver carro, criar reserva em nome do cliente e seguir processo normal de documenta\xe7\xe3o, pagamento e pickup.</li>
<li>Se n\xe3o houver, aplicar argument\xe1rio comercial por segmento.</li>
</ol>
<h3>10.2 Argument\xe1rio de substitui\xe7\xe3o comercial</h3>
<ul>
<li><strong>Categoria pedida n\xe3o existe</strong> → Apresentar alternativa superior pelo melhor diferencial poss\xedvel. Objetivo: converter venda.</li>
<li><strong>Existe categoria inferior</strong> → Explicar pr\xf3s e contras de forma honesta e propor ajuste de pre\xe7o. Objetivo: salvar venda sem frustra\xe7\xe3o excessiva.</li>
<li><strong>Cliente precisa de comercial/carrinha</strong> → Explicar capacidade real dispon\xedvel e propor combina\xe7\xe3o poss\xedvel. Objetivo: evitar promessa irreal.</li>
<li><strong>Sem carros</strong> → Convidar a reservar em janela posterior ou canal digital; recolher contacto. Objetivo: n\xe3o perder lead.</li>
</ul>
<blockquote><strong>Ticketing e filas.</strong> Quando a opera\xe7\xe3o ganhar escala, implementar sistema de ticketing/senha pode reduzir press\xe3o f\xedsica no balc\xe3o e aproveitar o contexto do shopping center. Enquanto n\xe3o existir, a equipa gere a fila manualmente com prioridade clara.</blockquote>`},{title:"19. Broker vs direto — comunica\xe7\xe3o, dep\xf3sito e danos",content:`<p>As reservas broker exigem comunica\xe7\xe3o diferente porque o cliente compra sobretudo pre\xe7o e, frequentemente, coberturas externas que n\xe3o est\xe3o integradas com a opera\xe7\xe3o Volto Drive.</p>
<h3>Diferen\xe7as operacionais por origem da reserva</h3>
<ul>
<li><strong>Discurso de venda</strong> — Direta: simplicidade, tudo inclu\xeddo e m\xednimo upselling. Broker: explicar o que vem inclu\xeddo e o que n\xe3o vem.</li>
<li><strong>Extras</strong> — Direta: s\xf3 os efetivamente necess\xe1rios. Broker: pode haver venda adicional de prote\xe7\xe3o, kms ou extras aplic\xe1veis.</li>
<li><strong>Coberturas externas</strong> — Direta: normalmente n\xe3o aplic\xe1vel. Broker: cliente pode ter cobertura com broker, mas a Volto Drive pode cobrar primeiro.</li>
<li><strong>Dep\xf3sito/cau\xe7\xe3o</strong> — Direta: segundo pol\xedtica direta. Broker: explicar claramente a regra antes da assinatura.</li>
<li><strong>Danos</strong> — Direta: processo normal. Broker: cliente paga \xe0 Volto Drive; eventual reembolso \xe9 tratado com o broker.</li>
</ul>
<blockquote><strong>Mensagem-chave ao cliente broker.</strong> A cobertura comprada no broker n\xe3o significa, por si s\xf3, que a Volto Drive abdica de cobran\xe7a no momento devido. O balc\xe3o deve explicar isto antes da entrega para evitar conflito na devolu\xe7\xe3o.</blockquote>
<h3>19.1 Script sugerido — reserva broker</h3>
<ul>
<li><em>"A sua reserva vem atrav\xe9s de parceiro externo; vou confirmar consigo o que est\xe1 inclu\xeddo e o que fica fora."</em></li>
<li><em>"Se existir dano ou cobran\xe7a aplic\xe1vel, a regulariza\xe7\xe3o \xe9 feita connosco e depois pode tratar o reembolso com o broker, se a sua cobertura o permitir."</em></li>
<li><em>"Vou mostrar-lhe agora as condi\xe7\xf5es essenciais antes de avan\xe7armos."</em></li>
</ul>`}]},{name:"Sistemas, seguran\xe7a e comunica\xe7\xe3o",description:"Documenta\xe7\xe3o, fraude, sistemas e n\xedveis de autonomia entre balc\xe3o e sede",color:"#8390cb",order:5,articles:[{title:"11. Documenta\xe7\xe3o, pagamentos, dep\xf3sitos e fraude",content:`<p>A disciplina financeira e documental <strong>protege a opera\xe7\xe3o</strong> de risco operacional, fraude e incumprimento.</p>
<h3>11.1 Pol\xedtica de pagamento</h3>
<ul>
<li>Sempre confirmar no sistema se a reserva est\xe1 paga ou n\xe3o.</li>
<li>Sempre que o pagamento online falhar ou seja insuficiente, regularizar em TPA f\xedsico/multibanco antes de libertar a viatura.</li>
<li>A pol\xedtica de dep\xf3sito/cau\xe7\xe3o deve estar clara por origem da reserva, tipo de cliente e categoria de viatura.</li>
<li>Reservas broker com coberturas externas exigem comunica\xe7\xe3o clara: a Volto Drive pode ter de cobrar primeiro e o cliente reclamar depois ao broker.</li>
</ul>
<h3>11.2 Sinais de alerta de fraude ou risco</h3>
<ul>
<li>Pressa excessiva e tentativa de pressionar o operador a ignorar etapas.</li>
<li>Inconsist\xeancia entre titular, cart\xe3o, documentos e comportamento.</li>
<li>Perguntas an\xf3malas sobre pe\xe7as, vers\xf5es espec\xedficas ou detalhes sem rela\xe7\xe3o com o aluguer normal.</li>
<li>Recusa em apresentar documentos f\xedsicos originais.</li>
<li>Tentativa de usar cart\xf5es tempor\xe1rios/limites improv\xe1veis sem alternativa cred\xedvel.</li>
<li>Sinais de \xe1lcool, incapacidade evidente de condu\xe7\xe3o ou comportamento agressivo.</li>
</ul>
<blockquote><strong>Direito de recusa.</strong> A Volto Drive reserva-se o direito de recusar entrega quando n\xe3o estejam reunidas condi\xe7\xf5es de seguran\xe7a, documenta\xe7\xe3o, pagamento ou confian\xe7a m\xednima. A recusa deve ser objetiva, calma e registada.</blockquote>
<h3>11.3 Cadeiras de crian\xe7a e extras obrigat\xf3rios</h3>
<p>As cadeiras e outros equipamentos regulados devem obedecer ao quick-reference legal em vigor e ao stock efetivamente dispon\xedvel. <strong>O balc\xe3o n\xe3o deve improvisar regras com base em mem\xf3ria</strong>; deve consultar o guia interno atualizado.</p>`},{title:"12. Sistemas, registos e ecossistema operacional",content:`<p>O operador <strong>n\xe3o trabalha apenas no WWM</strong>. O posto de trabalho deve ser concebido como um ecossistema simples e encadeado.</p>
<h3>Sistemas nucleares por fun\xe7\xe3o</h3>
<ul>
<li><strong>WWM</strong> — Reserva, contrato, inspe\xe7\xe3o e estado do cliente. Sistema-mestre da opera\xe7\xe3o.</li>
<li><strong>VoIP/telefonia</strong> — Contacto a clientes e registo de chamadas. Preferir integra\xe7\xe3o autom\xe1tica com CRM.</li>
<li><strong>CRM</strong> — Hist\xf3rico de contactos e comunica\xe7\xf5es. Sobretudo relevante para follow-up e auditoria.</li>
<li><strong>Google Workspace/portal interno</strong> — Procedimentos, formul\xe1rios e reportes. Fonte oficial de documentos em vigor.</li>
<li><strong>TPA/multibanco</strong> — Cobran\xe7a presencial. Obrigat\xf3rio dispon\xedvel e testado no in\xedcio do dia.</li>
</ul>
<blockquote><strong>Princ\xedpio de desenho.</strong> Sempre que poss\xedvel, reduzir o n\xfamero de ecr\xe3s e cliques vis\xedveis ao operador. O facto de existirem v\xe1rios sistemas n\xe3o deve transformar o balc\xe3o num cockpit ca\xf3tico.</blockquote>
<h3>12.1 Reporting m\xednimo do balc\xe3o</h3>
<ul>
<li>Resumo do dia: pickups, drop-offs, stock, atrasos e exce\xe7\xf5es.</li>
<li>Lista de contactos a clientes com outcome.</li>
<li>Upgrades/downgrades realizados.</li>
<li>Danos cobrados e contratos encerrados com observa\xe7\xe3o.</li>
<li>Incidentes de pagamento, fraude, recusa de entrega e reclama\xe7\xf5es.</li>
</ul>`},{title:"13. Comunica\xe7\xe3o com sede e n\xedveis de autonomia",content:`<p>Nem tudo deve subir \xe0 sede. O manual s\xf3 \xe9 \xfatil se separar claramente o que o balc\xe3o decide sozinho do que exige escalada.</p>
<h3>Matriz de autonomia</h3>
<ul>
<li><strong>Valida\xe7\xe3o documental</strong> — Balc\xe3o decide segundo regra. Escalar quando a documenta\xe7\xe3o gera d\xfavida material.</li>
<li><strong>Extens\xe3o com disponibilidade</strong> — Balc\xe3o decide. Escalar quando afeta reserva futura cr\xedtica ou exce\xe7\xe3o comercial.</li>
<li><strong>Upgrade simples</strong> — Balc\xe3o decide. Escalar quando implica custo relevante ou \xfaltima unidade cr\xedtica.</li>
<li><strong>Downgrade com compensa\xe7\xe3o padr\xe3o</strong> — Balc\xe3o decide se estiver na folha A4. Escalar quando exige exce\xe7\xe3o fora da grelha.</li>
<li><strong>Cliente em incumprimento s\xe9rio</strong> — Sempre escalar para sede.</li>
<li><strong>Repara\xe7\xe3o/retirada de frota</strong> — Sempre escalar para sede.</li>
<li><strong>Conflito grave/amea\xe7a/pol\xedcia</strong> — Sempre escalar e <strong>de imediato</strong>.</li>
</ul>`}]},{name:"Gest\xe3o, forma\xe7\xe3o e KPI",description:"Gest\xe3o documental, forma\xe7\xe3o, KPI, opera\xe7\xe3o em shopping e anexos pr\xe1ticos",color:"#adb5dd",order:6,articles:[{title:"14. Gest\xe3o documental, vers\xf5es e disponibilidade dos procedimentos",content:`<p>Os procedimentos precisam de estar dispon\xedveis online e em papel controlado. <strong>O que mata a consist\xeancia n\xe3o \xe9 a falta de documentos; \xe9 a coexist\xeancia de documentos errados.</strong></p>
<ul>
<li>Existe sempre uma vers\xe3o oficial online com hist\xf3rico de revis\xf5es.</li>
<li>Cada balc\xe3o mant\xe9m pasta f\xedsica de consulta r\xe1pida para situa\xe7\xf5es sem acesso imediato ao portal.</li>
<li>Toda a impress\xe3o local deve indicar vers\xe3o e data em vigor.</li>
<li>Sempre que um procedimento muda, a base deve substituir a vers\xe3o f\xedsica e registar a atualiza\xe7\xe3o.</li>
<li>Uma decis\xe3o tomada hoje ser\xe1 auditada contra a vers\xe3o em vigor nessa data, <strong>n\xe3o contra vers\xf5es futuras</strong>.</li>
</ul>
<h3>Controlo de vers\xf5es — campos m\xednimos</h3>
<ul>
<li><strong>C\xf3digo do documento</strong> — Ex.: VD-OPS-BALC-001.</li>
<li><strong>Vers\xe3o</strong> — v1.0, v1.1, etc.</li>
<li><strong>Data de entrada em vigor</strong> — Data exata.</li>
<li><strong>Respons\xe1vel pela aprova\xe7\xe3o</strong> — Nome/fun\xe7\xe3o.</li>
<li><strong>Resumo da altera\xe7\xe3o</strong> — O que mudou.</li>
<li><strong>Distribui\xe7\xe3o</strong> — Bases/equipas afetadas.</li>
</ul>`},{title:"15. Forma\xe7\xe3o, certifica\xe7\xe3o e arranque de equipas",content:`<p>A forma\xe7\xe3o deve cobrir <strong>processos, sistemas e crit\xe9rios de decis\xe3o</strong>. N\xe3o basta saber clicar; \xe9 preciso saber decidir.</p>
<h3>Pacote m\xednimo de forma\xe7\xe3o de arranque</h3>
<ul>
<li><strong>WWM</strong> — Reservas, contratos, inspe\xe7\xf5es, estados e alertas.</li>
<li><strong>Pagamentos</strong> — TPA, reservas pagas, falhas e dep\xf3sitos.</li>
<li><strong>Telefonia/CRM</strong> — Chamadas, registos e outcomes.</li>
<li><strong>Procedimentos</strong> — Pickup, drop-off, danos, atrasos, upgrades, fraude.</li>
<li><strong>Atendimento</strong> — Scripts e gest\xe3o de conflito.</li>
<li><strong>Portal interno</strong> — Onde consultar regras, anexos e vers\xf5es.</li>
</ul>
<blockquote><strong>Boas pr\xe1ticas de aprendizagem.</strong> No arranque, cada operador deve fazer shadowing, checklist assistida e teste final breve. O objetivo \xe9 evitar improvisa\xe7\xe3o quando chegarem as ondas de clientes.</blockquote>`},{title:"16. KPI operacionais do balc\xe3o",content:`<p>Medir a opera\xe7\xe3o permite <strong>corrigir processos antes que o problema chegue ao cliente</strong>.</p>
<h3>KPI recomendados</h3>
<ul>
<li><strong>Tempo m\xe9dio de pickup</strong> — Da chegada ao fecho do contrato. Uso: dimensionamento de equipa e simplifica\xe7\xe3o.</li>
<li><strong>Tempo m\xe9dio de drop-off</strong> — Da rece\xe7\xe3o ao fecho do contrato. Uso: efici\xeancia e experi\xeancia final.</li>
<li><strong>% reservas com documenta\xe7\xe3o validada \xe0 primeira</strong> — Qualidade do processo. Uso: treino e UX.</li>
<li><strong>% upgrades/downgrades</strong> — Press\xe3o de frota. Uso: planeamento e imagem.</li>
<li><strong>No-shows e atrasos por base</strong> — Disciplina comercial. Uso: a\xe7\xe3o preventiva.</li>
<li><strong>Danos cobrados/danos contestados</strong> — Qualidade da inspe\xe7\xe3o. Uso: treino e pol\xedtica.</li>
<li><strong>NPS/rating/reviews</strong> — Experi\xeancia do cliente. Uso: incentivos e coaching.</li>
</ul>`},{title:"17. Opera\xe7\xe3o em shopping center e gest\xe3o de picos",content:`<p>Operar em shopping center tem vantagens e restri\xe7\xf5es: <strong>conforto para o cliente, visibilidade e conveni\xeancia</strong>, mas tamb\xe9m programas de loja, ondas de procura e press\xe3o de staff.</p>
<ul>
<li>Confirmar hor\xe1rios de opera\xe7\xe3o acordados com seguran\xe7a/gest\xe3o do centro.</li>
<li>Dimensionar pausas e presen\xe7a com base nos voos, chegadas e janelas de pico relevantes.</li>
<li>Manter o balc\xe3o limpo, leg\xedvel e com informa\xe7\xe3o simples.</li>
<li>Quando a fila crescer, concentrar a equipa em desbloquear identifica\xe7\xe3o, documenta\xe7\xe3o e clientes j\xe1 prontos.</li>
<li>Explorar progressivamente pr\xe9-check-in, app e tablet para retirar tempo administrativo do balc\xe3o.</li>
</ul>
<blockquote><strong>Pr\xe9-check-in.</strong> \xc9 recomend\xe1vel incentivar check-in pr\xe9vio e carregamento antecipado de documentos, sobretudo em reservas diretas e broker com alto volume. Isto reduz tempo ao balc\xe3o, mas <strong>n\xe3o elimina verifica\xe7\xe3o f\xedsica dos documentos</strong>.</blockquote>`},{title:"18. Anexos operacionais — checklists prontos a usar",content:`<h3>Checklist de pickup — balc\xe3o</h3>
<ul>
<li>Cumprimentar e identificar cliente.</li>
<li>Confirmar se a reserva \xe9 direta ou broker.</li>
<li>Abrir reserva no WWM.</li>
<li>Ver documentos f\xedsicos originais.</li>
<li>Carregar/validar documenta\xe7\xe3o na plataforma.</li>
<li>Confirmar pagamento/dep\xf3sito/pend\xeancias.</li>
<li>Confirmar viatura e inspe\xe7\xe3o pr\xe9via.</li>
<li>Explicar danos existentes e condi\xe7\xf5es do contrato.</li>
<li>Recolher assinatura.</li>
<li>Entregar viatura e encerrar atendimento.</li>
</ul>
<h3>Checklist de drop-off — balc\xe3o</h3>
<ul>
<li>Agradecer a devolu\xe7\xe3o e perguntar pela experi\xeancia.</li>
<li>Acompanhar cliente \xe0 viatura.</li>
<li>Abrir inspe\xe7\xe3o de devolu\xe7\xe3o.</li>
<li>Mostrar danos j\xe1 existentes.</li>
<li>Registar novos danos e fotografias.</li>
<li>Aplicar tabela de danos.</li>
<li>Cobrar no momento, se aplic\xe1vel.</li>
<li>Fechar contrato no sistema.</li>
<li>Sinalizar viatura para sede/frota quando necess\xe1rio.</li>
</ul>
<h3>Checklist de fecho do dia</h3>
<ul>
<li>Validar contratos em atraso de devolu\xe7\xe3o.</li>
<li>Validar pickups n\xe3o realizados.</li>
<li>Efetuar contactos pendentes e registar resultados.</li>
<li>Rever stock dispon\xedvel para o dia seguinte.</li>
<li>Identificar carros a lavar/reparar/retirar.</li>
<li>Fechar caixa e conciliar pagamentos.</li>
<li>Enviar ou gravar resumo operacional.</li>
</ul>
<h3>18.1 Folha A4 — decis\xe3o r\xe1pida para upgrades e downgrades</h3>
<ul>
<li><strong>Tenho carro igual em categoria, transmiss\xe3o e energia?</strong><br>SIM → Entregar e seguir. N\xc3O → Passar \xe0 pergunta seguinte.</li>
<li><strong>Tenho upgrade aceit\xe1vel imediato?</strong><br>SIM → Fazer upgrade e registar. N\xc3O → Passar \xe0 pergunta seguinte.</li>
<li><strong>Cliente aceita downgrade com ajuste/compensa\xe7\xe3o?</strong><br>SIM → Executar, registar e confirmar valor. N\xc3O → Escalar.</li>
<li><strong>Tenho solu\xe7\xe3o externa autorizada/sede?</strong><br>SIM → Aplicar solu\xe7\xe3o. N\xc3O → Comunicar indisponibilidade segundo script e escalar.</li>
</ul>
<h3>18.2 Checklist complementar — vistoria de sa\xedda</h3>
<ul>
<li>Fotografar bancos frente/tr\xe1s, tablier e bagageira.</li>
<li>Verificar documentos da viatura e manual.</li>
<li>Registar quilometragem e combust\xedvel/carga.</li>
<li>Validar luzes, piscas e limpeza do para-brisas.</li>
<li>Informar o cliente para reportar de imediato qualquer anomalia.</li>
</ul>
<blockquote><strong>Fecho.</strong> Este manual \xe9 um documento vivo. Deve mudar pouco, mas deve mudar quando a aprendizagem operacional o justificar. A for\xe7a do sistema est\xe1 em <strong>repetir um processo simples, claro e treinado</strong>.</blockquote>`},{title:"20. Gest\xe3o de filas, ticketing e pr\xe9-check-in",content:`<p>Quando houver ondas de procura, o balc\xe3o deve <strong>proteger tempo operacional</strong>. O objetivo \xe9 evitar filas desorganizadas e clientes bloqueados no espa\xe7o.</p>
<h3>Ferramentas recomendadas de descongestionamento</h3>
<ul>
<li><strong>Pr\xe9-check-in digital</strong> — Reduzir tempo de balc\xe3o e captura manual. Prioridade alta.</li>
<li><strong>Tablet no balc\xe3o</strong> — Assinatura, captura e apoio r\xe1pido. Prioridade alta.</li>
<li><strong>Ticketing/senha</strong> — Permitir ao cliente circular no shopping enquanto espera. Prioridade m\xe9dia.</li>
<li><strong>Comms proativas</strong> — Incentivar app, check-in e documenta\xe7\xe3o pr\xe9via. Prioridade alta.</li>
</ul>
<h3>20.1 Regras de triagem em fila</h3>
<ul>
<li>Clientes com pr\xe9-check-in e documentos prontos devem ser encaminhados mais rapidamente.</li>
<li>Clientes com devolu\xe7\xe3o simples devem ser absorvidos sem ficarem presos atr\xe1s de pickups complexos.</li>
<li>Sempre que poss\xedvel, separar trabalho de balc\xe3o e trabalho de parque/inspe\xe7\xe3o.</li>
<li>Em pico, o operador deve fazer s\xf3 o essencial e evitar explica\xe7\xf5es longas que possam ser remetidas para material j\xe1 preparado.</li>
</ul>
<blockquote><strong>Aplica\xe7\xe3o e app.</strong> A app deve ser usada como alavanca comercial e operacional: reservar, carregar dados, receber indica\xe7\xe3o de atendimento e reduzir tempo morto.</blockquote>`},{title:"21. Hor\xe1rios, staffing e organiza\xe7\xe3o humana da base",content:`<p>O hor\xe1rio deve ser definido <strong>pelo servi\xe7o real e pelas regras do local</strong>. O shopping influencia, mas a necessidade do cliente e a opera\xe7\xe3o de chegadas/partidas tamb\xe9m contam.</p>
<h3>Princ\xedpios de staffing</h3>
<ul>
<li><strong>Cobertura m\xednima</strong> — Garantir capacidade de atendimento, inspe\xe7\xe3o e pausa sem deixar o balc\xe3o exposto.</li>
<li><strong>Picos</strong> — Sobrepor pessoas nas horas de maior carga, n\xe3o distribuir uniforme todo o dia.</li>
<li><strong>Baixas/aus\xeancias</strong> — Ter plano de conting\xeancia por base.</li>
<li><strong>Fecho do dia</strong> — Reservar tempo administrativo para atrasos, contactos e reconcilia\xe7\xe3o.</li>
<li><strong>\xc9poca alta</strong> — Aceitar que parte do trabalho administrativo migra para fim do dia/horas de menor movimento.</li>
</ul>
<blockquote><strong>Sele\xe7\xe3o e forma\xe7\xe3o.</strong> O gestor local deve confirmar logo em recrutamento se a pessoa compreende o regime de hor\xe1rios de shopping/turismo. N\xe3o \xe9 detalhe; \xe9 condi\xe7\xe3o de perman\xeancia operacional.</blockquote>`},{title:"22. Incentivos, qualidade e disciplina de servi\xe7o",content:`<p>Mesmo em opera\xe7\xe3o de balc\xe3o, a equipa precisa de perceber o que \xe9 valorizado. A remunera\xe7\xe3o vari\xe1vel <strong>n\xe3o deve empurrar para venda for\xe7ada</strong>; deve empurrar para servi\xe7o, disciplina e contribui\xe7\xe3o comercial \xfatil.</p>
<h3>Componentes recomendadas de avalia\xe7\xe3o</h3>
<ul>
<li><strong>Qualidade de servi\xe7o</strong> — NPS, reviews, rating broker e qualidade de atendimento.</li>
<li><strong>Disciplina operacional</strong> — Cumprimento de processos, reconcilia\xe7\xe3o e registo correto.</li>
<li><strong>Performance comercial</strong> — Extras leg\xedtimos, convers\xe3o walk-in e resultados da base.</li>
<li><strong>Long term incentive</strong> — Benef\xedcio ligado \xe0 perman\xeancia e estabilidade na empresa.</li>
<li><strong>Avalia\xe7\xe3o 360</strong> — Autoavalia\xe7\xe3o, pares e superior com pesos definidos.</li>
</ul>
<blockquote><strong>Princ\xedpio de desenho de incentivos.</strong> O balc\xe3o n\xe3o deve vender cadeiras, extras ou upgrades a qualquer custo. Deve vender o que faz sentido para o cliente e para a opera\xe7\xe3o, <strong>sem destruir confian\xe7a</strong>.</blockquote>`}]}]};function A(a){return a.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,80)}async function B(a){let b=await (0,w.j2)();if(!b?.user)return v.NextResponse.json({error:"N\xe3o autenticado"},{status:401});let c=b.user;if(!c.isAdmin)return v.NextResponse.json({error:"Sem permiss\xe3o"},{status:403});let{searchParams:d}=new URL(a.url),e="true"===d.get("force"),f=await x.z.manualArticle.count({where:{archivedAt:null}});if(f>0&&!e)return v.NextResponse.json({error:`J\xe1 existem ${f} artigos. Usa ?force=true para arquivar e re-popular.`},{status:409});let g=await x.z.user.findUnique({where:{email:c.email}});if(!g)return v.NextResponse.json({error:"Utilizador n\xe3o encontrado"},{status:404});e&&f>0&&await x.z.manualArticle.updateMany({where:{archivedAt:null},data:{archivedAt:new Date}});let h=[],i=[];for(let a of z.categories){let c=await x.z.manualCategory.findUnique({where:{slug:A(a.name)}});for(let d of(c||(c=await x.z.manualCategory.create({data:{name:a.name,slug:A(a.name),description:a.description??null,color:a.color??null,order:a.order}}),h.push(a.name),await (0,y.A)({session:b,action:"CREATE",entity:"ArticleCategory",entityId:c.id,meta:{name:a.name,source:"seed-manual v1.1"}})),a.articles)){let a=A(d.title),e=a,f=1;for(;await x.z.manualArticle.findUnique({where:{slug:e}});)f+=1,e=`${a}-${f}`;let h=await x.z.manualArticle.create({data:{slug:e,categoryId:c.id}}),j=await x.z.manualArticleVersion.create({data:{articleId:h.id,title:d.title,content:d.content,changeNote:"Vers\xe3o inicial — Manual Operativo de Balc\xe3o v1.1 (09 mar\xe7o 2026)",authorId:g.id}});await x.z.manualArticle.update({where:{id:h.id},data:{currentVersionId:j.id}}),i.push(d.title),await (0,y.A)({session:b,action:"CREATE",entity:"Article",entityId:h.id,meta:{title:d.title,source:"seed-manual v1.1"}})}}return v.NextResponse.json({ok:!0,createdCategories:h.length,createdArticles:i.length,archivedExisting:e?f:0})}let C=new e.AppRouteRouteModule({definition:{kind:f.RouteKind.APP_ROUTE,page:"/api/admin/seed-manual/route",pathname:"/api/admin/seed-manual",filename:"route",bundlePath:"app/api/admin/seed-manual/route"},distDir:".next",relativeProjectDir:"",resolvedPagePath:"C:\\VoltoDrive Apps\\smartvolto portal\\src\\app\\api\\admin\\seed-manual\\route.ts",nextConfigOutput:"",userland:d,...{}}),{workAsyncStorage:D,workUnitAsyncStorage:E,serverHooks:F}=C;function G(){return(0,g.patchFetch)({workAsyncStorage:D,workUnitAsyncStorage:E})}async function H(a,b,c){c.requestMeta&&(0,h.setRequestMeta)(a,c.requestMeta),C.isDev&&(0,h.addRequestMeta)(a,"devRequestTimingInternalsEnd",process.hrtime.bigint());let d="/api/admin/seed-manual/route";"/index"===d&&(d="/");let e=await C.prepare(a,b,{srcPage:d,multiZoneDraftMode:!1});if(!e)return b.statusCode=400,b.end("Bad Request"),null==c.waitUntil||c.waitUntil.call(c,Promise.resolve()),null;let{buildId:g,params:v,nextConfig:w,parsedUrl:x,isDraftMode:y,prerenderManifest:z,routerServerContext:A,isOnDemandRevalidate:B,revalidateOnlyGenerated:D,resolvedPathname:E,clientReferenceManifest:F,serverActionsManifest:G}=e,H=(0,k.normalizeAppPath)(d),I=!!(z.dynamicRoutes[H]||z.routes[E]),J=async()=>((null==A?void 0:A.render404)?await A.render404(a,b,x,!1):b.end("This page could not be found"),null);if(I&&!y){let a=!!z.routes[E],b=z.dynamicRoutes[H];if(b&&!1===b.fallback&&!a){if(w.adapterPath)return await J();throw new t.NoFallbackError}}let K=null;!I||C.isDev||y||(K="/index"===(K=E)?"/":K);let L=!0===C.isDev||!I,M=I&&!L;G&&F&&(0,j.setManifestsSingleton)({page:d,clientReferenceManifest:F,serverActionsManifest:G});let N=a.method||"GET",O=(0,i.getTracer)(),P=O.getActiveScopeSpan(),Q=!!(null==A?void 0:A.isWrappedByNextServer),R=!!(0,h.getRequestMeta)(a,"minimalMode"),S=(0,h.getRequestMeta)(a,"incrementalCache")||await C.getIncrementalCache(a,w,z,R);null==S||S.resetRequestCache(),globalThis.__incrementalCache=S;let T={params:v,previewProps:z.preview,renderOpts:{experimental:{authInterrupts:!!w.experimental.authInterrupts},cacheComponents:!!w.cacheComponents,supportsDynamicResponse:L,incrementalCache:S,cacheLifeProfiles:w.cacheLife,waitUntil:c.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:void 0,onInstrumentationRequestError:(b,c,d,e)=>C.onRequestError(a,b,d,e,A)},sharedContext:{buildId:g}},U=new l.NodeNextRequest(a),V=new l.NodeNextResponse(b),W=m.NextRequestAdapter.fromNodeNextRequest(U,(0,m.signalFromNodeResponse)(b));try{let e,g=async a=>C.handle(W,T).finally(()=>{if(!a)return;a.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let c=O.getRootSpanAttributes();if(!c)return;if(c.get("next.span_type")!==n.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${c.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let f=c.get("next.route");if(f){let b=`${N} ${f}`;a.setAttributes({"next.route":f,"http.route":f,"next.span_name":b}),a.updateName(b),e&&e!==a&&(e.setAttribute("http.route",f),e.updateName(b))}else a.updateName(`${N} ${d}`)}),h=async e=>{var h,i;let j=async({previousCacheEntry:f})=>{try{if(!R&&B&&D&&!f)return b.statusCode=404,b.setHeader("x-nextjs-cache","REVALIDATED"),b.end("This page could not be found"),null;let d=await g(e);a.fetchMetrics=T.renderOpts.fetchMetrics;let h=T.renderOpts.pendingWaitUntil;h&&c.waitUntil&&(c.waitUntil(h),h=void 0);let i=T.renderOpts.collectedTags;if(!I)return await (0,p.I)(U,V,d,T.renderOpts.pendingWaitUntil),null;{let a=await d.blob(),b=(0,q.toNodeOutgoingHttpHeaders)(d.headers);i&&(b[s.NEXT_CACHE_TAGS_HEADER]=i),!b["content-type"]&&a.type&&(b["content-type"]=a.type);let c=void 0!==T.renderOpts.collectedRevalidate&&!(T.renderOpts.collectedRevalidate>=s.INFINITE_CACHE)&&T.renderOpts.collectedRevalidate,e=void 0===T.renderOpts.collectedExpire||T.renderOpts.collectedExpire>=s.INFINITE_CACHE?void 0:T.renderOpts.collectedExpire;return{value:{kind:u.CachedRouteKind.APP_ROUTE,status:d.status,body:Buffer.from(await a.arrayBuffer()),headers:b},cacheControl:{revalidate:c,expire:e}}}}catch(b){throw(null==f?void 0:f.isStale)&&await C.onRequestError(a,b,{routerKind:"App Router",routePath:d,routeType:"route",revalidateReason:(0,o.c)({isStaticGeneration:M,isOnDemandRevalidate:B})},!1,A),b}},k=await C.handleResponse({req:a,nextConfig:w,cacheKey:K,routeKind:f.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:z,isRoutePPREnabled:!1,isOnDemandRevalidate:B,revalidateOnlyGenerated:D,responseGenerator:j,waitUntil:c.waitUntil,isMinimalMode:R});if(!I)return null;if((null==k||null==(h=k.value)?void 0:h.kind)!==u.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==k||null==(i=k.value)?void 0:i.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});R||b.setHeader("x-nextjs-cache",B?"REVALIDATED":k.isMiss?"MISS":k.isStale?"STALE":"HIT"),y&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let l=(0,q.fromNodeOutgoingHttpHeaders)(k.value.headers);return R&&I||l.delete(s.NEXT_CACHE_TAGS_HEADER),!k.cacheControl||b.getHeader("Cache-Control")||l.get("Cache-Control")||l.set("Cache-Control",(0,r.getCacheControlHeader)(k.cacheControl)),await (0,p.I)(U,V,new Response(k.value.body,{headers:l,status:k.value.status||200})),null};Q&&P?await h(P):(e=O.getActiveScopeSpan(),await O.withPropagatedContext(a.headers,()=>O.trace(n.BaseServerSpan.handleRequest,{spanName:`${N} ${d}`,kind:i.SpanKind.SERVER,attributes:{"http.method":N,"http.target":a.url}},h),void 0,!Q))}catch(b){if(b instanceof t.NoFallbackError||await C.onRequestError(a,b,{routerKind:"App Router",routePath:H,routeType:"route",revalidateReason:(0,o.c)({isStaticGeneration:M,isOnDemandRevalidate:B})},!1,A),I)throw b;return await (0,p.I)(U,V,new Response(null,{status:500})),null}}},73136:a=>{a.exports=require("node:url")},74075:a=>{a.exports=require("zlib")},76760:a=>{a.exports=require("node:path")},79428:a=>{a.exports=require("buffer")},86439:a=>{a.exports=require("next/dist/shared/lib/no-fallback-error.external")},91645:a=>{a.exports=require("net")},92280:(a,b,c)=>{Object.defineProperty(b,"I",{enumerable:!0,get:function(){return g}});let d=c(28208),e=c(47617),f=c(62018);async function g(a,b,c,g){if((0,d.isNodeNextResponse)(b)){var h;b.statusCode=c.status,b.statusMessage=c.statusText;let d=["set-cookie","www-authenticate","proxy-authenticate","vary"];null==(h=c.headers)||h.forEach((a,c)=>{if("x-middleware-set-cookie"!==c.toLowerCase())if("set-cookie"===c.toLowerCase())for(let d of(0,f.splitCookiesString)(a))b.appendHeader(c,d);else{let e=void 0!==b.getHeader(c);(d.includes(c.toLowerCase())||!e)&&b.appendHeader(c,a)}});let{originalResponse:i}=b;c.body&&"HEAD"!==a.method?await (0,e.pipeToNodeResponse)(c.body,i,g):i.end()}}},94735:a=>{a.exports=require("events")},99749:a=>{a.exports=import("@prisma/client/runtime/query_compiler_fast_bg.mysql.mjs")}};var b=require("../../../../webpack-runtime.js");b.C(a);var c=b.X(0,[3445,5592,813,1104,8397],()=>b(b.s=68347));module.exports=c})();