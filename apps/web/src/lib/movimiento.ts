export function irAlReproductor(push: (href: string) => void, href = "/ahora") {
  const reducir = document.documentElement.dataset.reduceMotion === "true" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const inicio = document.startViewTransition?.bind(document);
  if (reducir || !inicio) {
    push(href);
    return;
  }
  inicio(() => {
    push(href);
  });
}
