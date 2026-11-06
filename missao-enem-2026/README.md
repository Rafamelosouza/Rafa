# MISSÃO ENEM 2026: O PODER JÁ ESTÁ EM VOCÊ!

Jogo de participação coletiva para **sábado, 7 de novembro de 2026**, véspera do primeiro dia do ENEM. Duração: **60 minutos**. Público: aproximadamente **60 adolescentes**. Facilitadora: Rafaela Melo, Psicóloga, CRP 02/17-096.

## O que está pronto no código

- **25 telas** no modo apresentadora, com controle por mouse ou pelas setas do teclado.
- Visual arcade original, oito fantasmas coloridos e oito poderes psicológicos.
- Abertura, emoções, labirinto, inventário com seis perguntas, botão de pausa, mochila invisível e despedida.
- Modo **ENSAIO** que roda no navegador **sem conta, sem banco e sem internet** depois de carregado, com números **simulados e identificados como fictícios**.
- Modo **AO VIVO**, com dois endereços: apresentadora e participantes. Envio anônimo, gráficos agregados e atualização a cada ~2,5 segundos, desde que o Supabase tenha sido configurado.
- Código de sala, QR Code (biblioteca externa), botões para abrir/fechar enquetes e **apagar todos os registros** da sala ao final.
- Sem cadastro, sem ranking, sem nome, sem coleta de histórias íntimas.

## 1. Publicar gratuitamente via GitHub Pages

Os arquivos estão na pasta \`missao-enem-2026/\` do repositório público **Rafamelosouza/Rafa**.

1. Abra **Settings → Pages** nesse repositório do GitHub.
2. Em **Build and deployment**, escolha **Deploy from a branch**, a branch \`main\`, pasta \`/(root)\`, e salve.
3. Espere o GitHub indicar a URL ativa. Ela deverá terminar em \`/Rafa/missao-enem-2026/\`.
4. Abra essa URL no computador do datashow. Clique em **Iniciar ensaio sem internet** para testar as telas.

A hospedagem GitHub Pages de repositório público é gratuita, segundo as condições atuais do GitHub. **Só compartilhe o endereço depois de confirmar que abre no navegador**.

Também é possível baixar a pasta e abrir \`index.html\` para utilizar o **ensaio local**; para o modo ao vivo, use endereço HTTPS publicado.

## 2. Ativar participação simultânea de 60 celulares (Supabase grátis)

O GitHub hospeda arquivos, mas **não é um servidor de votos**. Para sincronizar os telefones, use um projeto Supabase gratuito, separado do Lovable.

1. Crie um projeto em https://supabase.com/dashboard.
2. Em **SQL Editor**, cole e execute o arquivo \`supabase.sql\` desta pasta.
3. Em **Project Settings / API Keys**, copie a **Project URL** e a **publishable/anon key** (chave pública). **Nunca use service_role ou secret key no navegador**.
4. Edite \`config.js\` no GitHub, preenchendo \`supabaseUrl\` e \`supabaseAnonKey\` com esses dois valores públicos. Faça o commit.
5. Reabra o endereço público do jogo. Agora deverá aparecer **Criar sala com participação ao vivo**.
6. Clique no botão e apresente o QR Code na tela 2. Os estudantes entram pelo QR Code ou código, sem cadastro.
7. Em uma tela com enquete, clique **Abrir votação**, depois **Fechar votação** e **Mostrar gráficos**.
8. Após o encontro, clique em **☰ Etapas → Apagar sala e respostas**. Isso apaga sala, tokens pseudônimos e votos em cascata.

**Teste obrigatório com dois celulares e computador** antes do evento. Peça a algumas pessoas para testar simultaneamente na rede que será usada no local. O limite de até 200 conexões do Supabase Free não é garantia de que a internet local será suficiente. O código usa **polling** a cada 2,5 s, e não WebSockets; apresenta resultados quase em tempo real.

### Atenção à privacidade e à segurança

- Não solicite nomes, CPF, e-mails, telefone, idade exata ou diagnósticos.
- O servidor armazena apenas um identificador aleatório hash por dispositivo, a sala, a enquete e a alternativa selecionada.
- Apenas o anfitrião com segredo temporário da sessão consegue mudar de etapa, abrir/fechar votação ou apagar sala.
- Os adolescentes veem a pergunta e respondem; não conseguem controlar o telão.
- O código SQL habilita RLS e bloqueia acesso direto às tabelas pelos perfis públicos. Funções com validação retornam só dados agregados.
- Para eventos com menores, obtenha a autorização institucional necessária para a atividade e não projete respostas individuais sensíveis.
- A chave pública do Supabase pode estar no frontend; a **chave secreta nunca**.
- Criação de salas está acessível à chave pública, portanto monitore uso ou desative a hospedagem após o evento se não for utilizar novamente.

## 3. Condução da sessão, exatamente 60 minutos

| Horário | Fase | Orientação |
| --- | --- | --- |
| 00–05 min | Abertura | Mensagem principal, QR Code, combinados, participação voluntária |
| 05–12 min | Emoções | Votação sobre como cada um chega, acolhimento sem exigência de calma |
| 12–34 min | Labirinto | 8 fantasmas, cerca de 2,5 min por fantasma + transições, discussão em duplas ou equipes |
| 34–46 min | Inventário de forças | 6 perguntas subjetivas, sem acertos ou erros, 2 min por pergunta |
| 46–52 min | Botão de pausa | Prática de atenção voluntária e três estratégias para situações difíceis |
| 52–60 min | Mochila invisível | Votação e etiqueta de papel com três forças; fechamento |

**Equipes:** divida os estudantes em 10 grupos de aproximadamente 6 participantes, sem precisar trocar de lugar. Dois grupos discutem cada fantasma e, se quiserem, apresentam uma ideia em 20 segundos. Ninguém é obrigado a compartilhar experiências pessoais.

### Dicas para a apresentação

- Abra o site no Chrome ou Edge do computador ligado ao datashow.
- Use o modo tela cheia (F11) para o público ver tudo.
- Controle com as setas do teclado ou os botões inferiores.
- As enquetes **não abrem automaticamente**: você precisa clicar em **Abrir votação**.
- Clique em **Mostrar gráficos** quando desejar revelar os percentuais.
- Os gráficos só têm votos reais se uma sala ao vivo estiver configurada e os adolescentes entrarem nela.
- Em **☰ Etapas**, é possível ir diretamente a qualquer tela, imprimir o roteiro ou apagar a sala.
- A lista de fantasmas permite escolher ordem não linear. Clique em **Voltar ao labirinto** após cada desafio.
- Em caso de falha de internet, entre em **Iniciar ensaio sem internet**, use os slides, pergunte em voz alta e faça votação levantando as mãos. **Não apresente votos simulados como dados reais.**
- Prefira não tocar nos celulares durante a última reflexão: peça que foquem na etiqueta de papel.

## 4. Como levar para Lovable sem pagar repetidamente

Documentação oficial atual: não é possível conectar por Git Sync um repositório GitHub já existente, porque o Lovable cria seu próprio repositório. Em algumas versões existe o caminho **Upload code** para importar um ZIP. Se estiver disponível na sua conta, compacte a pasta em ZIP e use esse recurso para criar um projeto. Verifique créditos e possíveis limitações **antes** da importação.

Você **não precisa do Lovable** para usar a experiência quando GitHub Pages e Supabase estiverem configurados.

## Arquivos

- \`index.html\`: entrada do aplicativo.
- \`style.css\`: aparência responsiva do jogo.
- \`app.js\`: telas, perguntas, votação, gráficos e fluxos.
- \`config.js\`: configuração pública do Supabase, vazia por padrão.
- \`supabase.sql\`: banco, funções RPC, permissões e apagamento.
- \`README.md\`: este manual.

## Checklist do ensaio técnico

- [ ] Página pública carrega sem erros.
- [ ] Apresentadora cria sala real e abre enquete.
- [ ] 2 celulares diferentes enviam respostas diferentes.
- [ ] Gráfico aumenta e mostra o total correto.
- [ ] Fechamento impede novos votos.
- [ ] Mudança de pergunta sincroniza com os celulares.
- [ ] Uma pessoa sem celular consegue participar por conversa ou mãos levantadas.
- [ ] 10 a 15 celulares testados na rede local, depois ampliar se possível.
- [ ] Texto legível nas últimas fileiras.
- [ ] QR Code funciona; link e código ficam disponíveis como alternativas.
- [ ] Plano B com ensaio pronto.
- [ ] Apagar sala depois do encontro.

### Mensagem de encerramento

> Uma prova avalia respostas. Não mede todo o caminho que trouxe você até aqui.

**Elaborado por Rafaela Melo · Psicóloga · CRP 02/17-096.**


### Atualização de cores e enquadramento no notebook

O labirinto agora conta com oito cores: vermelho, azul, rosa, laranja, roxo, verde, amarelo e turquesa. No celular, a votação para escolher o primeiro monstro exibe apenas as cores. Para atualizar um projeto Supabase já existente, execute novamente o arquivo `supabase.sql` atualizado no SQL Editor. Ele amplia os limites de tela e permite as três novas enquetes.

Na apresentação pelo notebook, textos, cartões, imagens e controles se ajustam à altura da janela para reduzir a rolagem. O modo tela cheia do navegador (F11) oferece mais espaço.
