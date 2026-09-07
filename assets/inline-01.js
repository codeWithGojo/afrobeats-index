// Keep artist photography available on lightweight/static deployments.
    window.addEventListener("error", function (event) {
      const image = event.target;
      if (!(image instanceof HTMLImageElement) || image.dataset.repoFallback) return;
      const source = image.getAttribute("src") || "";
      if (!source || /^(?:https?:|data:|blob:)/i.test(source)) return;
      image.dataset.repoFallback = "true";
      image.src = "https://raw.githubusercontent.com/codeWithGojo/afrobeats-index/main/" + source.replace(/^\.\//, "");
    }, true);
