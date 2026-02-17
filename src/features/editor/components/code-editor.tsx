import { useEffect, useMemo, useRef } from "react";
import { oneDark } from "@codemirror/theme-one-dark";
import { customTheme } from "../extensions/theme";
import { getLanguageExtension } from "../extensions/language-extensions";
import {indentWithTab , } from "@codemirror/commands";
import { keymap , EditorView} from "@codemirror/view";
import { minimap } from "../extensions/minimap";
import {indentationMarkers } from "@replit/codemirror-indentation-markers";
import { customSetup } from "../extensions/custom-setup";
import {aura} from '@ddietr/codemirror-themes/aura'
import { suggestion } from "../extensions/suggestion";
import { quickEdit } from "../extensions/quick-edit";
import { selectionTooltip } from "../extensions/selection-tooltip";




interface Props{
    fileName : string;
    initialValue? : string
    onChange : (value : string) => void;
}
export const CodeEditor = ({ fileName, initialValue = "", onChange }: Props) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  const languageExtension = useMemo(()=>getLanguageExtension(fileName),[fileName])

  useEffect(() => {
    if (!editorRef.current) return;
    const view = new EditorView({
      doc: initialValue,
      parent: editorRef.current,
      extensions: [
        customSetup,
        customTheme,
        languageExtension,
        suggestion(fileName),
        quickEdit(fileName),
        selectionTooltip(),
        keymap.of([indentWithTab]),
        aura,
        minimap(),
        indentationMarkers(),
        EditorView.updateListener.of((update)=>{
            if(update.docChanged){
                onChange(update.state.doc.toString())
            }
        })

      ],
      
    });
    viewRef.current = view;
    return () => {
      view.destroy();
    };
  }, [languageExtension]);

  return <div ref={editorRef} className="size-full pl-4 bg-background" />;
};
