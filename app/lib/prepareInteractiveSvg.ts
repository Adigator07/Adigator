const BACKGROUND_IDS = new Set([
  "background-simple",
  "background-complete",
  "Shadow",
  "Ground",
  "Floor",
  "Plants",
  "Plant",
  "Squares",
]);

function isCharacterId(id: string) {
  return id === "Character" || /^character(-\d+)?$/i.test(id);
}

function characterAnimationDelay(id: string) {
  const match = id.match(/character-(\d+)/i);
  if (!match) return 0;
  return (Number(match[1]) - 1) * 0.45;
}

function isObjectId(id: string) {
  return /Device|Chart|Tab|Target|Calendar|Board|Clocks|Gears|Arrows|Numbers|Stairs|Icons|Graphics|Locators|piggy-bank|wifi-icon|world-icon|share-icon|speech-bubbles|Clouds|cloud-/i.test(
    id,
  );
}

export function prepareInteractiveSvg(raw: string): string {
  let svg = raw.replace(/<svg\b/, '<svg focusable="false" class="illustration-svg h-auto w-full max-w-full"');

  svg = svg.replace(/<g id="([^"]+)"/g, (match, id: string) => {
    if (BACKGROUND_IDS.has(id)) {
      return `<g id="${id}" pointer-events="none"`;
    }

    const classes = ["illustration-hotspot"];
    let styleAttr = "";

    if (isCharacterId(id)) {
      classes.push("illustration-hotspot--character");
      const delay = characterAnimationDelay(id);
      if (delay > 0) {
        styleAttr = ` style="animation-delay:${delay}s"`;
      }
    } else if (isObjectId(id)) {
      classes.push("illustration-hotspot--object");
    } else {
      classes.push("illustration-hotspot--accent");
    }

    return `<g id="${id}" class="${classes.join(" ")}"${styleAttr}`;
  });

  return svg;
}
