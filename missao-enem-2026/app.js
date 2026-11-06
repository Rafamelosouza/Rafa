/* MISSÃO ENEM 2026 — aplicativo sem dependência de frameworks. © Rafaela Melo.
   Uma sala só é "ao vivo" quando o Supabase está configurado. */
(function () {
'use strict';
const CFG=window.MISSAO_ENEM_CONFIG||{};
const LIVE=!!(CFG.supabaseUrl && CFG.supabaseAnonKey);
const $=s=>document.querySelector(s);
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pathname=location.pathname;
const params=new URLSearchParams(location.search);
const genToken=()=>crypto.randomUUID()+crypto.randomUUID();
const badges=['A','B','C','D','E','F','G','H'];
const ghosts=[
{id:'red',color:'#ff7281',name:'Vermelho',thought:'E se eu não conseguir?',prompt:'Qual força você já usou quando precisou continuar mesmo diante de uma dificuldade?',choices:['Persistência para continuar','Coragem para tentar de novo','Disposição para buscar apoio','Capacidade de mudar a estratégia'],power:'PERSISTÊNCIA',debrief:'A persistência pode aparecer de diversas formas, inclusive quando mudamos de estratégia ou pedimos ajuda.'},
{id:'blue',color:'#68d4f9',name:'Azul',thought:'E se der um branco?',prompt:'Quando algo não saiu como esperado, o que já ajudou você a encontrar outro caminho?',choices:['Fazer uma pausa','Voltar ao que já conhecia','Pedir orientação','Tentar outra forma de resolver'],power:'ESTRATÉGIAS',debrief:'Ter recursos não é nunca travar. É reconhecer possibilidades de ação mesmo diante de momentos difíceis.'},
{id:'pink',color:'#ff9ed1',name:'Rosa',thought:'Todo mundo sabe mais!',prompt:'Qual aprendizagem sua merece mais reconhecimento neste momento?',choices:['Um assunto que compreendo melhor','Uma habilidade que desenvolvi','Uma dificuldade que enfrentei','Algo novo que descobri sobre mim'],power:'RECONHECIMENTO',debrief:'O avanço de uma pessoa não precisa ser comparado com o de outra para merecer reconhecimento.'},
{id:'orange',color:'#ffb76e',name:'Laranja',thought:'Preciso acertar tudo!',prompt:'O que seu esforço construiu além de notas e resultados?',choices:['Responsabilidade','Organização','Autoconhecimento','Capacidade de recomeçar'],power:'FLEXIBILIDADE',debrief:'O esforço tem valor, mas também é importante descansar, reconhecer limites e fazer escolhas possíveis.'},
{id:'purple',color:'#b8a0ff',name:'Roxo',thought:'Minha vida depende dessa prova!',prompt:'Qual qualidade sua continuará existindo depois do ENEM?',choices:['Minha curiosidade','Minha capacidade de aprender','Meus vínculos e valores','Minha possibilidade de construir caminhos'],power:'PERSPECTIVA',debrief:'O ENEM pode ser importante, mas não consegue resumir uma pessoa nem todas as possibilidades de sua trajetória.'},

{id:'green',color:'#86f0c4',name:'Verde',thought:'Não posso parar para descansar!',prompt:'Como você percebe que precisa de uma pausa durante uma rotina exigente?',choices:['Meu corpo mostra sinais de cansaço','Fico mais distraído','Uma pausa me ajuda a retomar','Posso respeitar meus limites'],power:'AUTOCUIDADO',debrief:'Descansar também é uma estratégia. Pausas ajudam a cuidar da atenção e respeitar os limites de cada pessoa.'},
{id:'yellow',color:'#ffe17a',name:'Amarelo',thought:'Só vale se eu tirar uma nota alta!',prompt:'O que também tem valor na sua trajetória, além do resultado de uma prova?',choices:['O que aprendi ao longo do caminho','O esforço que dediquei','As estratégias que desenvolvi','As pessoas e valores que me acompanham'],power:'VALOR PESSOAL',debrief:'Uma nota informa sobre uma prova. Ela não resume a dedicação, as aprendizagens nem o valor de uma pessoa.'},
{id:'turquoise',color:'#57e2d2',name:'Turquesa',thought:'Não sei o que vem depois!',prompt:'Quando o futuro parece incerto, que próximo passo possível pode ajudar?',choices:['Conversar com alguém de confiança','Pesquisar uma possibilidade de cada vez','Dar tempo para decidir','Lembrar que posso ajustar meus planos'],power:'POSSIBILIDADES',debrief:'Não é necessário resolver toda a vida de uma vez. Podemos explorar possibilidades e ajustar os planos com o tempo.'}
];
const inventario=[
{prompt:'Quando olho para minha caminhada até aqui, o que mais reconheço em mim?',choices:['Minha persistência','Minha coragem para tentar','Minha capacidade de aprender','Minha força para recomeçar'],talk:'Talvez o caminho não tenha sido perfeito. Mesmo assim, que provas reais temos do nosso crescimento?'},
{prompt:'Qual conquista minha talvez eu não tenha valorizado o suficiente?',choices:['Aprender algo que parecia difícil','Continuar em dias complicados','Superar alguma insegurança','Pedir ajuda quando precisei'],talk:'Nem toda conquista aparece em uma nota ou certificado.'},
{prompt:'Quando encontro uma dificuldade, qual força pessoal já demonstrei?',choices:['Persistência','Criatividade','Capacidade de adaptação','Coragem para buscar apoio'],talk:'As forças se desenvolvem e podem aparecer de maneiras diferentes em cada pessoa.'},
{prompt:'O que a preparação para o ENEM me ajudou a desenvolver?',choices:['Mais responsabilidade','Mais conhecimento','Mais autoconhecimento','Mais capacidade de organização'],talk:'Parte do aprendizado permanece com você depois do domingo.'},
{prompt:'Quando penso no que ainda não domino, o que posso reconhecer?',choices:['Posso continuar aprendendo','Posso usar outras estratégias','Posso respeitar meu ritmo','Posso reconhecer o que já sei'],talk:'Limitações em uma área não anulam as capacidades construídas em outras.'},
{prompt:'Qual mensagem eu gostaria de levar comigo para domingo?',choices:['Eu reconheço meu esforço','Posso confiar no que construí','Tenho recursos para enfrentar desafios','Meu valor vai além de uma prova'],talk:'Confiança não precisa significar certeza de um resultado. Pode significar reconhecer recursos reais.'}
];
const polls={
 mood:{prompt:'Se sua preparação para o ENEM fosse uma emoção hoje, qual seria?',choices:['😰 Ansiedade','😴 Cansaço','🤩 Expectativa','😎 Confiança','🤯 Tudo junto','❤️ Esperança','Prefiro não responder'],talk:'Sentir emoções intensas é compreensível. Não precisamos eliminar a ansiedade para agir.'},
 order:{prompt:'Qual fantasma o grupo quer enfrentar primeiro?',choices:ghosts.map(g=>g.name),talk:'O grupo ajuda a decidir por onde começaremos o labirinto.'},
 bag:{prompt:'Qual força você deseja levar simbolicamente para domingo?',choices:['Persistência','Coragem','Aprendizagem','Flexibilidade','Organização','Autocompaixão','Esperança','Capacidade de recomeçar'],talk:'Escolher uma força não significa que você precise senti-la o tempo inteiro.'}
};
ghosts.forEach(g=>polls['ghost_'+g.id]={prompt:g.prompt,choices:g.choices,talk:g.debrief});
inventario.forEach((q,i)=>polls['inv'+(i+1)]={...q});
const scenes=[
{title:'Abertura',kind:'intro'},{title:'Entrar no jogo',kind:'join'},{title:'Combinados',kind:'rules'},
{title:'Como eu chego?',kind:'poll',poll:'mood'},{title:'Toda emoção tem lugar',kind:'feelings'},
{title:'Labirinto dos fantasmas',kind:'maze',poll:'order'},
...ghosts.map((g,i)=>({title:'Fantasma '+g.name,kind:'ghost',ghost:i,poll:'ghost_'+g.id})),
{title:'Poderes desbloqueados',kind:'powers'},{title:'Inventário de forças',kind:'inventoryIntro'},
...inventario.map((_,i)=>({title:'Força '+(i+1),kind:'poll',poll:'inv'+(i+1)})),
{title:'Botão de pausa',kind:'pause'},{title:'Mochila invisível',kind:'bag',poll:'bag'},
{title:'Missão cumprida',kind:'final'}
];
const s={
mode:params.get('modo')||'home',
demo:false,live:LIVE,roomCode:params.get('codigo')||localStorage.getItem('enem_room_code')||'',
hostToken:sessionStorage.getItem('enem_host_token')||'',
partToken:localStorage.getItem('enem_part_token')||'',
joined:false,scene:0,remote:null,choices:{},powers:{},showAdmin:false,showTalk:false,
showResults:false,reduced:localStorage.getItem('enem_reduce_motion')==='yes',
startedAt:Number(sessionStorage.getItem('enem_started_at')||0),simCount:0,error:'',
busy:false,lastSignature:'',pollInterval:null
};
if(!s.partToken){s.partToken=genToken();localStorage.setItem('enem_part_token',s.partToken)}
function url(mode,code){const p=new URLSearchParams({modo:mode});if(code)p.set('codigo',code);return location.origin+pathname+'?'+p.toString()}
function nav(mode){location.href=url(mode)}
function timeText(){if(!s.startedAt)return '60:00';const secs=Math.max(0,3600-Math.floor((Date.now()-s.startedAt)/1000));return String(Math.floor(secs/60)).padStart(2,'0')+':'+String(secs%60).padStart(2,'0')}
function ghostSvg(color,size=130){return '<svg viewBox="0 0 80 90" width="'+size+'" height="'+Math.round(size*1.12)+'" aria-hidden="true"><path d="M8 80V37a32 32 0 0 1 64 0v43l-12-9-12 9-12-9-12 9-12-9Z" fill="'+color+'"/><ellipse cx="31" cy="39" rx="11" ry="14" fill="white"/><ellipse cx="55" cy="39" rx="11" ry="14" fill="white"/><circle cx="34" cy="42" r="5.5" fill="#14234c"/><circle cx="58" cy="42" r="5.5" fill="#14234c"/></svg>'}
function pacSvg(){return '<svg class="spark" viewBox="0 0 340 270" role="img" aria-label="Personagem amarelo acompanhado de fantasmas coloridos"><defs><filter id="glow"><feGaussianBlur stdDeviation="6"/></filter></defs><path d="M0 30h110M230 30h110M20 240h300" stroke="#405caa" stroke-width="8" stroke-linecap="round" stroke-dasharray="15 15"/><circle cx="135" cy="145" r="74" fill="#ffe179"/><path d="M135 145L201 97A80 80 0 0 1 201 194Z" fill="#131d42"/><circle cx="128" cy="104" r="6" fill="#13234a"/><g transform="translate(225 18) scale(.6)">'+ghostSvg('#ff818d',90).replace('<svg viewBox="0 0 80 90" width="90" height="101" aria-hidden="true">','').replace('</svg>','')+'</g><g transform="translate(230 143) scale(.54)">'+ghostSvg('#83dcfb',90).replace('<svg viewBox="0 0 80 90" width="90" height="101" aria-hidden="true">','').replace('</svg>','')+'</g></svg>'}
function header(extra=''){return '<header class="topbar"><div class="brand"><span class="dot"></span> MISSÃO ENEM <span style="color:var(--yellow)">2026</span></div><div class="actions"><span class="pill '+(s.demo||!LIVE?'demo':'')+'">'+(s.demo||!LIVE?'MODO ENSAIO • SEM VOTOS AO VIVO':'AO VIVO')+'</span>'+extra+'</div></header>'}
function buttons(text,action,cl=''){return '<button type="button" class="btn '+cl+'" data-action="'+action+'">'+text+'</button>'}
function stageProgress(){return '<div class="progress"><span style="width:'+Math.round((s.scene+1)/scenes.length*100)+'%"></span></div>'}
async function rpc(name,data){if(!LIVE)throw Error('Supabase não configurado. Use o modo ensaio.');const base=CFG.supabaseUrl.replace(/\/$/,'');const resp=await fetch(base+'/rest/v1/rpc/'+name,{method:'POST',headers:{'apikey':CFG.supabaseAnonKey,'Authorization':'Bearer '+CFG.supabaseAnonKey,'Content-Type':'application/json'},body:JSON.stringify(data)});
 let obj;try{obj=await resp.json()}catch(e){obj=null}if(!resp.ok)throw Error(obj?.message||('Falha na conexão ('+resp.status+')'));return obj}
async function newRoom(){if(!LIVE){s.error='Para criar sala ao vivo, configure o Supabase. Você pode testar o modo ensaio agora.';render();return}try{s.busy=true;s.hostToken=genToken();const r=await rpc('enem_new_room',{p_host_token:s.hostToken});s.roomCode=r.code;s.scene=0;s.demo=false;sessionStorage.setItem('enem_host_token',s.hostToken);localStorage.setItem('enem_room_code',s.roomCode);s.startedAt=Date.now();sessionStorage.setItem('enem_started_at',s.startedAt);s.remote=null;s.error='';s.mode='apresentar';history.replaceState({},'',url('apresentar',s.roomCode));await refresh();render()}catch(e){s.error=e.message;render()}finally{s.busy=false}}
function tryDemo(){s.demo=true;s.scene=0;s.roomCode='ENSAIO';s.startedAt=Date.now();sessionStorage.setItem('enem_started_at',s.startedAt);s.remote=null;s.error='';s.mode='apresentar';history.replaceState({},'',url('apresentar'));render()}
async function join(){const inp=$('#roomCodeInput');const code=(inp?inp.value:s.roomCode).trim().toUpperCase().replace(/[^A-Z0-9]/g,'');if(!code){s.error='Digite o código informado no telão.';render();return}if(!LIVE){s.error='Este endereço ainda não foi conectado ao servidor. A participação simultânea exige a configuração do Supabase.';render();return}try{await rpc('enem_join_room',{p_code:code,p_part_token:s.partToken});s.roomCode=code;s.joined=true;s.error='';history.replaceState({},'',url('participar',code));await refresh();render()}catch(e){s.error=e.message;render()}}
async function refresh(){if(s.demo||!LIVE||!s.roomCode)return;
try{const data=await rpc('enem_room_state',{p_code:s.roomCode});if(!data||data.error)throw Error(data?.error||'Sala indisponível');s.remote=data;if(s.mode==='apresentar')s.scene=data.scene;const sig=JSON.stringify(data);if(sig!==s.lastSignature){s.lastSignature=sig;render()}}
catch(e){s.error=e.message;if(s.mode==='participar')s.joined=false;render()}}
function pollId(){return scenes[s.scene]?.poll||null}
async function setScene(idx,open=false){idx=Math.min(Math.max(0,idx),scenes.length-1);
 if(s.demo){s.scene=idx;s.simCount=0;s.showResults=false;render();return}
 try{await rpc('enem_set_room',{p_code:s.roomCode,p_host_token:s.hostToken,p_scene:idx,p_poll_id:scenes[idx].poll||null,p_open:open});s.scene=idx;s.showResults=false;await refresh()}catch(e){s.error=e.message;render()}}
async function pollToggle(open){if(s.demo){s.simCount=open?0:s.simCount;s.showResults=!open;render();return}await setScene(s.scene,open)}
async function vote(idx){const poll=s.remote?.active_poll; if(!s.joined||!poll||!s.remote?.poll_open)return;try{await rpc('enem_submit_vote',{p_code:s.roomCode,p_part_token:s.partToken,p_poll_id:poll,p_choice:idx});s.choices[poll]=idx;s.error='';await refresh();render()}catch(e){s.error=e.message;render()}}
async function endRoom(){if(!confirm('Apagar a sala e TODAS as respostas permanentemente?'))return;try{if(!s.demo)await rpc('enem_delete_room',{p_code:s.roomCode,p_host_token:s.hostToken});s.demo=false;s.remote=null;s.roomCode='';s.hostToken='';s.scene=0;s.mode='home';localStorage.removeItem('enem_room_code');sessionStorage.removeItem('enem_host_token');history.replaceState({},'',location.pathname);render()}catch(e){s.error=e.message;render()}}
function qrPlaceholder(){return '<div class="qrbox"><div id="qrcode" role="img" aria-label="QR Code de acesso aos participantes"><span style="color:#19223d">QR CODE</span></div></div>'}
function qrReady(){const elem=$('#qrcode');if(!elem||!window.QRCode)return;elem.innerHTML='';new window.QRCode(elem,{text:url('participar',s.roomCode),width:156,height:156,colorDark:'#18264b',colorLight:'#ffffff',correctLevel:window.QRCode.CorrectLevel.M})}
function resultsHTML(id){const poll=polls[id];if(!poll)return '';let counts=new Array(poll.choices.length).fill(0);
 if(s.demo){if(s.simCount>0)counts=counts.map((_,i)=>Math.floor((3+(i*11+5)%13)*s.simCount/30));}
 else {const vals=s.remote?.counts||[];for(const x of vals){if(x.choice>=0&&x.choice<counts.length)counts[x.choice]=Number(x.qty)}}
 const total=counts.reduce((a,b)=>a+b,0);return '<div class="card lower"><div class="actions"><span class="pill">'+total+' participação(ões)'+(s.demo?' • simulação':'')+'</span>'+((s.remote?.poll_open||s.demo)&&total===0?'<span class="muted small">As respostas aparecerão aqui.</span>':'')+'</div>'+
 (total>0?poll.choices.map((text,i)=>'<div class="result"><div>'+E(text)+'</div><div class="bar"><div class="fill" style="width:'+(100*counts[i]/total).toFixed(1)+'%"></div></div><div style="text-align:right">'+Math.round(100*counts[i]/total)+'%</div></div>').join(''):'<p class="muted small lower">Ainda não há respostas para esta pergunta.</p>')+'</div>'}
function questionCard(id){const p=polls[id];return '<section class="scene"><div class="kicker">PARTICIPE PELO CELULAR · NÃO HÁ RESPOSTAS CERTAS</div><h2 class="question">'+E(p.prompt)+'</h2><p class="muted">Responda no celular. Cada escolha representa uma maneira legítima de olhar para sua própria trajetória.</p>'+
 (s.demo?'<div class="notice">Demonstração: as respostas exibidas são fictícias e não representam participantes reais.</div>':'')+
 (s.demo?'<div class="actions lower">'+buttons('Simular votos (demonstração)','simulate')+'</div>':
 '<div class="statusbar"><span class="pill">'+(s.remote?.poll_open?'Votação aberta':'Votação fechada')+'</span><span class="pill">'+(s.remote?.participants||0)+' participantes</span></div>')+
 (s.showResults||(!s.remote?.poll_open&&!s.demo)?resultsHTML(id):'<div class="inner lower">Os gráficos ficam ocultos enquanto a votação está aberta. Use “Mostrar gráficos” para revelá-los.</div>')+
 (s.showTalk?'<div class="feedback"><b>Fala de apoio:</b> '+E(p.talk)+'</div>':'')+'</section>'}
function powerCard(power){return '<div class="power">✦ PODER DESBLOQUEADO: '+E(power)+'</div>'}
function showScene(){
const d=scenes[s.scene],g=d.kind;
if(g==='intro')return '<section class="hero"><div><div class="kicker">SÁBADO, 7 DE NOVEMBRO DE 2026 · 60 MINUTOS</div><h1>O PODER JÁ<br><span class="big-em">ESTÁ EM VOCÊ!</span></h1><p class="lead">Uma aventura sobre o que você aprendeu, enfrentou e construiu até aqui. Amanhã tem ENEM. Hoje, vamos reconhecer sua jornada.</p><div class="actions">'+buttons('INICIAR A MISSÃO →','next')+'</div></div><div>'+pacSvg()+'</div></section>';
if(g==='join')return '<section class="scene center"><div class="kicker">FASE 01 / PORTAL DE ENTRADA</div><h2>Você faz parte desta missão.</h2><p>Use o celular para participar. Não precisa instalar aplicativo nem informar seu nome.</p><div class="grid2 lower"><div class="card"><h3>Entre pelo QR Code</h3>'+(!s.demo?qrPlaceholder():'<div class="notice">No modo ensaio, o QR Code real não conecta outros aparelhos.</div>')+'</div><div class="card"><h3>Ou use o código</h3><div class="joincode">'+E(s.roomCode||'---')+'</div><p class="footnote share">'+(s.demo?'Configuração de teste, sem participantes remotos.':E(url('participar',s.roomCode)))+'</p><p>Participar é voluntário. Você também pode apenas acompanhar.</p></div></div></section>';
if(g==='rules')return '<section class="scene"><div class="kicker">NOSSO COMBINADO</div><h2>Não é uma competição.<br><span class="accent">É uma jornada coletiva.</span></h2><div class="grid2 lower"><div class="inner">✅ Não existem respostas certas sobre suas forças.</div><div class="inner">🤝 Respeitamos as histórias e escolhas dos outros.</div><div class="inner">💬 Você não precisa contar nada pessoal em público.</div><div class="inner">🌱 Seu valor não é definido por uma prova.</div></div></section>';
if(g==='poll')return questionCard(d.poll);
if(g==='feelings')return '<section class="scene"><div class="kicker">PAUSA REFLEXIVA</div><h2>Você pode sentir medo<br><span class="accent">e ainda assim continuar.</span></h2><p class="lead">Ansiedade, esperança, cansaço e expectativa podem coexistir. Não precisamos exigir calma perfeita de ninguém.</p><div class="feedback"><div class="quote">“O que sinto é parte da experiência. Não é a única coisa que me define.”</div></div></section>';
if(g==='maze')return '<section class="scene"><div class="kicker">FASE 02 / O LABIRINTO</div><h2>Quem vamos enfrentar primeiro?</h2><p class="muted">Os fantasmas representam pensamentos desafiadores. Escolha um deles para abrir uma missão. Cada um guarda uma força para desbloquear.</p><div class="ghost-grid">'+ghosts.map((g,i)=>'<button class="ghost-card '+(s.powers[g.id]?'done':'')+'" data-scene="'+(i+6)+'">'+ghostSvg(g.color,95)+'<small>'+E(g.name)+'</small><div class="small muted">'+(s.powers[g.id]?'✓ Desbloqueado':'Abrir missão')+'</div></button>').join('')+'</div><div class="actions">'+buttons('Votação: escolher primeiro','order')+buttons('Ir ao painel de forças →','powers','alt')+'</div>'+(s.showResults?resultsHTML('order'):'')+'</section>';
if(g==='ghost'){
const gh=ghosts[d.ghost],id=d.poll;
return '<section class="scene"><div class="grid2"><div><div class="kicker">FANTASMA '+(d.ghost+1)+' DE 5</div><h2 style="color:'+gh.color+'">'+E(gh.thought)+'</h2><p>'+E(gh.prompt)+'</p><div class="actions">'+(s.powers[gh.id]?powerCard(gh.power):buttons('✦ DESBLOQUEAR PODER','unlock'))+'</div></div><div class="center">'+ghostSvg(gh.color,205)+'</div></div>'+
 (s.demo?'<div class="notice lower">Modo ensaio: resultados ilustrativos.</div>':'<div class="statusbar"><span class="pill">'+(s.remote?.poll_open?'Votação aberta':'Abra a votação para receber respostas')+'</span></div>')+
 (s.showResults||(!s.remote?.poll_open&&!s.demo)?resultsHTML(id):'<div class="inner lower">Convide os adolescentes a responder no celular. Depois, discuta por 30 segundos com um colega.</div>')+
 '<div class="actions lower">'+buttons('↶ Voltar ao labirinto','maze','alt')+buttons('Próxima missão →','next','ghost')+'</div>'+
 (s.showTalk?'<div class="feedback"><b>Intervenção breve:</b> '+E(gh.debrief)+'</div>':'')+'</section>'}
if(g==='powers')return '<section class="scene center"><div class="kicker">CONQUISTAS DO GRUPO</div><h2>Suas forças não começaram hoje.</h2><p>As missões só ajudaram a iluminar recursos que podem já estar presentes na sua história.</p><div class="grid3 lower">'+ghosts.map(gh=>'<div class="inner">'+ghostSvg(gh.color,80)+'<h3>'+E(gh.power)+'</h3><div class="muted small">'+(s.powers[gh.id]?'Reconhecido no jogo':'A reconhecer')+'</div></div>').join('')+'</div></section>';
if(g==='inventoryIntro')return '<section class="scene center"><div class="kicker">FASE 03 / INVENTÁRIO DAS FORÇAS</div><h2>Talvez você esteja olhando demais<br>para o que falta…</h2><div class="feedback quote">E se hoje você olhasse para o que já construiu?</div><p class="lower">Seis perguntas. Nenhuma resposta certa ou errada. Apenas a sua trajetória.</p></section>';
if(g==='pause')return '<section class="scene"><div class="kicker">FASE 04 / BOTÃO DE PAUSA</div><h2>Uma questão parece impossível.<br><span class="accent">O que você pode fazer?</span></h2><div class="grid2 lower"><div class="card"><h3>⏸ Pausa de 90 segundos</h3><p>Se quiser, perceba os pés no chão. Observe três elementos ao redor. Solte os ombros. Respire de modo confortável. Pergunte a si: “Qual é o próximo passo possível?”</p><p class="footnote">Quem preferir pode apenas acompanhar, sem fazer o exercício.</p></div><div class="card"><h3>Três estratégias práticas</h3><p>✓ Marque uma questão difícil para revisar depois.</p><p>✓ Cuide da hidratação e retome a atenção.</p><p>✓ Leia as instruções e organize os próximos passos.</p></div></div></section>';
if(g==='bag')return '<section class="scene"><div class="kicker">FASE 05 / A MOCHILA INVISÍVEL</div><h2>O que você leva consigo<br>e não cabe no estojo?</h2><p>Escolha uma força pelo celular e escreva três na etiqueta de papel. Você não precisa mostrar a ninguém.</p>'+questionCard('bag')+'</section>';
if(g==='final')return '<section class="scene center"><div class="kicker">🏆 MISSÃO CUMPRIDA</div><h1>UMA PROVA AVALIA RESPOSTAS.<br><span class="big-em">NÃO MEDE TODO O SEU CAMINHO.</span></h1><p class="lead">No domingo, reconheça seu esforço, faça o que está ao seu alcance e lembre-se: sua história continua.</p><div class="card lower" style="text-align:left"><h3>Domingo, 8 de novembro · ENEM 2026</h3><p class="small">Linguagens, Ciências Humanas e Redação. Portões abrem às 12h e fecham às 13h. Início às 13h30. Término regular às 19h (horário de Brasília). Confira seu local, documento de identificação válido e caneta esferográfica preta de corpo transparente. Celular desligado e guardado conforme as orientações do Inep.</p><p class="footnote">Fonte: Instituto Nacional de Estudos e Pesquisas Educacionais Anísio Teixeira (Inep). Verifique avisos oficiais para sua situação.</p></div><p class="mini muted lower">Elaborado por Rafaela Melo · Psicóloga · CRP 02/17-096</p></section>';
return '<section class="scene"><h2>Etapa indisponível</h2></section>'
}
function controls(){const isPoll=!!pollId();const open=s.remote?.poll_open??false;return '<nav class="stage-controls" aria-label="Controle da apresentação"><div class="actions"><span class="timer">'+timeText()+'</span><span class="pill">TELA '+(s.scene+1)+'/'+scenes.length+'</span><span class="pill">'+(s.demo?'ENSAIO':((s.remote?.participants||0)+' CELULARES'))+'</span></div><div class="actions">'+(isPoll?buttons(s.demo?'Simular respostas':open?'Fechar votação':'Abrir votação','togglePoll','alt'):'')+(isPoll?buttons(s.showResults?'Ocultar gráficos':'Mostrar gráficos','results','alt'):'')+buttons('◀','prev','alt')+buttons('▶','next')+buttons('☰ Etapas','admin','ghost')+'</div></nav>'}
function admin(){return '<div class="overlay"><div class="card"><div class="actions"><h3 style="margin:0;flex:1">Controle da mediação</h3>'+buttons('Fechar','admin','alt')+'</div><p class="muted small">Escolha qualquer etapa. A sala é sincronizada com os celulares quando está ao vivo.</p><div class="stage-list">'+scenes.map((x,i)=>'<button data-scene="'+i+'" class="'+(i===s.scene?'active':'')+'">'+(i+1)+'. '+E(x.title)+'</button>').join('')+'</div><hr style="border:0;border-top:1px solid #53658e;margin:16px 0"><div class="actions">'+buttons(s.showTalk?'Ocultar falas de apoio':'Mostrar falas de apoio','talk','alt')+buttons(s.reduced?'Ativar animações':'Reduzir animações','motion','alt')+buttons('Imprimir roteiro','print','alt')+buttons('Apagar sala e respostas','end','warn')+'</div><p class="footnote">Sala: '+E(s.roomCode)+' · Não compartilhe esta tela de controle com o público.</p></div></div>'}
function homeHTML(){return '<div class="app">'+header()+'<section class="hero"><div><div class="kicker">ENCONTRO REFLEXIVO · VÉSPERA DO ENEM</div><h1>O PODER JÁ<br><span class="big-em">ESTÁ EM VOCÊ!</span></h1><p class="lead">Jogo coletivo de 60 minutos para reconhecer conquistas, forças e estratégias. Aproximadamente 60 adolescentes, um datashow e celulares.</p><div class="actions">'+buttons('▶ Iniciar ensaio sem internet','demo')+(LIVE?buttons('Criar sala com participação ao vivo','newRoom','alt'):'')+'<button class="btn ghost" data-action="participant">Sou participante</button></div><p class="footnote lower">Status: '+(LIVE?'Servidor configurado. Você pode criar uma sala ao vivo.':'Servidor ainda não configurado. O modo ensaio funciona no datashow; celulares não compartilham respostas até configurar Supabase.')+'</p><div class="actions"><a href="./README.md" target="_blank">Instruções de instalação</a></div></div><div>'+pacSvg()+'</div></section><footer class="footer">Clube de Ideias Terapêuticas · Elaborado por Rafaela Melo · CRP 02/17-096</footer></div>'}
function presenterHTML(){if(!s.demo&&(!s.hostToken||!s.roomCode))return '<div class="app">'+header()+'<div class="scene"><h2>Iniciar apresentação</h2><p>Para controlar uma sala ao vivo, crie uma nova sala neste navegador. A chave do anfitrião fica apenas na sessão atual.</p><div class="actions">'+(LIVE?buttons('Criar sala ao vivo','newRoom'):'')+buttons('Testar em modo ensaio','demo','alt')+'</div></div></div>';
return '<main class="app presentation '+(s.reduced?'reduced':'')+'">'+header('<button class="btn alt" data-action="home">Início</button>')+
stageProgress()+showScene()+controls()+(s.showAdmin?admin():'')+'</main>'}
function mobileHTML(){const r=s.remote;let content='';
if(!s.joined){content='<div class="card"><div class="kicker">ENTRE NA MISSÃO</div><h1>Seu poder já está em você.</h1><p class="muted">Digite o código que aparece no telão. Não pedimos nome, telefone nem cadastro.</p><label for="roomCodeInput" class="mini">Código da sala</label><input id="roomCodeInput" class="field" placeholder="Ex.: A1B2C3" maxlength="8" value="'+E(s.roomCode)+'" autocomplete="off"><div class="actions lower">'+buttons('Entrar no jogo →','join')+'</div></div>'}
else if(!r){content='<div class="card"><h2>Conectando…</h2><p class="muted">Verificando a sala.</p></div>'}
else if(r.poll_open&&r.active_poll&&polls[r.active_poll]){
const poll=polls[r.active_poll],chosen=s.choices[r.active_poll];content='<div class="kicker">SUA VEZ DE PARTICIPAR</div><h2 class="question">'+E(poll.prompt)+'</h2><p class="muted">Não há resposta certa ou errada. Escolha o que faz sentido para você.</p><div class="options">'+poll.choices.map((v,i)=>'<button class="option '+(chosen===i?'selected':'')+'" data-vote="'+i+'"><b>'+badges[i]+'</b><span>'+E(v)+'</span></button>').join('')+'</div>'+(chosen!==undefined?'<div class="feedback">✓ Sua escolha foi registrada. Você pode alterá-la enquanto a votação estiver aberta.</div>':'')}
else {content='<div class="card center"><div class="kicker">VOCÊ ESTÁ NA MISSÃO</div><h2>Você já chegou até aqui. ✨</h2><p class="muted">Acompanhe o telão. Quando a próxima pergunta for aberta, ela aparecerá neste celular.</p><span class="pill">'+E(scenes[r.scene]?.title||'Missão')+'</span></div>'}
return '<div class="mobile">'+header()+'<div style="height:30px"></div>'+content+(s.error?'<p class="notice error lower">'+E(s.error)+'</p>':'')+'<footer class="footer">Participação voluntária · Respostas agregadas e sem nome · Não compartilhe informações íntimas</footer></div>'}
function render(){const root=$('#app');if(!root)return;root.innerHTML=s.mode==='home'?homeHTML():s.mode==='apresentar'?presenterHTML():mobileHTML();if(s.error&&s.mode!=='participar'){root.insertAdjacentHTML('afterbegin','<div class="notice error" style="position:fixed;z-index:60;top:8px;left:8px;right:8px;max-width:720px;margin:auto">'+E(s.error)+'</div>')}qrReady()}
document.addEventListener('click',async e=>{const el=e.target.closest('[data-action],[data-scene],[data-vote]');if(!el)return;
if(el.hasAttribute('data-scene')){s.showAdmin=false;await setScene(Number(el.dataset.scene));return}
if(el.hasAttribute('data-vote')){await vote(Number(el.dataset.vote));return}
const a=el.dataset.action;
try{
if(a==='demo')tryDemo();
else if(a==='newRoom')await newRoom();
else if(a==='participant')nav('participar');
else if(a==='home'){s.mode='home';history.replaceState({},'',location.pathname);render()}
else if(a==='join')await join();
else if(a==='next')await setScene(s.scene+1);
else if(a==='prev')await setScene(s.scene-1);
else if(a==='maze')await setScene(5);
else if(a==='powers')await setScene(scenes.findIndex(x=>x.kind==='powers'));
else if(a==='order'){if(s.demo){s.showResults=!s.showResults;render()}else await setScene(5,true)}
else if(a==='togglePoll')await pollToggle(s.demo?!s.showResults:!s.remote?.poll_open);
else if(a==='results'){s.showResults=!s.showResults;render()}
else if(a==='simulate'){s.simCount=60;s.showResults=true;render()}
else if(a==='unlock'){const gh=ghosts[scenes[s.scene].ghost];s.powers[gh.id]=true;render()}
else if(a==='admin'){s.showAdmin=!s.showAdmin;render()}
else if(a==='talk'){s.showTalk=!s.showTalk;render()}
else if(a==='motion'){s.reduced=!s.reduced;localStorage.setItem('enem_reduce_motion',s.reduced?'yes':'no');render()}
else if(a==='print')window.print();
else if(a==='end')await endRoom();
}catch(err){s.error=err.message;render()}
});
document.addEventListener('keydown',e=>{if(e.target instanceof HTMLInputElement)return;if(s.mode==='apresentar'&&!s.showAdmin){if(e.key==='ArrowRight'){e.preventDefault();setScene(s.scene+1)}if(e.key==='ArrowLeft'){e.preventDefault();setScene(s.scene-1)}}if(e.key==='Escape'&&s.showAdmin){s.showAdmin=false;render()}if(e.key==='Enter'&&e.target?.id==='roomCodeInput')join()});
async function init(){
render();
if(s.mode==='participar'&&s.roomCode&&LIVE){try{await rpc('enem_join_room',{p_code:s.roomCode,p_part_token:s.partToken});s.joined=true;await refresh()}catch(e){s.error=e.message;render()}}
if(s.mode==='apresentar'&&s.hostToken&&s.roomCode&&LIVE){try{await refresh()}catch(e){s.error=e.message;render()}}
setInterval(()=>{if(s.mode==='apresentar'){const t=$('.timer');if(t)t.textContent=timeText()}},1000);
s.pollInterval=setInterval(()=>{if(!s.demo&&LIVE&&s.roomCode&&((s.mode==='apresentar'&&s.hostToken)||(s.mode==='participar'&&s.joined)))refresh()},2500);
}
init();
})();