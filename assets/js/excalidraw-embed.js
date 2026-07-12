const EXCALIDRAW_VERSION = "0.18.1";
const EXCALIDRAW_MODULE_URL = `https://esm.sh/@excalidraw/excalidraw@${EXCALIDRAW_VERSION}`;

let excalidrawApiPromise;

function loadExcalidrawApi() {
  if (!excalidrawApiPromise) {
    window.EXCALIDRAW_ASSET_PATH ||= `https://esm.sh/@excalidraw/excalidraw@${EXCALIDRAW_VERSION}/dist/prod/`;
    excalidrawApiPromise = import(EXCALIDRAW_MODULE_URL);
  }

  return excalidrawApiPromise;
}

function decodeScene(encoded) {
  const binary = atob(encoded.trim());
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  const json = new TextDecoder().decode(bytes);

  return JSON.parse(json);
}

function getRenderableElements(scene, api) {
  const elements = Array.isArray(scene?.elements) ? scene.elements : [];

  if (typeof api.getNonDeletedElements === "function") {
    return api.getNonDeletedElements(elements);
  }

  return elements.filter((element) => !element.isDeleted);
}

function getExportAppState(scene, background) {
  const appState = scene?.appState || {};

  return {
    ...appState,
    exportBackground: background !== "transparent",
    exportWithDarkMode: false,
    viewBackgroundColor: background,
  };
}

async function renderEmbed(container, api) {
  const source = container.querySelector(".excalidraw-data");
  const status = container.querySelector(".excalidraw-status");

  try {
    const scene = decodeScene(source?.textContent || "");
    const elements = getRenderableElements(scene, api);

    if (!elements.length) {
      throw new Error("No drawable elements found in scene.");
    }

    const svg = await api.exportToSvg({
      elements,
      appState: getExportAppState(scene, container.dataset.background || "#ffffff"),
      files: scene.files || {},
      exportPadding: Number.parseInt(container.dataset.padding || "24", 10),
    });

    svg.classList.add("excalidraw-svg");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Excalidraw drawing");
    svg.removeAttribute("style");

    container.replaceChildren(svg);
    container.dataset.ready = "true";
  } catch (error) {
    console.error("Failed to render Excalidraw embed:", error);
    if (status) {
      status.textContent = "Excalidraw 图加载失败";
    }
    container.dataset.ready = "false";
  }
}

async function initExcalidrawEmbeds() {
  const containers = [...document.querySelectorAll("[data-excalidraw-embed]")].filter(
    (container) => !container.dataset.initialized,
  );

  if (!containers.length) {
    return;
  }

  containers.forEach((container) => {
    container.dataset.initialized = "true";
  });

  try {
    const api = await loadExcalidrawApi();
    await Promise.all(containers.map((container) => renderEmbed(container, api)));
  } catch (error) {
    console.error("Failed to load Excalidraw renderer:", error);
    containers.forEach((container) => {
      const status = container.querySelector(".excalidraw-status");
      if (status) {
        status.textContent = "Excalidraw 渲染器加载失败";
      }
      container.dataset.ready = "false";
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initExcalidrawEmbeds, { once: true });
} else {
  initExcalidrawEmbeds();
}
