import humanFormat from 'human-format';
export function humanformat(input: any) {
  return isNaN(input) ? input : humanFormat(input);
}
