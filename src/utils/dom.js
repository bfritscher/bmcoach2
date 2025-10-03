export function totalOffset(node) {
  const offsetTotal = {
    top: 0,
    left: 0,
  };
  while (node) {
    offsetTotal.top += node.offsetTop;
    offsetTotal.left += node.offsetLeft;
    node = node.offsetParent;
  }
  return offsetTotal;
}

export function downloadFile(name, url) {
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
