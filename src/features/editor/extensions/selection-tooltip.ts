import { EditorView, showTooltip, Tooltip } from "@codemirror/view";
import { EditorState, StateField } from "@codemirror/state";
import { quickEdit, quickEditState, showQuickEditEffect } from "./quick-edit";

let editorView: EditorView | null = null;

const createTooltipForSelection = (state: EditorState): readonly Tooltip[] => {
  const selection = state.selection.main;
  if (selection.empty) {
    return [];
  }
  const isQuickEditActive = state.field(quickEditState);
  if (isQuickEditActive) {
    return [];
  }

  return [
    {
      pos: selection.from,
      above: false,
      strictSide: false,
      create() {
        const dom = document.createElement("div");
        dom.className =
          "bg-popover text-popover-foreground rounded-sm border-border-input  p-2 shadow-md flex  gap-2 text-sm z-50";

        const addToChatButton = document.createElement("button");
        addToChatButton.textContent = "Edit with AI";
        addToChatButton.className =
          "bg-primary text-primary-foreground rounded-sm px-2 py-1 font-sans";

        const quickEditButton = document.createElement("button");
       
        quickEditButton.className =
          "bg-secondary text-secondary-foreground rounded-sm px-2 py-1 font-sans";

        const quickEditButtonText = document.createElement("span");
        quickEditButtonText.textContent = "Quick Edit ";

        const quickEditButtonShortcut = document.createElement("span");
        quickEditButtonShortcut.textContent = " Ctrl+K";
        quickEditButtonShortcut.className = "text-xs text-muted-foreground";

        quickEditButton.appendChild(quickEditButtonText);
        quickEditButton.appendChild(quickEditButtonShortcut);

        quickEditButton.onclick = () => {
          if (editorView) {
            editorView.dispatch({
              effects: showQuickEditEffect.of(true),
            });
          }
        };
        dom.appendChild(addToChatButton);
        dom.appendChild(quickEditButton);
        return { dom };
      },
    },
  ];
};

const selectionTooltipField = StateField.define<readonly Tooltip[]>({
  create(state) {
    return createTooltipForSelection(state);
  },
  update(tooltips, tr) {
    if (tr.selection || tr.docChanged) {
      return createTooltipForSelection(tr.state);
    }
    for (const effect of tr.effects) {
      if (effect.is(showQuickEditEffect)) {
        return createTooltipForSelection(tr.state);
      }
    }
    return tooltips;
  },
  provide: (field) =>
    showTooltip.computeN([field], (state) => state.field(field)),
});

const captureViewExtension = EditorView.updateListener.of((update) => {
  editorView = update.view;
});

export const selectionTooltip = () => [
  selectionTooltipField,
  captureViewExtension,
];
