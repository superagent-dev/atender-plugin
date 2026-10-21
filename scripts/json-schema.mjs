// A small JSON Schema validator for the keywords the Agent Plugins 1.0.0 schemas use, so the
// checks need no npm package. An unknown keyword is an error: a schema update that adds one must
// not pass in silence.
const ANNOTATIONS = new Set(['$schema', '$id', 'title', 'description', '$defs', 'default']);

const typeOf = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : Number.isInteger(v) ? 'integer' : typeof v);
const isType = (v, t) => t === typeOf(v) || (t === 'number' && typeof v === 'number');

export function validate(root, value) {
  const errors = [];
  const walk = (schema, v, at) => {
    if (schema === true) return;
    if (schema === false) return errors.push(`${at}: no value is allowed here`);
    for (const [key, rule] of Object.entries(schema)) {
      if (ANNOTATIONS.has(key)) continue;
      switch (key) {
        case '$ref': {
          const m = /^#\/\$defs\/(.+)$/.exec(rule);
          if (!m || !root.$defs?.[m[1]]) throw new Error(`schema: cannot resolve $ref ${rule}`);
          walk(root.$defs[m[1]], v, at);
          break;
        }
        case 'type':
          if (!(Array.isArray(rule) ? rule : [rule]).some((t) => isType(v, t))) errors.push(`${at}: must be ${rule}, is ${typeOf(v)}`);
          break;
        case 'const':
          if (JSON.stringify(v) !== JSON.stringify(rule)) errors.push(`${at}: must be ${JSON.stringify(rule)}`);
          break;
        case 'enum':
          if (!rule.some((e) => JSON.stringify(e) === JSON.stringify(v))) errors.push(`${at}: must be one of ${JSON.stringify(rule)}`);
          break;
        case 'minLength':
          if (typeof v === 'string' && [...v].length < rule) errors.push(`${at}: ${rule} characters or more`);
          break;
        case 'maxLength':
          if (typeof v === 'string' && [...v].length > rule) errors.push(`${at}: ${rule} characters or fewer`);
          break;
        case 'pattern':
          if (typeof v === 'string' && !new RegExp(rule, 'u').test(v)) errors.push(`${at}: must match ${rule}`);
          break;
        case 'required':
          if (typeOf(v) === 'object') for (const r of rule) if (!(r in v)) errors.push(`${at}: "${r}" is required`);
          break;
        case 'properties':
          if (typeOf(v) === 'object') for (const [k, s] of Object.entries(rule)) if (k in v) walk(s, v[k], `${at}.${k}`);
          break;
        case 'additionalProperties':
          if (typeOf(v) === 'object') {
            for (const k of Object.keys(v)) {
              if (schema.properties && k in schema.properties) continue;
              if (rule === false) errors.push(`${at}: "${k}" is not allowed`);
              else walk(rule, v[k], `${at}.${k}`);
            }
          }
          break;
        case 'propertyNames':
          if (typeOf(v) === 'object') for (const k of Object.keys(v)) walk(rule, k, `${at} key "${k}"`);
          break;
        case 'items':
          if (Array.isArray(v)) v.forEach((item, i) => walk(rule, item, `${at}[${i}]`));
          break;
        case 'not': {
          const before = errors.length;
          walk(rule, v, at);
          const matched = errors.length === before;
          errors.length = before;
          if (matched) errors.push(`${at}: must not match ${JSON.stringify(rule)}`);
          break;
        }
        case 'oneOf': {
          const results = rule.map((s) => {
            const before = errors.length;
            walk(s, v, at);
            const found = errors.splice(before);
            return found;
          });
          const passed = results.filter((r) => r.length === 0).length;
          if (passed !== 1) {
            const nearest = results.reduce((a, b) => (b.length < a.length ? b : a));
            errors.push(`${at}: must match exactly one of ${rule.length} forms, matches ${passed}${passed ? '' : ` (nearest: ${nearest.join('; ')})`}`);
          }
          break;
        }
        default:
          throw new Error(`schema: the keyword "${key}" is not supported by scripts/json-schema.mjs`);
      }
    }
  };
  walk(root, value, '$');
  return errors;
}
