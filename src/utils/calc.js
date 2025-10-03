import * as math from 'mathjs';
import toposort from 'toposort';

function extractVar(node) {
  let list = [];
  if (node.args) {
    list = list.concat(...node.args.map(extractVar));
  }
  if (node.content) {
    list = list.concat(extractVar(node.content));
  }
  if (node.name) {
    let name = node.name;
    if (node.object && node.object.name) {
      name = `${node.object.name}.${name}`;
    }
    list.push(name);
  }

  return list;
}

function generateDeps(notes) {
  const graph = {
    nodes: new Set(
      notes.reduce(
        (list, note) =>
          list.concat(
            Object.keys(note.values || {}).map((k) => `${note.calcId}.${k}`),
          ),
        [],
      ),
    ),
    edges: [],
  };
  notes.forEach((note) => {
    Object.keys(note.values || {}).forEach((key) => {
      // extract dependencies
      try {
        const vars = extractVar(math.parse(note.values[key]));
        graph.edges = graph.edges.concat(
          vars.map((dep) => {
            if (dep.indexOf('.') === -1) {
              dep = `${note.calcId}.${dep}`;
            }
            const from = `${note.calcId}.${key}`;
            graph.nodes.add(from);
            graph.nodes.add(dep);
            return [from, dep];
          }),
        );
        // eslint-disable-next-line
      } catch (e) {}
    });
  });
  return graph;
}

export default function solve(notes) {
  let sortedDeps;
  try {
    const graph = generateDeps(notes);
    sortedDeps = toposort.array([...graph.nodes], graph.edges);
  } catch (e) {
    const regex = /(.*): "(.*)"/;
    const m = regex.exec(e.message);
    return m
      ? {
          [`err_${m[2]}`]: m[1],
        }
      : { err: e.message };
  }
  sortedDeps.reverse();
  const parser = math.parser();
  const dict = notes.reduce((d, note) => {
    if (note.calcId) {
      d[note.calcId] = Object.keys(note.values || {}).reduce((v, key) => {
        let transformedValue = note.values[key];
        Object.keys(note.values).forEach((varKey) => {
          transformedValue = String(transformedValue).replace(
            new RegExp(
              `[^\\.a-zA-Z](${varKey})[^\\.a-zA-Z]|^(${varKey})[^\\.a-zA-Z]|[^\\.a-zA-Z](${varKey})$`,
              'gm',
            ),
            `${note.calcId}.${varKey}`,
          );
        });
        v[key] = transformedValue;
        return v;
      }, {});
      try {
        parser.evaluate(`${note.calcId} = {}`);
      } catch (e) {
        return { err: 'Unsupported ID' };
      }
    }
    return d;
  }, {});
  sortedDeps.forEach((dep) => {
    const [calcId, key] = dep.split('.');
    try {
      parser.evaluate(`${dep} = ${dict[calcId][key]}`);
    } catch (e) {
      parser.set(`err_${dep}`, e.message);
    }
  });

  return parser.getAll();
}
