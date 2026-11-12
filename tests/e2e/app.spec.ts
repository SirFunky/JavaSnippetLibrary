import { test, expect } from "@playwright/test";
test("browse, search, favorites, copy, edit, import, export and themes", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await expect(page.getByRole("listbox").getByRole("option")).toHaveCount(36);
  await page.keyboard.press("Control+k");
  await page
    .getByRole("textbox", { name: "Search snippets" })
    .fill("read text file");
  await page
    .getByRole("listbox")
    .getByRole("option")
    .filter({ hasText: "Read a text file" })
    .click();
  await expect(page.locator("main h2")).toHaveText("Read a text file");
  await expect(
    page.getByRole("button", { name: "Import snippets", exact: true }),
  ).toBeInViewport();
  await expect(page.locator(".results-footer")).toBeInViewport();
  await page.getByRole("button", { name: "Copy code", exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    "Files.readString",
  );
  await page
    .getByRole("button", { name: "Copy with imports", exact: true })
    .click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    "import java.nio.file.Files;",
  );
  await page.getByRole("button", { name: "Add to favorites" }).click();
  await page
    .getByRole("button", { name: "Favorites", exact: false })
    .first()
    .click();
  await expect(page.getByRole("listbox").getByRole("option")).toHaveCount(1);
  await page.reload();
  await expect(page.getByRole("listbox").getByRole("option")).toHaveCount(1);
  await page.getByRole("button", { name: "Edit snippet", exact: true }).click();
  const editor = page.getByRole("textbox", { name: "Snippet Markdown" });
  await editor.fill(
    (await editor.inputValue()).replace(
      "Read a text file",
      "Read a UTF-8 document",
    ),
  );
  await page.getByRole("button", { name: "Save snippet", exact: true }).click();
  await expect(page.locator("main h2")).toHaveText("Read a UTF-8 document");
  await page.getByRole("button", { name: "New snippet", exact: false }).click();
  const source = page.getByRole("textbox", { name: "Snippet Markdown" });
  await source.fill(
    (await source.inputValue())
      .replace("my-new-snippet", "ui-created")
      .replace("My new snippet", "Created in test"),
  );
  await page.getByRole("button", { name: "Save snippet", exact: true }).click();
  await expect(page.locator("main h2")).toHaveText("Created in test");
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export snippet", exact: true })
    .click();
  expect((await downloadPromise).suggestedFilename()).toBe("ui-created.md");
  await page.locator("input[type=file]").setInputFiles({
    name: "import-test.md",
    mimeType: "text/markdown",
    buffer: Buffer.from(
      "---\nid: ui-imported\ntitle: Imported snippet\ndescription: Imported through the UI.\ncategory: Utilities\ntags: [test]\njavaVersion: 8\n---\n\n```java\nint answer = 42;\n```\n",
    ),
  });
  await page
    .getByRole("textbox", { name: "Search snippets" })
    .fill("Imported snippet");
  await expect(page.locator("main h2")).toHaveText("Imported snippet");
  await page.getByRole("button", { name: "More snippet actions" }).click();
  await page
    .getByRole("button", { name: "Delete snippet", exact: true })
    .click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Delete snippet", exact: true })
    .click();
  await expect(page.getByRole("listbox").getByRole("option")).toHaveCount(0);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "light", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByLabel("Code font size").fill("16");
  await page.getByRole("button", { name: "Close settings" }).click();
  await page.getByRole("button", { name: "Clear all filters" }).click();
  await page.getByRole("listbox").focus();
  await page.keyboard.press("ArrowDown");
  await expect(
    page.getByRole("listbox").getByRole("option").nth(1),
  ).toHaveAttribute("aria-selected", "true");
  await page.screenshot({ path: "artifacts/app-light.png", fullPage: true });
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "dark", exact: true }).click();
  await page.getByRole("button", { name: "Close settings" }).click();
  await page.screenshot({ path: "artifacts/app-dark.png", fullPage: true });
});
test("validates editor metadata, rejects duplicate imports and filters results", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Filter by Java version").selectOption("8");
  await expect(
    page.getByRole("listbox").getByRole("option").filter({ hasText: "11+" }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .click();
  await page.getByRole("button", { name: "New snippet", exact: false }).click();
  const input = page.getByRole("textbox", { name: "Snippet Markdown" });
  const draft = await input.inputValue();
  await input.fill(draft.replace("id: my-new-snippet", "id: files-read-text"));
  await page.getByRole("button", { name: "Save snippet", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Duplicate ID");
  await input.fill(draft.replace("javaVersion: 8", "javaVersion: 7"));
  await expect(
    page.getByRole("button", { name: "Save snippet", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Close editor" }).click();
  await page
    .getByRole("button", { name: "Discard changes", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("textbox", { name: "Search snippets" })
    .fill("nothing-matches-this-query");
  await expect(
    page.getByText("No matching snippets", { exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("listbox").getByRole("option")).toHaveCount(36);
  await page.setViewportSize({ width: 960, height: 640 });
  await expect(
    page.getByRole("button", { name: "Copy code", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Collapse navigation" }).click();
  await expect(
    page.getByRole("button", { name: "Expand navigation" }),
  ).toBeVisible();
});
