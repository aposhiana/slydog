export function startGameLoop(update, render) {
  let last = performance.now();
  function frame(now) {
    const dt = (now - last) / 1000;
    update(dt);
    render();
    last = now;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
