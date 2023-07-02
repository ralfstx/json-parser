import { describe, expect, it } from '@jest/globals';

import { parseJSON } from './json.js';

describe('parseJSON', () => {
  it('parses true', () => {
    expect(parseJSON('true')).toBe(true);
  });

  it('parses false', () => {
    expect(parseJSON('false')).toBe(false);
  });

  it('parses null', () => {
    expect(parseJSON('null')).toBe(null);
  });

  it('throws for invalid literal', () => {
    expect(() => parseJSON('falsy')).toThrow(
      "Unexpected character 'y' in JSON at position 4 (expected literal 'false')"
    );
    expect(() => parseJSON('fals')).toThrow(
      "Unexpected end of JSON input (expected literal 'false')"
    );
  });

  it('skips whitespace before and after valid json', () => {
    expect(parseJSON(' \t\r\n[23] \t\r\n')).toEqual([23]);
  });

  it('throws for empty input', () => {
    expect(() => parseJSON('')).toThrow('Unexpected end of JSON input');
    expect(() => parseJSON(' ')).toThrow('Unexpected end of JSON input');
  });

  it('throws for extra characters after valid JSON', () => {
    expect(() => parseJSON('[23],')).toThrow("Unexpected character ',' in JSON at position 4");
    expect(() => parseJSON('[23] ,')).toThrow("Unexpected character ',' in JSON at position 5");
  });

  it('throws instance of SyntaxError', () => {
    expect(() => parseJSON('not json')).toThrow(SyntaxError);
  });

  describe('strings', () => {
    it('parses empty string', () => {
      expect(parseJSON('""')).toBe('');
    });

    it('parses string with characters', () => {
      expect(parseJSON('"foo"')).toBe('foo');
    });

    it('parses string with escape characters', () => {
      expect(parseJSON('"foo\\"bar"')).toBe('foo"bar');
      expect(parseJSON('"foo\\/bar"')).toBe('foo/bar');
      expect(parseJSON('"foo\\\\bar"')).toBe('foo\\bar');
      expect(parseJSON('"foo\\bbar"')).toBe('foo\bbar');
      expect(parseJSON('"foo\\fbar"')).toBe('foo\fbar');
      expect(parseJSON('"foo\\nbar"')).toBe('foo\nbar');
      expect(parseJSON('"foo\\rbar"')).toBe('foo\rbar');
      expect(parseJSON('"foo\\tbar"')).toBe('foo\tbar');
      expect(parseJSON('"foo\\u0020bar"')).toBe('foo bar');
      expect(parseJSON('"foo\\n\\tbar"')).toBe('foo\n\tbar');
    });

    it('supports 16-bit unicode characters', () => {
      expect(parseJSON('"✅"')).toBe('✅');
      expect(parseJSON('"\\u2705"')).toBe('\u2705');
    });

    it('throws for string with invalid escape character', () => {
      expect(() => parseJSON('"foo\\xbar"')).toThrow(
        "Unexpected character 'x' in JSON at position 5 (invalid escape sequence)"
      );
    });

    it('throws for unclosed string', () => {
      expect(() => parseJSON('"foo')).toThrow('Unexpected end of JSON input (unclosed string)');
      expect(() => parseJSON('"foo\\"')).toThrow('Unexpected end of JSON input (unclosed string)');
    });

    it('throws for string with invalid hex escape character', () => {
      expect(() => parseJSON('"foo\\uxbar"')).toThrow(
        "Unexpected character 'x' in JSON at position 6 (invalid hexadecimal escape sequence)"
      );
      expect(() => parseJSON('"foo\\u000xbar"')).toThrow(
        "Unexpected character 'x' in JSON at position 9 (invalid hexadecimal escape sequence)"
      );
      expect(() => parseJSON('"foo\\u000"')).toThrow(
        "Unexpected character '\"' in JSON at position 9 (invalid hexadecimal escape sequence)"
      );
    });

    it('throws for string with unescaped control character', () => {
      expect(() => parseJSON('"foo\nbar"')).toThrow(
        "Unexpected character '\\n' in JSON at position 4"
      );
    });
  });

  describe('numbers', () => {
    it('parses integer numbers', () => {
      expect(parseJSON('0')).toBe(0);
      expect(parseJSON('1')).toBe(1);
      expect(parseJSON('23')).toBe(23);
    });

    it('parses negative integer numbers', () => {
      expect(parseJSON('-0')).toBe(-0);
      expect(parseJSON('-1')).toBe(-1);
      expect(parseJSON('-23')).toBe(-23);
    });

    it('throws for number with leading zero', () => {
      expect(() => parseJSON('023')).toThrow("Unexpected character '2' in JSON at position 1");
      expect(() => parseJSON('-023')).toThrow("Unexpected character '2' in JSON at position 2");
    });

    it('parses decimal numbers', () => {
      expect(parseJSON('0.1')).toBe(0.1);
      expect(parseJSON('0.01')).toBe(0.01);
      expect(parseJSON('123.456')).toBe(123.456);
    });

    it('parses negative decimal number', () => {
      expect(parseJSON('-0.1')).toBe(-0.1);
    });

    it('throws for decimal number without leading zero', () => {
      expect(() => parseJSON('.1')).toThrow("Unexpected character '.' in JSON at position 0");
    });

    it('throws for decimal number without decimal digit', () => {
      expect(() => parseJSON('1.')).toThrow('Unexpected end of JSON input (expected a digit)');
    });

    it('parses number with exponent', () => {
      expect(parseJSON('1e3')).toBe(1e3);
      expect(parseJSON('1e03')).toBe(1e3);
      expect(parseJSON('1.2e34')).toBe(1.2e34);
      expect(parseJSON('-1.2e34')).toBe(-1.2e34);
      expect(parseJSON('-1.2e+34')).toBe(-1.2e34);
      expect(parseJSON('-1.2e-34')).toBe(-1.2e-34);
    });
  });

  describe('array', () => {
    it('parses empty array', () => {
      expect(parseJSON('[]')).toEqual([]);
    });

    it('parses array with one element', () => {
      expect(parseJSON('[23]')).toEqual([23]);
    });

    it('parses array with multiple elements', () => {
      expect(parseJSON('[23,42]')).toEqual([23, 42]);
    });

    it('skips whitespace in array', () => {
      expect(parseJSON('[ 23 , 42 ]')).toEqual([23, 42]);
    });

    it('throws for invalid tokens in array', () => {
      expect(() => parseJSON('[x]')).toThrow(
        "Unexpected character 'x' in JSON at position 1 (expected a JSON value)"
      );
      expect(() => parseJSON('[, 23')).toThrow(
        "Unexpected character ',' in JSON at position 1 (expected a JSON value)"
      );
      expect(() => parseJSON('[23,]')).toThrow(
        "Unexpected character ']' in JSON at position 4 (expected a JSON value)"
      );
    });

    it('throws for unclosed array', () => {
      expect(() => parseJSON('[23, 42')).toThrow(
        "Unexpected end of JSON input (expected ',' or ']')"
      );
    });
  });

  describe('object', () => {
    it('parses empty object', () => {
      expect(parseJSON('{}')).toEqual({});
    });

    it('parses object with one member', () => {
      expect(parseJSON('{"foo":23}')).toEqual({ foo: 23 });
    });

    it('parses object with multiple members', () => {
      expect(parseJSON('{"foo":23,"bar":42}')).toEqual({ foo: 23, bar: 42 });
    });

    it('skips whitespace in object', () => {
      expect(parseJSON('{ "foo" : 23 , "bar" : 42 }')).toEqual({ foo: 23, bar: 42 });
    });

    it('throws for invalid tokens in object', () => {
      expect(() => parseJSON('{ 23, "bar": 42')).toThrow(
        "Unexpected character '2' in JSON at position 2 (expected object member or '}')"
      );
      expect(() => parseJSON('{ "foo", "bar": 42')).toThrow(
        "Unexpected character ',' in JSON at position 7 (expected ':')"
      );
    });

    it('throws for unclosed object', () => {
      expect(() => parseJSON('{ "foo" : 23 , "bar" : 42')).toThrow(
        "Unexpected end of JSON input (expected ',' or '}')"
      );
    });
  });
});
