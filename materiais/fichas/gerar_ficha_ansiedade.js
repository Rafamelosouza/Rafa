const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, BorderStyle, AlignmentType, ShadingType, VerticalAlign, Header, Footer,
  PageNumber, Tab, TabStopType, TabStopPosition,
} = require("docx");

const COLOR_PRIMARY = "5B7B9A";   // azul acinzentado suave
const COLOR_LIGHT = "EAF0F5";     // fundo claro
const COLOR_TEXT = "2E2E2E";

const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const thinBorder = { style: BorderStyle.SINGLE, size: 4, color: "C7D3DE" };

function cellBorders() {
  return { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
}

function headerCell(text, width) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, color: "auto", fill: COLOR_PRIMARY },
    verticalAlign: VerticalAlign.CENTER,
    borders: cellBorders(),
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text, bold: true, color: "FFFFFF", size: 18 })],
      }),
    ],
  });
}

function itemCell(text, width) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    borders: cellBorders(),
    margins: { top: 70, bottom: 70, left: 120, right: 100 },
    children: [new Paragraph({ children: [new TextRun({ text, size: 20, color: COLOR_TEXT })] })],
  });
}

function scoreCell(width) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    borders: cellBorders(),
    margins: { top: 70, bottom: 70, left: 0, right: 0 },
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "☐", size: 26 })] })],
  });
}

const ITEM_W = 6200;
const SCORE_W = 880; // x4 = 3520, total 9720

function domainTable(items) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      headerCell("Item", ITEM_W),
      headerCell("0", SCORE_W),
      headerCell("1", SCORE_W),
      headerCell("2", SCORE_W),
      headerCell("3", SCORE_W),
    ],
  });
  const rows = items.map(
    (text) =>
      new TableRow({
        children: [itemCell(text, ITEM_W), scoreCell(SCORE_W), scoreCell(SCORE_W), scoreCell(SCORE_W), scoreCell(SCORE_W)],
      })
  );
  return new Table({
    width: { size: ITEM_W + SCORE_W * 4, type: WidthType.DXA },
    columnWidths: [ITEM_W, SCORE_W, SCORE_W, SCORE_W, SCORE_W],
    rows: [headerRow, ...rows],
  });
}

function domainHeading(title, pageBreakBefore) {
  return new Paragraph({
    pageBreakBefore: !!pageBreakBefore,
    keepNext: true,
    spacing: { before: 260, after: 100 },
    shading: { type: ShadingType.CLEAR, color: "auto", fill: COLOR_LIGHT },
    children: [new TextRun({ text: title, bold: true, size: 22, color: COLOR_PRIMARY })],
  });
}

function fieldLine(label, width) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: { top: noBorder, left: noBorder, right: noBorder, bottom: thinBorder },
    margins: { top: 40, bottom: 40, left: 0, right: 200 },
    children: [
      new Paragraph({
        children: [new TextRun({ text: label, size: 18, color: "6B6B6B" })],
      }),
    ],
  });
}

const idTable = new Table({
  width: { size: 9720, type: WidthType.DXA },
  columnWidths: [4860, 4860],
  rows: [
    new TableRow({ children: [fieldLine("Nome da criança/adolescente:", 4860), fieldLine("Data de nascimento:", 4860)] }),
    new TableRow({ children: [fieldLine("Idade:", 4860), fieldLine("Data de aplicação:", 4860)] }),
    new TableRow({ children: [fieldLine("Respondeu sozinho(a)  ☐   Com apoio do responsável  ☐", 4860), fieldLine("Aplicador(a):", 4860)] }),
  ],
});

const domains = [
  {
    title: "Bloco 1 · Sintomas físicos",
    items: [
      "Sinto meu coração bater forte quando fico nervoso(a).",
      "Tenho dor de barriga quando estou preocupado(a).",
      "Sinto dificuldade para respirar quando fico ansioso(a).",
      "Fico com as mãos suando quando estou nervoso(a).",
      "Tenho dor de cabeça quando estou preocupado(a).",
    ],
  },
  {
    title: "Bloco 2 · Preocupação excessiva",
    items: [
      "Fico pensando que coisas ruins vão acontecer.",
      "Me preocupo com coisas antes mesmo de elas acontecerem.",
      "Tenho dificuldade para parar de pensar nas minhas preocupações.",
      "Fico nervoso(a) pensando no que os outros vão pensar de mim.",
      "Tenho medo de errar ou fazer alguma coisa errada.",
    ],
  },
  {
    title: "Bloco 3 · Ansiedade social",
    items: [
      "Fico com vergonha de falar na frente dos outros.",
      "Evito participar de atividades em grupo com medo de ser julgado(a).",
      "Fico nervoso(a) quando preciso conhecer pessoas novas.",
      "Tenho medo de ser criticado(a) pelos colegas.",
      "Prefiro ficar sozinho(a) a estar perto de muitas pessoas.",
    ],
  },
  {
    title: "Bloco 4 · Ansiedade de separação",
    items: [
      "Fico com medo quando preciso ficar longe dos meus pais/responsáveis.",
      "Tenho pesadelos com a ideia de perder alguém da minha família.",
      "Fico preocupado(a) quando durmo fora de casa.",
      "Sinto medo de que algo ruim aconteça com minha família quando estou longe.",
      "Choro ou fico chateado(a) quando preciso me separar de quem cuida de mim.",
    ],
  },
];

const scoringHeaderRow = new TableRow({
  tableHeader: true,
  children: [
    headerCell("Bloco", 4200),
    headerCell("Soma dos itens", 2760),
    headerCell("Pontuação (0–15)", 2760),
  ],
});
const scoringRows = domains.map(
  (d) =>
    new TableRow({
      children: [
        itemCell(d.title.replace(/^Bloco \d+ · /, ""), 4200),
        itemCell("", 2760),
        itemCell("", 2760),
      ],
    })
);
scoringRows.push(
  new TableRow({
    children: [
      new TableCell({
        width: { size: 4200, type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, color: "auto", fill: COLOR_LIGHT },
        borders: cellBorders(),
        margins: { top: 70, bottom: 70, left: 120, right: 100 },
        children: [new Paragraph({ children: [new TextRun({ text: "Escore total", bold: true, size: 20 })] })],
      }),
      new TableCell({
        width: { size: 2760, type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, color: "auto", fill: COLOR_LIGHT },
        borders: cellBorders(),
        children: [new Paragraph({ children: [] })],
      }),
      new TableCell({
        width: { size: 2760, type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, color: "auto", fill: COLOR_LIGHT },
        borders: cellBorders(),
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "/ 60", bold: true, size: 20 })] })],
      }),
    ],
  })
);
const scoringTable = new Table({
  width: { size: 9720, type: WidthType.DXA },
  columnWidths: [4200, 2760, 2760],
  rows: [scoringHeaderRow, ...scoringRows],
});

function bullet(text) {
  return new Paragraph({
    spacing: { after: 60 },
    children: [new TextRun({ text: "•  ", bold: true, color: COLOR_PRIMARY }), new TextRun({ text, size: 20 })],
  });
}

function reference(text) {
  return new Paragraph({
    spacing: { after: 120 },
    indent: { left: 260, hanging: 260 },
    children: [new TextRun({ text, size: 18, color: "4A4A4A" })],
  });
}

const legendTable = new Table({
  width: { size: 9720, type: WidthType.DXA },
  columnWidths: [9720],
  rows: [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 9720, type: WidthType.DXA },
          shading: { type: ShadingType.CLEAR, color: "auto", fill: COLOR_LIGHT },
          borders: cellBorders(),
          margins: { top: 90, bottom: 90, left: 150, right: 150 },
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "Legenda da escala   ", bold: true, size: 18, color: COLOR_PRIMARY }),
                new TextRun({ text: "0 = Nunca    1 = Às vezes    2 = Muitas vezes    3 = Sempre", size: 18, color: COLOR_TEXT }),
              ],
            }),
          ],
        }),
      ],
    }),
  ],
});

const observationsBox = new Table({
  width: { size: 9720, type: WidthType.DXA },
  columnWidths: [9720],
  rows: [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 9720, type: WidthType.DXA },
          borders: cellBorders(),
          margins: { top: 120, bottom: 900, left: 150, right: 150 },
          children: [new Paragraph({ children: [new TextRun({ text: "", size: 20 })] })],
        }),
      ],
    }),
  ],
});

const signatureTable = new Table({
  width: { size: 9720, type: WidthType.DXA },
  columnWidths: [4860, 4860],
  rows: [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 4860, type: WidthType.DXA },
          borders: { top: noBorder, left: noBorder, right: noBorder, bottom: noBorder },
          margins: { top: 500, bottom: 0, left: 0, right: 200 },
          children: [
            new Paragraph({ border: { top: { style: BorderStyle.SINGLE, size: 4, color: "9AA7B4" } }, children: [] }),
            new Paragraph({ spacing: { before: 40 }, children: [new TextRun({ text: "Assinatura do(a) psicólogo(a) responsável", size: 16, color: "6B6B6B" })] }),
          ],
        }),
        new TableCell({
          width: { size: 4860, type: WidthType.DXA },
          borders: { top: noBorder, left: noBorder, right: noBorder, bottom: noBorder },
          margins: { top: 500, bottom: 0, left: 0, right: 0 },
          children: [
            new Paragraph({ border: { top: { style: BorderStyle.SINGLE, size: 4, color: "9AA7B4" } }, children: [] }),
            new Paragraph({ spacing: { before: 40 }, children: [new TextRun({ text: "CRP nº", size: 16, color: "6B6B6B" })] }),
          ],
        }),
      ],
    }),
  ],
});

const doc = new Document({
  styles: {
    default: {
      document: { run: { font: "Calibri", size: 20, color: COLOR_TEXT } },
    },
  },
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
          children: [new TextRun({ text: "Ficha de Avaliação de Ansiedade Infanto-Juvenil", bold: true, size: 32, color: COLOR_PRIMARY })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 220 },
          children: [new TextRun({ text: "Instrumento de rastreio complementar para uso clínico com crianças e adolescentes", italics: true, size: 18, color: "6B6B6B" })],
        }),

        idTable,

        new Paragraph({
          spacing: { before: 240, after: 140 },
          children: [
            new TextRun({
              text: "Instruções: leia cada frase e marque com um X a opção que melhor descreve com que frequência isso acontece com você (ou com a criança/adolescente, no caso de resposta assistida) nas últimas duas semanas. Não existem respostas certas ou erradas.",
              size: 20,
            }),
          ],
        }),

        legendTable,

        ...domains.flatMap((d, i) => [
          domainHeading(d.title, i === 2),
          domainTable(d.items),
          new Paragraph({ spacing: { after: 120 }, children: [] }),
        ]),

        new Paragraph({ pageBreakBefore: true, keepNext: true, spacing: { after: 60 }, children: [new TextRun({ text: "Apuração e interpretação", bold: true, size: 26, color: COLOR_PRIMARY })] }),

        new Paragraph({ spacing: { before: 100, after: 160 }, children: [new TextRun({ text: "Some os valores marcados (0 a 3) em cada bloco e registre o resultado abaixo.", size: 20 })] }),

        scoringTable,

        new Paragraph({ keepNext: true, spacing: { before: 260, after: 100 }, children: [new TextRun({ text: "Faixas de referência (sugestivas)", bold: true, size: 22, color: COLOR_PRIMARY })] }),
        bullet("0–20: sinais de ansiedade pouco frequentes ou ausentes."),
        bullet("21–35: sinais de ansiedade leves a moderados — atenção clínica recomendada."),
        bullet("36–60: sinais de ansiedade significativos — investigação clínica aprofundada recomendada."),
        new Paragraph({
          spacing: { before: 140, after: 100 },
          children: [
            new TextRun({
              text: "Nota: este é um instrumento de triagem elaborado para apoio à prática clínica, sem validação psicométrica formal (normas, sensibilidade e especificidade não estabelecidas). Os escores devem ser interpretados em conjunto com entrevista clínica, observação e demais fontes de informação, e não substituem instrumentos padronizados e validados nem o julgamento clínico do(a) profissional.",
              italics: true,
              size: 16,
              color: "6B6B6B",
            }),
          ],
        }),

        new Paragraph({
          keepNext: true,
          pageBreakBefore: true,
          spacing: { before: 0, after: 100 },
          children: [new TextRun({ text: "Fundamentação teórica", bold: true, size: 26, color: COLOR_PRIMARY })],
        }),
        new Paragraph({
          spacing: { after: 160 },
          children: [
            new TextRun({
              text: "A estrutura em quatro blocos — sintomas somáticos, preocupação excessiva, ansiedade social e ansiedade de separação — dialoga com o modelo cognitivo-comportamental da ansiedade, que descreve suas manifestações em componentes fisiológicos, cognitivos e comportamentais (Beck & Clark, 1997; Barlow, 2002), e com os critérios diagnósticos para transtornos de ansiedade na infância e adolescência descritos no DSM-5 (American Psychiatric Association, 2014). A organização dos blocos também se inspira, no plano conceitual, na estrutura fatorial de instrumentos consolidados de rastreio de ansiedade infantil, como o SCARED (Birmaher et al., 1997) — sem reproduzir seus itens originais, sua redação ou suas propriedades psicométricas.",
              size: 19,
            }),
          ],
        }),
        new Paragraph({
          spacing: { after: 220 },
          children: [
            new TextRun({
              text: "Trata-se, portanto, de um instrumento de elaboração própria, construído a partir desses referenciais para fins de rastreio complementar e apoio à escuta clínica — e não de uma adaptação, tradução ou versão validada de qualquer escala existente.",
              italics: true,
              size: 18,
              color: "6B6B6B",
            }),
          ],
        }),

        new Paragraph({
          keepNext: true,
          spacing: { before: 100, after: 120 },
          children: [new TextRun({ text: "Referências", bold: true, size: 22, color: COLOR_PRIMARY })],
        }),
        reference("American Psychiatric Association. (2014). DSM-5: Manual diagnóstico e estatístico de transtornos mentais (5ª ed.). Porto Alegre: Artmed."),
        reference("Barlow, D. H. (2002). Anxiety and Its Disorders: The Nature and Treatment of Anxiety and Panic (2nd ed.). New York: Guilford Press."),
        reference("Beck, A. T., & Clark, D. A. (1997). An information processing model of anxiety: Automatic and strategic processes. Behaviour Research and Therapy, 35(1), 49–58."),
        reference("Birmaher, B., Khetarpal, S., Brent, D., Cully, M., Balach, L., Kaufman, J., & Neer, S. M. (1997). The Screen for Child Anxiety Related Emotional Disorders (SCARED): Scale construction and psychometric characteristics. Journal of the American Academy of Child & Adolescent Psychiatry, 36(4), 545–553."),

        new Paragraph({
          keepNext: true,
          pageBreakBefore: true,
          spacing: { before: 0, after: 100 },
          children: [new TextRun({ text: "Observações clínicas", bold: true, size: 22, color: COLOR_PRIMARY })],
        }),
        observationsBox,

        signatureTable,
      ].filter(Boolean),
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  require("fs").writeFileSync("ficha_avaliacao_ansiedade_infanto_juvenil.docx", buffer);
  console.log("done");
});
