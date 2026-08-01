function mathToDesign(mx, my, scale) {
  return {
    x: scale.originX + mx * scale.scaleX,
    y: scale.originY - my * scale.scaleY
  };
}
function designToMath(dx, dy, scale) {
  return {
    x: (dx - scale.originX) / scale.scaleX,
    y: (scale.originY - dy) / scale.scaleY
  };
}
export {
  designToMath as d,
  mathToDesign as m
};
