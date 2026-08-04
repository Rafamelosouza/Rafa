const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, BorderStyle, AlignmentType, ShadingType, VerticalAlign, Header, Footer,
  PageNumber,
} = require("docx");
const fs = require("fs");

const COLOR_PRIMARY = "5B7B9A";
const COLOR_LIGHT = "EAF0F5";
const COLOR_TEXT = "2E2E2E";
const COLOR_MUTED = "6B6B6B";

const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const thinBorder = { style: BorderStyle.SINGLE, size: 4, color: "C7D3DE" };
const cellBorders = () => ({ top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder });

const CONTENT_W = 9720; // A4 usable width (11906) minus 850+850 margins, with buffer
const HALF_W = 4860;

// ---------- building blocks ----------

function fieldCell(label, width) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: { top: noBorder, left: noBorder, right: noBorder, bottom: thinBorder },
    margins: { top: 60, bottom: 60, left: 0, right: 200 },
    children: [new Paragraph({ children: [new TextRun({ text: label, size: 18, color: COLOR_MUTED })] })],
  });
}

function fieldsTable(rows) {
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [HALF_W, HALF_W],
    rows: rows.map(
      (pair) =>
        new TableRow({
          children:
            pair.length === 1
              ? [fieldCell(pair[0], CONTENT_W)]
              : [fieldCell(pair[0], HALF_W), fieldCell(pair[1], HALF_W)],
        })
    ),
  });
}

function sectionHeading(text) {
  return new Paragraph({
    keepNext: true,
    spacing: { before: 260, after: 100 },
    shading: { type: ShadingType.CLEAR, color: "auto", fill: COLOR_LIGHT },
    children: [new TextRun({ text, bold: true, size: 22, color: COLOR_PRIMARY })],
  });
}

function bodyText(text, opts = {}) {
  return new Paragraph({
    keepNext: !!opts.keepNext,
    spacing: { before: opts.before ?? 0, after: opts.after ?? 140 },
    children: [
      new TextRun({
        text,
        size: opts.size ?? 20,
        italics: !!opts.italics,
        bold: !!opts.bold,
        color: opts.color ?? COLOR_TEXT,
      }),
    ],
  });
}

function answerBox(lines = 2) {
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [CONTENT_W],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: CONTENT_W, type: WidthType.DXA },
            borders: cellBorders(),
            margins: { top: 100, bottom: 90 + lines * 260, left: 150, right: 150 },
            children: [new Paragraph({ children: [] })],
          }),
        ],
      }),
    ],
  });
}

function question(text, lines = 2) {
  return [
    new Paragraph({
      keepNext: true,
      spacing: { before: 160, after: 80 },
      children: [new TextRun({ text, size: 20 })],
    }),
    answerBox(lines),
    new Paragraph({ spacing: { after: 100 }, children: [] }),
  ];
}

function checkboxLine(text) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({ text: "☐  ", size: 22, color: COLOR_PRIMARY }),
      new TextRun({ text, size: 20 }),
    ],
  });
}

function bullet(text) {
  return new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text: "•  ", bold: true, color: COLOR_PRIMARY }), new TextRun({ text, size: 20 })],
  });
}

function signatureLine(label) {
  return new TableCell({
    width: { size: HALF_W, type: WidthType.DXA },
    borders: { top: noBorder, left: noBorder, right: noBorder, bottom: noBorder },
    margins: { top: 500, bottom: 0, left: 0, right: 200 },
    children: [
      new Paragraph({ border: { top: { style: BorderStyle.SINGLE, size: 4, color: "9AA7B4" } }, children: [] }),
      new Paragraph({ spacing: { before: 40 }, children: [new TextRun({ text: label, size: 16, color: COLOR_MUTED })] }),
    ],
  });
}

function signatures(labels) {
  const rows = [];
  for (let i = 0; i < labels.length; i += 2) {
    const pair = labels.slice(i, i + 2);
    rows.push(
      new TableRow({
        children:
          pair.length === 2
            ? [signatureLine(pair[0]), signatureLine(pair[1])]
            : [signatureLine(pair[0]), new TableCell({ width: { size: HALF_W, type: WidthType.DXA }, borders: { top: noBorder, left: noBorder, right: noBorder, bottom: noBorder }, children: [new Paragraph({ children: [] })] })],
      })
    );
  }
  return new Table({ width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: [HALF_W, HALF_W], rows });
}

function spacer(size = 100) {
  return new Paragraph({ spacing: { after: size }, children: [] });
}

// ---------- block renderer ----------

function render(block) {
  switch (block.t) {
    case "fields":
      return [fieldsTable(block.rows)];
    case "heading":
      return [sectionHeading(block.text)];
    case "note":
      return [bodyText(block.text, { italics: true, size: 18, color: COLOR_MUTED, after: 160 })];
    case "text":
      return [bodyText(block.text, block.opts)];
    case "question":
      return question(block.text, block.lines);
    case "checklist":
      return block.items.map(checkboxLine);
    case "bullets":
      return block.items.map(bullet);
    case "signatures":
      return [signatures(block.labels)];
    case "spacer":
      return [spacer(block.size)];
    default:
      throw new Error("unknown block " + block.t);
  }
}

// ---------- document assembly ----------

function buildDocument(title, subtitle, blocks, filename) {
  const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 20, color: COLOR_TEXT } } } },
    sections: [
      {
        properties: { page: { margin: { top: 900, bottom: 900, left: 850, right: 850 } } },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: "Uso clínico · confidencial", size: 14, color: "9AA7B4", italics: true })],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "Página ", size: 14, color: "9AA7B4" }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 14, color: "9AA7B4" }),
                  new TextRun({ text: " de ", size: 14, color: "9AA7B4" }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 14, color: "9AA7B4" }),
                ],
              }),
            ],
          }),
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 40 },
            children: [new TextRun({ text: title, bold: true, size: 30, color: COLOR_PRIMARY })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 220 },
            children: [new TextRun({ text: subtitle, italics: true, size: 18, color: COLOR_MUTED })],
          }),
          ...blocks.flatMap(render),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync(filename, buffer);
    console.log("wrote", filename);
  });
}

// ================= DOCUMENT 1: Anamnese Infantil =================

const anamneseInfantil = [
  { t: "heading", text: "A · Identificação" },
  {
    t: "fields",
    rows: [
      ["Nome da criança/adolescente:", "Data de nascimento:"],
      ["Idade:", "Sexo:"],
      ["Nome do responsável 1:", "Parentesco:"],
      ["Nome do responsável 2:", "Parentesco:"],
      ["Endereço:", "Telefone(s):"],
      ["Escola:", "Série/ano:"],
      ["Encaminhado por:", "Data da anamnese:"],
    ],
  },

  { t: "heading", text: "B · Motivo da consulta" },
  { t: "question", text: "Qual foi o motivo que trouxe a criança/adolescente ao atendimento? Quando e como começou?", lines: 3 },

  { t: "heading", text: "C · Gestação, parto e primeira infância" },
  { t: "fields", rows: [["Gravidez planejada?  ☐ Sim  ☐ Não", "Tipo de parto:"], ["Houve prematuridade?  ☐ Sim  ☐ Não", "Amamentação até (idade):"]] },
  { t: "question", text: "Houve intercorrências na gestação, no parto ou no pós-parto? Alguma dificuldade na amamentação?", lines: 2 },

  { t: "heading", text: "D · Desenvolvimento neuropsicomotor e de linguagem" },
  { t: "fields", rows: [["Sustentou a cabeça (idade):", "Sentou sem apoio (idade):"], ["Engatinhou (idade):", "Andou sem apoio (idade):"], ["Primeiras palavras (idade):", "Frases completas (idade):"], ["Controle esfincteriano diurno (idade):", "Controle esfincteriano noturno (idade):"]] },
  { t: "question", text: "Alguma observação relevante sobre o desenvolvimento (atrasos, regressões, acompanhamentos)?", lines: 2 },

  { t: "heading", text: "E · Saúde" },
  { t: "question", text: "Doenças relevantes, cirurgias ou internações.", lines: 2 },
  { t: "question", text: "Uso de medicação atual (nome, dose, desde quando) e alergias conhecidas.", lines: 2 },
  { t: "question", text: "Acompanhamento médico atual (pediatra, neurologista, psiquiatra etc.).", lines: 2 },
  { t: "question", text: "Sono: rotina e eventuais dificuldades.", lines: 2 },
  { t: "question", text: "Alimentação: rotina, seletividade e eventuais dificuldades.", lines: 2 },

  { t: "heading", text: "F · Desenvolvimento escolar" },
  { t: "question", text: "Adaptação escolar, desempenho acadêmico e relação com colegas/professores.", lines: 3 },
  { t: "question", text: "Já repetiu de ano ou mudou de escola com frequência? Recebe algum suporte pedagógico (AEE, reforço)?", lines: 2 },

  { t: "heading", text: "G · Desenvolvimento social, emocional e comportamental" },
  { t: "question", text: "Como é o temperamento da criança/adolescente desde bebê? Como se relaciona com outras crianças?", lines: 2 },
  { t: "question", text: "Autonomia nas atividades diárias (higiene, alimentação, tarefas). Comportamentos que preocupam os responsáveis.", lines: 3 },

  { t: "heading", text: "H · Dinâmica familiar" },
  { t: "question", text: "Composição familiar (quem mora na casa) e rotina familiar.", lines: 2 },
  { t: "question", text: "Como é a relação da criança/adolescente com cada membro da família? Quais são as regras e limites em casa?", lines: 3 },
  { t: "question", text: "Há histórico familiar de transtornos psicológicos, psiquiátricos ou uso de substâncias?", lines: 2 },

  { t: "heading", text: "I · Eventos significativos" },
  { t: "question", text: "Mudanças, perdas, lutos, separações, mudanças de cidade/escola ou outros eventos considerados marcantes.", lines: 3 },

  { t: "heading", text: "J · Impressões clínicas iniciais (uso do profissional)" },
  { t: "question", text: "Observações, hipóteses iniciais e encaminhamentos sugeridos.", lines: 4 },

  { t: "heading", text: "Assinaturas" },
  { t: "signatures", labels: ["Responsável legal", "Psicólogo(a) responsável · CRP nº"] },
];

// ================= DOCUMENT 2: Entrevista Inicial Infantil =================

const entrevistaInicialInfantil = [
  { t: "note", text: "Orientações de aplicação: adapte a linguagem à idade da criança/adolescente, utilize apoio lúdico se necessário (desenho, brincadeira, cartas) e não é preciso seguir rigidamente a ordem das perguntas." },
  { t: "fields", rows: [["Nome:", "Idade:"], ["Data:", "Aplicador(a):"]] },

  { t: "heading", text: "1 · Aquecimento e vínculo" },
  { t: "question", text: "Me conta um pouco sobre você: o que você gosta de fazer no seu tempo livre?", lines: 2 },
  { t: "question", text: "Quem são as pessoas mais importantes para você?", lines: 2 },

  { t: "heading", text: "2 · Percepção sobre o atendimento" },
  { t: "question", text: "Você sabe por que veio conversar comigo hoje? O que te contaram sobre isso?", lines: 2 },

  { t: "heading", text: "3 · Escola" },
  { t: "question", text: "Como é para você estar na escola? Tem alguma coisa lá que te deixa chateado(a) ou com medo?", lines: 2 },

  { t: "heading", text: "4 · Família e casa" },
  { t: "question", text: "Como é o seu dia a dia em casa? Tem alguma coisa em casa que te deixa preocupado(a)?", lines: 2 },

  { t: "heading", text: "5 · Emoções" },
  { t: "question", text: "Tem alguma coisa que te deixa muito triste, com raiva ou com medo ultimamente? O que você costuma fazer quando fica assim?", lines: 3 },

  { t: "heading", text: "6 · Autopercepção e expectativas" },
  { t: "question", text: "Se você pudesse mudar algo em você ou na sua vida, o que seria?", lines: 2 },
  { t: "question", text: "O que você gostaria que fosse diferente depois de vir aqui?", lines: 2 },

  { t: "heading", text: "Observações do(a) psicólogo(a) durante a entrevista" },
  { t: "question", text: "Comportamento observado, postura, linguagem não-verbal e demais impressões clínicas.", lines: 4 },
];

// ================= DOCUMENT 3: Entrevista com Responsáveis =================

const entrevistaResponsaveis = [
  { t: "fields", rows: [["Nome da criança/adolescente:", "Data:"], ["Responsável entrevistado:", "Parentesco:"]] },

  { t: "heading", text: "1 · Percepção do problema" },
  { t: "question", text: "Como vocês descreveriam a dificuldade atual? Desde quando perceberam isso?", lines: 3 },
  { t: "question", text: "O que já tentaram fazer para ajudar? O que funcionou ou não funcionou?", lines: 2 },

  { t: "heading", text: "2 · Rotina e cuidados" },
  { t: "question", text: "Como é a rotina da criança/adolescente (sono, alimentação, atividades, telas)? Quem são os principais cuidadores no dia a dia?", lines: 3 },

  { t: "heading", text: "3 · Estilo parental e regras" },
  { t: "question", text: "Como vocês costumam lidar com birras ou desafios de comportamento? Quais são as regras e consequências em casa?", lines: 3 },

  { t: "heading", text: "4 · Relações familiares" },
  { t: "question", text: "Como é a relação entre os irmãos, se houver? Como está a relação entre os responsáveis?", lines: 2 },

  { t: "heading", text: "5 · Histórico familiar" },
  { t: "question", text: "Há histórico de transtornos psicológicos, psiquiátricos ou uso de substâncias na família?", lines: 2 },

  { t: "heading", text: "6 · Expectativas" },
  { t: "question", text: "O que vocês esperam do acompanhamento psicológico? Como pretendem apoiar o processo terapêutico?", lines: 2 },

  { t: "heading", text: "Declaração" },
  { t: "checklist", items: ["Concordo em colaborar com as informações prestadas para fins de avaliação e acompanhamento psicológico."] },
  { t: "spacer", size: 100 },
  { t: "signatures", labels: ["Responsável", "Psicólogo(a) responsável · CRP nº"] },
];

// ================= DOCUMENT 4: Termo de Consentimento — Infantojuvenil =================

const termoInfantil = [
  { t: "fields", rows: [["Nome da criança/adolescente:", "Data de nascimento:"], ["Responsável legal:", "Data:"]] },

  { t: "heading", text: "1 · Sobre o atendimento psicológico" },
  { t: "text", text: "Este documento tem como objetivo esclarecer os termos do acompanhamento psicológico oferecido a [nome da criança/adolescente], sob responsabilidade de [nome do(a) psicólogo(a)], CRP nº [____], e obter o consentimento do(a) responsável legal para sua realização." },

  { t: "heading", text: "2 · Sigilo profissional e seus limites" },
  { t: "text", text: "As informações compartilhadas durante os atendimentos são protegidas por sigilo profissional, conforme o Código de Ética Profissional do Psicólogo. Orientações gerais sobre o andamento do processo poderão ser compartilhadas com o(a) responsável legal, preservando-se, sempre que possível e adequado à idade, o conteúdo específico relatado pela criança/adolescente. O sigilo poderá ser rompido em situações de risco à vida ou à integridade da criança/adolescente ou de terceiros, suspeita de violência ou abuso, ou por determinação legal." },

  { t: "heading", text: "3 · Participação dos responsáveis" },
  { t: "text", text: "Os responsáveis poderão ser convidados a participar de devolutivas periódicas e orientações, conforme a avaliação clínica indicar ser adequado ao processo terapêutico." },

  { t: "heading", text: "4 · Assentimento do(a) adolescente (quando aplicável)" },
  { t: "text", text: "Quando o(a) paciente for adolescente e apresentar condições de compreender os termos deste documento, seu assentimento em participar do acompanhamento também será registrado." },

  { t: "heading", text: "5 · Frequência, duração e valores" },
  { t: "text", text: "As sessões ocorrerão com frequência de [____] por semana, com duração aproximada de [____] minutos, ao valor de R$ [____] por sessão." },

  { t: "heading", text: "6 · Faltas e cancelamentos" },
  { t: "text", text: "Cancelamentos devem ser comunicados com no mínimo [____] horas de antecedência. Faltas não comunicadas dentro desse prazo [____]." },

  { t: "heading", text: "7 · Encerramento do processo terapêutico" },
  { t: "text", text: "O encerramento do acompanhamento poderá ocorrer por indicação clínica ou por solicitação do(a) responsável, sendo recomendável que seja precedido de sessões de encerramento para preparação adequada da criança/adolescente." },

  { t: "heading", text: "8 · Contato de emergência" },
  { t: "fields", rows: [["Nome:", "Telefone:"]] },

  { t: "heading", text: "Declaração de consentimento" },
  { t: "checklist", items: ["Declaro que li e compreendi os termos acima e concordo com a realização do acompanhamento psicológico nas condições descritas."] },
  { t: "spacer", size: 120 },
  { t: "signatures", labels: ["Responsável legal", "Adolescente (assentimento, se aplicável)"] },
  { t: "spacer", size: 200 },
  { t: "signatures", labels: ["Psicólogo(a) responsável · CRP nº"] },
];

// ================= DOCUMENT 5: Anamnese Adulto =================

const anamneseAdulto = [
  { t: "heading", text: "A · Identificação" },
  {
    t: "fields",
    rows: [
      ["Nome:", "Data de nascimento:"],
      ["Idade:", "Estado civil:"],
      ["Profissão:", "Escolaridade:"],
      ["Endereço:", "Telefone(s):"],
      ["Encaminhado por:", "Data da anamnese:"],
    ],
  },

  { t: "heading", text: "B · Motivo da consulta" },
  { t: "question", text: "Qual foi o motivo que trouxe você ao atendimento? Quando e como começou?", lines: 3 },

  { t: "heading", text: "C · Histórico da queixa atual" },
  { t: "question", text: "Quais fatores parecem ter desencadeado ou agravado a dificuldade? Como ela evoluiu até aqui? O que já foi tentado para lidar com ela?", lines: 3 },

  { t: "heading", text: "D · Histórico de tratamentos anteriores" },
  { t: "question", text: "Já fez psicoterapia antes? Quando, por quanto tempo e por qual motivo? Já teve acompanhamento psiquiátrico ou internações?", lines: 3 },
  { t: "question", text: "Faz uso de medicação psiquiátrica atualmente ou já fez? Qual, desde quando?", lines: 2 },

  { t: "heading", text: "E · Histórico de saúde física e hábitos de vida" },
  { t: "question", text: "Doenças crônicas, cirurgias relevantes e uso atual de medicações não-psiquiátricas.", lines: 2 },
  { t: "question", text: "Uso de álcool, tabaco ou outras substâncias. Qualidade do sono, alimentação e prática de atividade física.", lines: 3 },

  { t: "heading", text: "F · História de vida" },
  { t: "question", text: "Como foi a infância e a adolescência? Como é a relação com a família de origem?", lines: 3 },
  { t: "question", text: "Trajetória escolar/acadêmica e trajetória profissional.", lines: 2 },

  { t: "heading", text: "G · Relacionamentos atuais" },
  { t: "question", text: "Com quem mora atualmente? Como está o relacionamento conjugal, se houver? Tem filhos?", lines: 2 },
  { t: "question", text: "Como é a rede de apoio social (amizades, família, comunidade)?", lines: 2 },

  { t: "heading", text: "H · Histórico familiar de saúde mental" },
  { t: "question", text: "Há histórico de transtornos psicológicos, psiquiátricos, uso de substâncias ou suicídio na família?", lines: 2 },

  { t: "heading", text: "I · Eventos significativos e estressores recentes" },
  { t: "question", text: "Perdas, lutos, mudanças, rupturas ou outros eventos considerados marcantes nos últimos anos.", lines: 3 },

  { t: "heading", text: "J · Expectativas em relação ao processo terapêutico" },
  { t: "question", text: "O que você espera alcançar com o acompanhamento psicológico?", lines: 2 },

  { t: "heading", text: "K · Impressões clínicas iniciais (uso do profissional)" },
  { t: "question", text: "Observações, hipóteses iniciais e encaminhamentos sugeridos.", lines: 4 },

  { t: "heading", text: "Assinaturas" },
  { t: "signatures", labels: ["Paciente", "Psicólogo(a) responsável · CRP nº"] },
];

// ================= DOCUMENT 6: Entrevista Inicial Adulto =================

const entrevistaInicialAdulto = [
  { t: "fields", rows: [["Nome:", "Data:"], ["Aplicador(a):", ""]] },

  { t: "heading", text: "1 · Motivo e expectativas" },
  { t: "question", text: "O que te trouxe à terapia neste momento? O que você espera desse processo?", lines: 3 },

  { t: "heading", text: "2 · Funcionamento atual" },
  { t: "question", text: "Como você descreveria seu dia a dia atualmente? O que tem sido mais difícil ultimamente?", lines: 3 },

  { t: "heading", text: "3 · Recursos e enfrentamento" },
  { t: "question", text: "O que costuma te ajudar quando as coisas ficam difíceis? Com quem você conta quando precisa de apoio?", lines: 2 },

  { t: "heading", text: "4 · Relações" },
  { t: "question", text: "Como estão suas principais relações no momento (família, parceiro(a), amizades, trabalho)?", lines: 2 },

  { t: "heading", text: "5 · Autopercepção" },
  { t: "question", text: "Como você se descreveria hoje? O que gostaria de mudar em si mesmo(a)?", lines: 2 },

  { t: "heading", text: "6 · Histórico relevante" },
  { t: "question", text: "Há algo na sua história que você considera importante eu saber desde já?", lines: 2 },

  { t: "heading", text: "Observações do(a) psicólogo(a)" },
  { t: "question", text: "Comportamento observado, postura, linguagem não-verbal e demais impressões clínicas.", lines: 4 },
];

// ================= DOCUMENT 7: Termo de Consentimento — Adulto =================

const termoAdulto = [
  { t: "fields", rows: [["Nome do(a) paciente:", "Data de nascimento:"], ["Data:", ""]] },

  { t: "heading", text: "1 · Sobre o processo psicoterapêutico" },
  { t: "text", text: "Este documento tem como objetivo esclarecer os termos do acompanhamento psicológico oferecido por [nome do(a) psicólogo(a)], CRP nº [____], e obter o consentimento livre e esclarecido do(a) paciente para sua realização." },

  { t: "heading", text: "2 · Sigilo profissional e seus limites" },
  { t: "text", text: "As informações compartilhadas durante os atendimentos são protegidas por sigilo profissional, conforme o Código de Ética Profissional do Psicólogo. O sigilo poderá ser rompido em situações de risco à vida do(a) paciente ou de terceiros, ou por determinação legal." },

  { t: "heading", text: "3 · Frequência, duração e valores" },
  { t: "text", text: "As sessões ocorrerão com frequência de [____] por semana, com duração aproximada de [____] minutos, ao valor de R$ [____] por sessão." },

  { t: "heading", text: "4 · Faltas e cancelamentos" },
  { t: "text", text: "Cancelamentos devem ser comunicados com no mínimo [____] horas de antecedência. Faltas não comunicadas dentro desse prazo [____]." },

  { t: "heading", text: "5 · Comunicação entre sessões" },
  { t: "text", text: "Mensagens entre sessões devem se limitar a questões objetivas (agendamento, cancelamento). Situações de urgência devem ser direcionadas a [____]." },

  { t: "heading", text: "6 · Encerramento do processo" },
  { t: "text", text: "O encerramento do acompanhamento pode ocorrer por indicação clínica ou por solicitação do(a) paciente, sendo recomendável uma sessão de encerramento para fechamento adequado do processo." },

  { t: "heading", text: "Declaração de consentimento" },
  { t: "checklist", items: ["Declaro que li e compreendi os termos acima e concordo com a realização do acompanhamento psicológico nas condições descritas."] },
  { t: "spacer", size: 120 },
  { t: "signatures", labels: ["Paciente", "Psicólogo(a) responsável · CRP nº"] },
];

// ================= gerar tudo =================

async function main() {
  fs.mkdirSync("out/infantil", { recursive: true });
  fs.mkdirSync("out/adulto", { recursive: true });

  await buildDocument(
    "Anamnese Infantil e Adolescente",
    "Levantamento inicial de histórico para atendimento psicológico com crianças e adolescentes",
    anamneseInfantil,
    "out/infantil/anamnese_infantil.docx"
  );
  await buildDocument(
    "Roteiro de Entrevista Inicial — Criança/Adolescente",
    "Roteiro semiestruturado para a primeira sessão, com linguagem adaptável à idade",
    entrevistaInicialInfantil,
    "out/infantil/entrevista_inicial_infantil.docx"
  );
  await buildDocument(
    "Entrevista com Responsáveis/Família",
    "Roteiro para complementar a anamnese com a perspectiva dos responsáveis",
    entrevistaResponsaveis,
    "out/infantil/entrevista_responsaveis.docx"
  );
  await buildDocument(
    "Termo de Consentimento e Contrato Terapêutico",
    "Atendimento psicológico infantojuvenil",
    termoInfantil,
    "out/infantil/termo_consentimento_infantil.docx"
  );

  await buildDocument(
    "Anamnese — Atendimento Psicológico Adulto",
    "Levantamento inicial de histórico para atendimento psicológico com pacientes adultos",
    anamneseAdulto,
    "out/adulto/anamnese_adulto.docx"
  );
  await buildDocument(
    "Roteiro de Entrevista Inicial — Adulto",
    "Roteiro semiestruturado para a primeira sessão",
    entrevistaInicialAdulto,
    "out/adulto/entrevista_inicial_adulto.docx"
  );
  await buildDocument(
    "Termo de Consentimento e Contrato Terapêutico",
    "Atendimento psicológico adulto",
    termoAdulto,
    "out/adulto/termo_consentimento_adulto.docx"
  );
}

main();
