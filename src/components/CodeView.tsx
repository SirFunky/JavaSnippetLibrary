import { useEffect, useState } from "react";
import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import java from "@shikijs/langs/java";
import dark from "@shikijs/themes/github-dark";
import light from "@shikijs/themes/github-light";
const highlighter = createHighlighterCore({
  themes: [dark, light],
  langs: [java],
  engine: createJavaScriptRegexEngine(),
});
export default function CodeView({
  code,
  fontSize = 13,
}: {
  code: string;
  fontSize?: number;
}) {
  const [html, setHtml] = useState("");
  useEffect(() => {
    let active = true;
    highlighter
      .then((h) => {
        if (active)
          setHtml(
            h.codeToHtml(code, {
              lang: "java",
              themes: { light: "github-light", dark: "github-dark" },
              defaultColor: false,
            }),
          );
      })
      .catch(() => {
        if (active) setHtml("");
      });
    return () => {
      active = false;
    };
  }, [code]);
  return (
    <div className="code-view" style={{ fontSize }}>
      {html ? (
        <div dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <pre>
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}
