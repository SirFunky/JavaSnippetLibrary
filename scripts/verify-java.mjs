// Compile every example at its declared minimum Java release, with context
// variables supplied explicitly. No network requests, SQL, or UI code is executed.
import { parse } from "yaml";
import {
  readFileSync,
  readdirSync,
  mkdirSync,
  writeFileSync,
  existsSync,
} from "node:fs";
import { join, delimiter } from "node:path";
import { spawnSync } from "node:child_process";
const root = "artifacts/java-verification";
mkdirSync(root, { recursive: true });
const dependencies = [
  [
    "jackson-databind",
    "https://repo.maven.apache.org/maven2/com/fasterxml/jackson/core/jackson-databind/2.17.3/jackson-databind-2.17.3.jar",
  ],
  [
    "jackson-core",
    "https://repo.maven.apache.org/maven2/com/fasterxml/jackson/core/jackson-core/2.17.3/jackson-core-2.17.3.jar",
  ],
  [
    "jackson-annotations",
    "https://repo.maven.apache.org/maven2/com/fasterxml/jackson/core/jackson-annotations/2.17.3/jackson-annotations-2.17.3.jar",
  ],
  ...["base", "graphics", "controls"].map((name) => [
    `javafx-${name}`,
    `https://repo.maven.apache.org/maven2/org/openjfx/javafx-${name}/17.0.12/javafx-${name}-17.0.12-win.jar`,
  ]),
];
const jars = [];
for (const [name, url] of dependencies) {
  const target = join(root, `${name}.jar`);
  if (!existsSync(target)) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${url}: ${response.status}`);
    writeFileSync(target, Buffer.from(await response.arrayBuffer()));
  }
  jars.push(target);
}
const context = {
  "strings-blank": 'String text=" ";',
  "strings-join": 'List<String> names=java.util.Arrays.asList("Ada","Linus");',
  "strings-split": 'String text="Ada, Linus,";',
  "strings-regex": 'String text="abc123def456";',
  "strings-replace": 'String text="old";',
  "lists-deduplicate":
    'List<String> names=java.util.Arrays.asList("Ada","Ada");',
  "lists-sort": 'List<String> names=java.util.Arrays.asList("Linus","Ada");',
  "lists-remove":
    'java.util.List<String> names=new java.util.ArrayList<>(java.util.Arrays.asList("Ada"," "));',
  "maps-count": 'String[] words={"one","two","one"};',
  "maps-default": "Map<String,String> settings=new java.util.HashMap<>();",
  "maps-group": 'List<String> names=java.util.Arrays.asList("Ada","Alan");',
  "sets-intersection":
    "Set<String> first=new HashSet<>(),second=new HashSet<>();",
  "streams-filter-map": 'List<String> names=java.util.Arrays.asList("Ada","");',
  "streams-find":
    'java.util.List<String> names=java.util.Arrays.asList("Ada","Linus");',
  "streams-sum":
    "java.util.List<Integer> numbers=java.util.Arrays.asList(1,2,3);",
  "basics-parse-int": 'String text="42";',
  "jdbc-connect":
    'String jdbcUrl="jdbc:example:database",username="user",password="from-environment";',
  "jdbc-prepared":
    'java.sql.Connection connection=null;String email="ada@example.com";',
  "javafx-run-later":
    "javafx.scene.control.Label label=new javafx.scene.control.Label();",
};
function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)],
  );
}
let count = 0;
for (const file of files("DefaultSnippets")) {
  const raw = readFileSync(file, "utf8");
  const match = raw.match(/^---\n([\s\S]*?)\n---\n/);
  const m = parse(match[1]);
  const code = raw.match(/```java\n([\s\S]*?)\n```/)[1];
  const className =
    m.id === "patterns-singleton" ? "AppConfig" : `Example${count}`;
  const source =
    m.id === "patterns-singleton"
      ? code
      : `${(m.imports ?? []).map((i) => `import ${i};`).join("\n")}\npublic class ${className} { public static void example() throws Exception {\n${context[m.id] ?? ""}\n${code}\n} }`;
  const sourcePath = join(root, `${className}.java`);
  writeFileSync(sourcePath, source);
  const result = spawnSync(
    "javac",
    [
      "--release",
      String(m.javaVersion),
      "-Xlint:-options",
      "-cp",
      jars.join(delimiter),
      "-d",
      root,
      sourcePath,
    ],
    { encoding: "utf8" },
  );
  if (result.status !== 0) {
    console.error(
      `${m.id} (Java ${m.javaVersion}):\n${result.stderr ?? result.error}`,
    );
    process.exitCode = 1;
  } else {
    console.log(`PASS Java ${m.javaVersion}: ${m.id}`);
    count++;
  }
}
if (!process.exitCode)
  console.log(
    `All ${count} Java examples compiled at their declared minimum release.`,
  );
