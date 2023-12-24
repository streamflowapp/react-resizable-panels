import { isDevelopment } from "#is-development";
import { PanelConstraints } from "../Panel";
import { assert } from "./assert";
import { fuzzyNumbersEqual } from "./numbers/fuzzyNumbersEqual";
import { resizePanel } from "./resizePanel";

// All units must be in percentages; pixel values should be pre-converted
export function validatePanelGroupLayout({
  layout: prevLayout,
  panelConstraints,
}: {
  layout: number[];
  panelConstraints: PanelConstraints[];
}): number[] {
  const nextLayout = [...prevLayout];
  const nextLayoutTotalSize = nextLayout.reduce(
    (accumulated, current) => accumulated + current,
    0
  );

  // Validate layout expectations
  if (nextLayout.length !== panelConstraints.length) {
    throw Error(
      `Invalid ${panelConstraints.length} panel layout: ${nextLayout
        .map((size) => `${size}%`)
        .join(", ")}`
    );
  } else if (!fuzzyNumbersEqual(nextLayoutTotalSize, 100)) {
    // This is not ideal so we should warn about it, but it may be recoverable in some cases
    // (especially if the amount is small)
    if (isDevelopment) {
      console.warn(
        `WARNING: Invalid layout total size: ${nextLayout
          .map((size) => `${size}%`)
          .join(", ")}. Layout normalization will be applied.`
      );
    }
    for (let index = 0; index < panelConstraints.length; index++) {
      const unsafeSize = nextLayout[index];
      assert(unsafeSize != null);
      const safeSize = (100 / nextLayoutTotalSize) * unsafeSize;
      nextLayout[index] = safeSize;
    }
  }

  let remainingSize = 0;

  // First pass: Validate the proposed layout given each panel's constraints
  for (let index = 0; index < panelConstraints.length; index++) {
    const unsafeSize = nextLayout[index];
    assert(unsafeSize != null);

    const safeSize = resizePanel({
      panelConstraints,
      panelIndex: index,
      size: unsafeSize,
    });

    if (unsafeSize != safeSize) {
      remainingSize += unsafeSize - safeSize;

      nextLayout[index] = safeSize;
    }
  }

  return nextLayout;
}
