import type { TextAlign } from "./types";

// Helper: Rotate a point around a center
export const rotatePoint = (
  x: number,
  y: number,
  cx: number,
  cy: number,
  angleDeg: number,
) => {
  const angleRad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const dx = x - cx;
  const dy = y - cy;
  return {
    x: cx + dx * cos - dy * sin,
    y: cy + dx * sin + dy * cos,
  };
};

// Helper to wrap text
export const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  align: TextAlign,
) => {
  const paragraphs = text.split("\n");
  let currentY = y;

  paragraphs.forEach((paragraph) => {
    const words = paragraph.split(" ");
    let line = "";
    const lines: string[] = [];

    for (let n = 0; n < words.length; n++) {
      const word = words[n];
      const testLine = line + word + " ";
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth) {
        // Se a linha já tem conteúdo, quebra antes da palavra atual
        if (line !== "") {
          lines.push(line);
          line = "";
        }

        // Verifica se a palavra sozinha cabe na largura
        const wordMetrics = ctx.measureText(word + " ");
        if (wordMetrics.width > maxWidth) {
          // Palavra muito longa, precisa quebrar caractere por caractere
          let currentWordPart = "";
          for (let i = 0; i < word.length; i++) {
            const char = word[i];
            const testPart = currentWordPart + char;
            if (ctx.measureText(testPart).width > maxWidth) {
              lines.push(currentWordPart);
              currentWordPart = char;
            } else {
              currentWordPart += char;
            }
          }
          line = currentWordPart + " ";
        } else {
          // Palavra cabe na próxima linha
          line = word + " ";
        }
      } else {
        line = testLine;
      }
    }
    lines.push(line);

    lines.forEach((l) => {
      let lineX = x;
      const trimmedLine = l.trimEnd(); // Remove espaço extra no final para cálculo de alinhamento correto
      if (align === "center") {
        lineX = x + (maxWidth - ctx.measureText(trimmedLine).width) / 2;
      } else if (align === "right") {
        lineX = x + maxWidth - ctx.measureText(trimmedLine).width;
      }
      ctx.fillText(trimmedLine, lineX, currentY);
      currentY += lineHeight;
    });
  });
};

// Helper to draw rounded rect
export const roundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number | { tl: number; tr: number; br: number; bl: number },
  fill: boolean,
  stroke: boolean,
) => {
  if (typeof radius === "undefined") {
    radius = 5;
  }
  if (typeof radius === "number") {
    radius = { tl: radius, tr: radius, br: radius, bl: radius };
  } else {
    const defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
    for (const side in defaultRadius) {
      // @ts-expect-error
      radius[side] = radius[side] || defaultRadius[side];
    }
  }

  const r = radius as { tl: number; tr: number; br: number; bl: number };

  ctx.beginPath();
  ctx.moveTo(x + r.tl, y);
  ctx.lineTo(x + width - r.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r.tr);
  ctx.lineTo(x + width, y + height - r.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r.br, y + height);
  ctx.lineTo(x + r.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r.bl);
  ctx.lineTo(x, y + r.tl);
  ctx.quadraticCurveTo(x, y, x + r.tl, y);
  ctx.closePath();
  if (fill) {
    ctx.fill();
  }
  if (stroke) {
    ctx.stroke();
  }
};
