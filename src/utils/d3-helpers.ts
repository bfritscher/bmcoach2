import * as d3 from 'd3';

export const colors = d3.scaleOrdinal(d3.schemeCategory10).range();

export const symbols = [
  'circle',
  'diamond',
  'square',
  'star',
  'triangle',
  'wye',
  'none',
];

export const dashs = ['0', '5,5', '10,10', '20,10,5,5,5,10'];

export const SymbolsLookup: { [s: string]: d3.SymbolType } = {
  circle: d3.symbolCircle,
  cross: d3.symbolCross,
  diamond: d3.symbolDiamond,
  square: d3.symbolSquare,
  star: d3.symbolStar,
  triangle: d3.symbolTriangle,
  wye: d3.symbolWye,
};

export const symbolsPaths: { [s: string]: string } = symbols.reduce(
  (all: { [s: string]: string }, name: string) => {
    if (name === 'none') {
      all[name] = '';
    } else {
      const s = SymbolsLookup[name];
      if (s) {
        all[name] = d3.symbol().type(s)() || '';
      }
    }
    return all;
  },
  {},
);
