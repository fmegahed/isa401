# -*- coding: utf-8 -*-
"""Which functions does the review name that were not written in class?

    python tests/check_coverage.py

"Written in class" means the markdowns in github.com/fmegahed/isa401a/markdowns (downloaded each
run; the repository is public) plus, for Class 13, the deck's crash_demo chunk and the code on its
slides. Every function named in content/units.mjs (outside the hidden check expressions) and in the
style check's package table is looked up there. For anything not found, the report says whether it
appears on a slide in a Fall 2026 deck, so it can be removed or kept on purpose.
Exits 1 if a function is neither in the class code nor on the KEPT list below.
"""
import io, json, re, sys, pathlib, urllib.request

here = pathlib.Path(__file__).resolve().parent
root = here.parent.parent.parent
content = io.open(here.parent / "content" / "units.mjs", encoding="utf-8").read()
page = io.open(here.parent / "index.html", encoding="utf-8").read()

# Named in the review although not typed in a class markdown, each for a stated reason.
KEPT = {
    "ellmer::type_integer": "Class 12 slides (types table); Part 3 of that deck is finished in Class 13",
    "ellmer::type_number": "Class 12 slides (types table)",
    "ellmer::type_boolean": "Class 12 slides (types table)",
    "tidyr::pivot_longer": "Class 13 slides (shown, not typed)",
    "tidyr::pivot_wider": "Class 13 slides (shown, not typed)",
    "usethis::edit_r_environ": "Classes 06 to 08 slides: how the key gets into .Renviron",
    "dplyr::left_join": "Class 07 slides and Assignment 06; Fadel asked for left joins back on Oct 6",
    "dplyr::inner_join": "Class 07 slides, taught as what a left join is compared with",
    "dplyr::anti_join": "Class 07 slides: run it once after any join that matters",
}

# ---- the class code -----------------------------------------------------------------------------
api = "https://api.github.com/repos/fmegahed/isa401a/contents/markdowns"
listing = json.load(urllib.request.urlopen(urllib.request.Request(api, headers={"User-Agent": "isa401-review-check"}), timeout=30))
class_code = {}
for f in listing:
    if f["name"].lower().endswith(".rmd"):
        class_code[f["name"]] = urllib.request.urlopen(f["download_url"], timeout=30).read().decode("utf-8")

deck13 = io.open(root / "lectures" / "13_tidy_data" / "13_tidy_data.Rmd", encoding="utf-8").read()
demo = re.search(r"```\{r crash_demo[^}]*\}(.*?)```", deck13, re.S).group(1)
types = re.search(r'code\$types = r"---\((.*?)\)---"', deck13, re.S).group(1)
class_code["class13 (demo chunk and slide code)"] = demo + "\n" + types + "\ndplyr::glimpse(crash_clean)"
in_class = "\n".join(class_code.values())

# ---- slides, for functions that were shown but not typed ------------------------------------------
def visible(rmd):
    text = io.open(rmd, encoding="utf-8").read()
    text = re.sub(r"```\{r[^}]*include\s*=\s*FALSE[^}]*\}.*?```", "", text, flags=re.S)
    return "\n".join(p.split("\n???", 1)[0] for p in re.split(r"\n---\n", text))

decks = {d.parent.name[:2]: visible(d) for d in sorted((root / "lectures").glob("[01][0-9]_*/[01][0-9]_*.Rmd"))}

# ---- functions the review names --------------------------------------------------------------------
shown = "\n".join(l for l in content.split("\n") if not l.lstrip().startswith("check:"))
named = set(m.group(1) for m in re.finditer(r"\b((?:[A-Za-z][A-Za-z0-9.]*::)?[A-Za-z_.][A-Za-z0-9_.]*)\(", shown))
named = {n for n in named if "::" in n or re.search(r"(?:<code>|`)" + re.escape(n) + r"\(", shown)}
pkg_block = page[page.index("const PKG = {"):page.index("};", page.index("const PKG = {"))]
named |= {f"{pkg}::{fn}" for fn, pkg in re.findall(r"(\w+): \"(\w+)\"", pkg_block)}
not_r = {"idea", "wrong", "t", "code", "escHtml", "replace", "trim", "deck", "classCode", "readFileSync", "parse", "URL"}
base = {"c", "sum", "mean", "median", "typeof", "names", "nrow", "ncol", "length", "unique", "head", "paste0", "as.Date",
        "as.numeric", "as.integer", "is.na", "round", "max", "min", "list", "setwd", "library", "require", "nchar", "print",
        "data.frame", "table", "sort", "rbind", "vector", "seq", "seq_along", "colnames", "cat", "rep", "Sys.getenv", "Sys.sleep"}
named = {n for n in named if n.split("::")[-1] not in not_r and n.split("::")[-1] not in base}

unexplained, kept = [], []
for n in sorted(named):
    fn = n.split("::")[-1]
    pat = re.compile(r"(?<![A-Za-z0-9_.])" + re.escape(fn) + r"\s*\(")
    if pat.search(in_class):
        continue
    slides = [k for k, txt in decks.items() if pat.search(txt)]
    kept_reason = next((r for k, r in KEPT.items() if k.split("::")[-1] == fn), None)   # with or without its package
    (kept if kept_reason else unexplained).append((n, slides, kept_reason))

print(f"{len(named)} functions named in the review. Class code read: {', '.join(class_code)}")
if kept:
    print("\nNot typed in class, kept on purpose:")
    for n, slides, reason in kept:
        print(f"  {n:28s} {reason}")
if unexplained:
    print("\nNot typed in class and not on the kept list (remove from the review, or add a reason to KEPT):")
    for n, slides, _ in unexplained:
        print(f"  {n:28s} on slides in deck(s): {', '.join(slides) if slides else 'none'}")
else:
    print("\nEvery other function the review names was written in class.")
sys.exit(1 if unexplained else 0)
