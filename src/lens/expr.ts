export type AstNode =
  | { t: "num"; v: number }
  | { t: "var" }
  | { t: "const"; v: number }
  | { t: "un"; op: "+" | "-"; a: AstNode }
  | { t: "bin"; op: "+" | "-" | "*" | "/" | "^"; a: AstNode; b: AstNode }
  | { t: "call"; fn: string; a: AstNode };

export class ExprError extends Error {
  pos: number;

  constructor(message: string, pos: number) {
    super(`${message} (pos ${pos})`);
    this.pos = pos;
  }
}

const FUNCS: Record<string, (x: number) => number> = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  sqrt: Math.sqrt,
  exp: Math.exp,
  log: Math.log,
  ln: Math.log,
  abs: Math.abs,
  floor: Math.floor,
  ceil: Math.ceil,
};

const CONSTS: Record<string, number> = {
  pi: Math.PI,
  e: Math.E,
};

type Tok =
  | { t: "num"; v: number; p: number }
  | { t: "id"; v: string; p: number }
  | { t: "op"; v: string; p: number }
  | { t: "lp"; p: number }
  | { t: "rp"; p: number }
  | { t: "eof"; p: number };

function tokenize(src: string): Tok[] {
  const toks: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === " " || c === "\t" || c === "\n" || c === "\r") {
      i++;
      continue;
    }
    const p = i;
    if ((c >= "0" && c <= "9") || c === ".") {
      const m = /^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(src.slice(i));
      if (!m) throw new ExprError("Invalid number", p);
      toks.push({ t: "num", v: parseFloat(m[0]), p });
      i += m[0].length;
      continue;
    }
    if (/[a-zA-Z_]/.test(c)) {
      const m = /^[a-zA-Z_]\w*/.exec(src.slice(i))!;
      toks.push({ t: "id", v: m[0], p });
      i += m[0].length;
      continue;
    }
    if (src.startsWith("**", i)) {
      toks.push({ t: "op", v: "**", p });
      i += 2;
      continue;
    }
    if ("+-*/^".includes(c)) {
      toks.push({ t: "op", v: c, p });
      i++;
      continue;
    }
    if (c === "(") {
      toks.push({ t: "lp", p });
      i++;
      continue;
    }
    if (c === ")") {
      toks.push({ t: "rp", p });
      i++;
      continue;
    }
    throw new ExprError(`Unexpected character '${c}'`, p);
  }
  toks.push({ t: "eof", p: src.length });
  return toks;
}

export function parseExpr(src: string): AstNode {
  const toks = tokenize(src);
  let k = 0;
  const peek = () => toks[k];
  const isOp = (v: string) => peek().t === "op" && (peek() as { v: string }).v === v;
  const isParen = (t: Tok["t"]) => peek().t === t;

  function expr(): AstNode {
    let left = term();
    while (isOp("+") || isOp("-")) {
      const op = (peek() as { v: "+" | "-" }).v;
      k++;
      left = { t: "bin", op, a: left, b: term() };
    }
    return left;
  }

  function term(): AstNode {
    let left = factor();
    while (isOp("*") || isOp("/")) {
      const op = (peek() as { v: "*" | "/" }).v;
      k++;
      left = { t: "bin", op, a: left, b: factor() };
    }
    return left;
  }

  function factor(): AstNode {
    if (isOp("+") || isOp("-")) {
      const op = (peek() as { v: "+" | "-" }).v;
      k++;
      return { t: "un", op, a: factor() };
    }
    return power();
  }

  function power(): AstNode {
    const base = primary();
    if (isOp("**") || isOp("^")) {
      k++;
      return { t: "bin", op: "^", a: base, b: factor() };
    }
    return base;
  }

  function primary(): AstNode {
    const tk = peek();
    if (tk.t === "num") {
      k++;
      return { t: "num", v: tk.v };
    }
    if (tk.t === "lp") {
      k++;
      const e = expr();
      if (!isParen("rp")) throw new ExprError("Expected ')'", peek().p);
      k++;
      return e;
    }
    if (tk.t === "id") {
      k++;
      if (isParen("lp")) {
        if (!(tk.v in FUNCS)) throw new ExprError(`Unknown function '${tk.v}'`, tk.p);
        k++;
        const a = expr();
        if (!isParen("rp")) throw new ExprError("Expected ')'", peek().p);
        k++;
        return { t: "call", fn: tk.v, a };
      }
      if (tk.v === "r") return { t: "var" };
      if (tk.v in CONSTS) return { t: "const", v: CONSTS[tk.v] };
      throw new ExprError(`Unknown variable '${tk.v}'`, tk.p);
    }
    throw new ExprError("Expected expression", tk.p);
  }

  const root = expr();
  if (peek().t !== "eof") throw new ExprError("Unexpected token", peek().p);
  return root;
}

export function evalExpr(node: AstNode, r: number): number {
  switch (node.t) {
    case "num":
      return node.v;
    case "var":
      return r;
    case "const":
      return node.v;
    case "un": {
      const v = evalExpr(node.a, r);
      return node.op === "-" ? -v : v;
    }
    case "bin": {
      const a = evalExpr(node.a, r);
      const b = evalExpr(node.b, r);
      switch (node.op) {
        case "+":
          return a + b;
        case "-":
          return a - b;
        case "*":
          return a * b;
        case "/":
          return a / b;
        case "^":
          return Math.pow(a, b);
      }
    }
    case "call":
      return FUNCS[node.fn](evalExpr(node.a, r));
  }
}

const cache = new Map<string, AstNode>();

export function compile(src: string): AstNode {
  let ast = cache.get(src);
  if (!ast) {
    ast = parseExpr(src);
    cache.set(src, ast);
  }
  return ast;
}

export function evaluate(src: string, r: number): number {
  return evalExpr(compile(src), r);
}

const COEFF_NAMES = ["z0", "a2", "a4", "a6"] as const;

export function substituteCoeffs(src: string, coeffs: Record<string, number>): string {
  return src.replace(/\b(z0|a2|a4|a6)\b/g, (m) => {
    const v = coeffs[m];
    return v === undefined ? m : String(v);
  });
}
