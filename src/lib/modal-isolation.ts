/** Temporarily make siblings outside an active dialog inert. */
export function isolateModal(modal: HTMLElement) {
  const previousStates: Array<[HTMLElement, boolean]> = [];
  let branch: HTMLElement = modal;

  while (branch.parentElement && branch.parentElement !== document.body) {
    const parent = branch.parentElement;
    for (const sibling of Array.from(parent.children)) {
      if (sibling instanceof HTMLElement && sibling !== branch) {
        previousStates.push([sibling, sibling.inert]);
        sibling.inert = true;
      }
    }
    branch = parent;
  }

  if (branch.parentElement === document.body) {
    for (const sibling of Array.from(document.body.children)) {
      if (sibling instanceof HTMLElement && sibling !== branch) {
        previousStates.push([sibling, sibling.inert]);
        sibling.inert = true;
      }
    }
  }

  return () => {
    for (const [element, wasInert] of previousStates.reverse()) {
      element.inert = wasInert;
    }
  };
}
