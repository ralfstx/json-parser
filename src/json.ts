export type ParseOpts = {
  handleNumber: (input: string) => unknown;
};

export function parseJSON(input: string, opts?: ParseOpts) {
  let pos = 0;

  const value = parseValue();
  skipWs();
  if (peek()) throw unexpected();
  return value;

  function parseValue(): unknown {
    skipWs();
    const ch = peek();
    if (ch === '{') return parseObject();
    if (ch === '[') return parseArray();
    if (ch === '"') return parseString();
    if (ch === 't') return parseLiteral('true') && true;
    if (ch === 'f') return parseLiteral('false') && false;
    if (ch === 'n') return parseLiteral('null') && null;
    if (isNumberStart(ch)) return parseNumber();
    throw unexpected('expected a JSON value');
  }

  function parseLiteral(literal: string) {
    for (let i = 0; i < literal.length; i++) {
      if (!read(literal.charAt(i))) {
        throw unexpected(`expected literal '${literal}'`);
      }
    }
    return true;
  }

  function parseNumber() {
    const start = pos;
    read('-');
    const firstDigit = readDigit();
    if (!firstDigit) throw unexpected('expected a digit');
    if (firstDigit !== '0') {
      while (readDigit());
    }
    readFraction();
    readExponent();
    const str = input.substring(start, pos);
    return opts?.handleNumber ? opts.handleNumber(str) : parseFloat(str);
  }

  function readFraction() {
    if (!read('.')) return false;
    if (!readDigit()) throw unexpected('expected a digit');
    while (readDigit());
    return true;
  }

  function readExponent() {
    if (!read('e') && !read('E')) return false;
    read('-') || read('+');
    if (!readDigit()) throw unexpected('expected a digit');
    while (readDigit());
    return true;
  }

  function readDigit() {
    const ch = peek();
    if (ch >= '0' && ch <= '9') {
      return read();
    }
  }

  function parseString() {
    let str = '';
    if (!read('"')) throw unexpected('expected a string');
    while (!read('"')) {
      const ch = peek();
      if (!ch) throw unexpected('unclosed string');
      if (ch <= '\u001f') throw unexpected('unescaped character in string');
      str += ch === '\\' ? parseEscape() : read();
    }
    return str;
  }

  function parseEscape() {
    read('\\');
    if (read('"')) return '"';
    if (read('/')) return '/';
    if (read('\\')) return '\\';
    if (read('b')) return '\b';
    if (read('f')) return '\f';
    if (read('n')) return '\n';
    if (read('r')) return '\r';
    if (read('t')) return '\t';
    if (read('u')) {
      const hexChars = [];
      for (let i = 0; i < 4; i++) {
        const ch = readHexDigit();
        if (!ch) throw unexpected('invalid hexadecimal escape sequence');
        hexChars.push(ch);
      }
      return String.fromCharCode(parseInt(hexChars.join(''), 16));
    }
    throw unexpected('invalid escape sequence');
  }

  function parseArray() {
    const array: unknown[] = [];
    read('[');
    skipWs();
    if (read(']')) return [];
    do {
      skipWs();
      const value = parseValue();
      array.push(value);
      skipWs();
    } while (read(','));
    if (!read(']')) throw unexpected("expected ',' or ']'");
    return array;
  }

  function parseObject() {
    read('{');
    skipWs();
    if (read('}')) return {};
    const object: Record<string, unknown> = {};
    do {
      skipWs();
      if (peek() !== '"') throw unexpected("expected object member or '}'");
      const name = parseString();
      skipWs();
      if (!read(':')) throw unexpected("expected ':'");
      skipWs();
      const value = parseValue();
      object[name] = value;
      skipWs();
    } while (read(','));
    if (!read('}')) throw unexpected("expected ',' or '}'");
    return object;
  }

  function isNumberStart(ch: string) {
    return ch === '-' || (ch >= '0' && ch <= '9');
  }

  function readHexDigit() {
    const ch = peek();
    if ((ch >= '0' && ch <= '9') || (ch >= 'a' && ch <= 'f') || (ch >= 'A' && ch <= 'F')) {
      return read();
    }
  }

  function skipWs() {
    let ch = peek();
    while (ch === ' ' || ch === '\r' || ch === '\n' || ch === '\t') {
      read();
      ch = peek();
    }
  }

  function peek() {
    return input.charAt(pos);
  }

  function read(expected?: string) {
    const ch = peek();
    if (expected && ch !== expected) return '';
    pos++;
    return ch;
  }

  function unexpected(message?: string) {
    const ch = input.charAt(pos);
    const unexpectedStr = ch
      ? `Unexpected character '${printChar(ch)}' in JSON at position ${pos}`
      : `Unexpected end of JSON input`;
    const messageStr = message ? ` (${message})` : '';
    return new SyntaxError(`${unexpectedStr}${messageStr}`);
  }

  function printChar(char: string) {
    if (char === '\n') return '\\n';
    if (char === '\r') return '\\r';
    if (char === '\t') return '\\t';
    if (char === '\b') return '\\b';
    if (char === '\f') return '\\f';
    if (char === '\\') return '\\\\';
    if (char <= '\u001f') {
      const hex = char.charCodeAt(0).toString(16);
      return '\\u' + '0000'.substring(hex.length) + hex;
    }
    return char;
  }
}
