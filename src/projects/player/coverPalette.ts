/* Цвета для ореола под обложкой. Хардкодить оттенок под конкретную картинку
   нельзя: сменится обложка — и свечение окажется чужого цвета, поэтому палитра
   вытаскивается из самого файла.

   Обложка лежит на том же origin, что и страница, поэтому getImageData не
   упирается в SecurityError. crossOrigin намеренно не ставится: на картинке
   с чужого домена без CORS-заголовков он сорвал бы загрузку картинки целиком,
   а без него мы просто получим исключение и останемся на акцентном ореоле. */

export interface CoverPalette {
  /* Триплеты "R G B" — компоненты через ПРОБЕЛ, не через запятую: в CSS
     цвет подставляется в rgb(var(--cover-glow-a) / 0.7), а та форма rgb()
     допускает слэш-альфу только без запятых. С запятыми ("R, G, B") такая
     строка невалидна, и весь background молча отбрасывается в none — ореол
     просто не рисуется, без единой ошибки в консоли. */
  a: string;
  b: string;
}

/* Обложка читается в крошечный квадрат: 36x36 — это 1296 пикселей, хватает
   для устойчивой статистики, а декодируется картинка целиком в любом случае. */
const SAMPLE = 36;
const HUE_STEPS = 24;
const SAT_STEPS = 3;
const LIGHT_STEPS = 3;
/* Насколько второй оттенок должен отличаться от первого. Ближе — два пятна
   сливаются в одно, дальше — ореол выглядит пёстрым. */
const HUE_GAP = 40;

interface Bucket {
  /* В r/g/b лежит взвешенная сумма, делённая на weight при выборе тона. */
  weight: number;
  r: number;
  g: number;
  b: number;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hue = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hue % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hue < 1) [r, g, b] = [c, x, 0];
  else if (hue < 2) [r, g, b] = [x, c, 0];
  else if (hue < 3) [r, g, b] = [0, c, x];
  else if (hue < 4) [r, g, b] = [0, x, c];
  else if (hue < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

const hueDistance = (a: number, b: number): number => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

const hueOf = (bucket: Bucket): number => rgbToHsl(
  bucket.r / bucket.weight / 255,
  bucket.g / bucket.weight / 255,
  bucket.b / bucket.weight / 255
)[0];

/* Корзины строим по оттенку, а не по каналам RGB: обложка почти всегда
   градиентная, и разложение по каналам смешивает соседние оттенки в серый. */
function dominantBuckets(data: Uint8ClampedArray): Bucket[] {
  const buckets = new Map<number, Bucket>();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const [h, s, l] = rgbToHsl(r / 255, g / 255, b / 255);
    /* Бледное и серое ореол не красит, а почти чёрное даёт грязное пятно —
       такие пиксели в голосовании не участвуют. */
    if (s < 0.22 || l < 0.16 || l > 0.88) continue;
    const hue = Math.round(h / 15) % HUE_STEPS;
    const sat = Math.min(SAT_STEPS - 1, Math.round(s * SAT_STEPS));
    const light = Math.min(LIGHT_STEPS - 1, Math.round(l * LIGHT_STEPS));
    const key = (hue * SAT_STEPS + sat) * LIGHT_STEPS + light;
    /* Насыщенный и не тёмный пиксель весит больше: бледный оттенок обложки
       не должен вытеснять цвет, который и читается как «цвет обложки». */
    const weight = s * l;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.weight += weight;
      bucket.r += r * weight;
      bucket.g += g * weight;
      bucket.b += b * weight;
    } else {
      buckets.set(key, { weight, r: r * weight, g: g * weight, b: b * weight });
    }
  }
  return Array.from(buckets.values()).sort((a, b) => b.weight - a.weight);
}

/* Свечение — это фон, а не сама обложка: насыщенность поднимаем, светлоту
   держим на середине. Иначе ореол либо гаснет на тёмной обложке, либо
   выжигает белым пятном поверх тёмной темы. */
function glowTone(bucket: Bucket, hueShift: number): [number, number, number] {
  const [h, s] = rgbToHsl(
    bucket.r / bucket.weight / 255,
    bucket.g / bucket.weight / 255,
    bucket.b / bucket.weight / 255
  );
  return hslToRgb(h + hueShift, Math.min(1, s * 1.3 + 0.1), 0.62);
}

function paletteOf(image: HTMLImageElement): CoverPalette {
  const canvas = document.createElement("canvas");
  canvas.width = SAMPLE;
  canvas.height = SAMPLE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2D-контекст недоступен");
  ctx.drawImage(image, 0, 0, SAMPLE, SAMPLE);
  const buckets = dominantBuckets(ctx.getImageData(0, 0, SAMPLE, SAMPLE).data);
  if (buckets.length === 0) throw new Error("На обложке нет насыщенных цветов");
  const primary = buckets[0];
  const hue = hueOf(primary);
  const secondary = buckets.find((bucket) => hueDistance(hueOf(bucket), hue) >= HUE_GAP);
  /* Обложка одноцветная: второй оттенок получаем сдвигом по кругу, чтобы
     градиент всё равно не был плоским. */
  const a = glowTone(primary, 0);
  const b = secondary ? glowTone(secondary, 0) : glowTone(primary, HUE_GAP);
  return { a: a.join(" "), b: b.join(" ") };
}

export function extractCoverPalette(src: string): Promise<CoverPalette> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      try {
        resolve(paletteOf(image));
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    };
    image.onerror = () => reject(new Error(`Не удалось загрузить обложку: ${src}`));
    image.src = src;
  });
}
