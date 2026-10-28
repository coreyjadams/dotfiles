#!/usr/bin/env python3
"""Find ranked discourage-list terms in UTF-8 text without judging their use."""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Sequence, Tuple


TERMS_PATH = Path(__file__).resolve().parents[1] / "references" / "claudisms.md"
NOTICE = (
    "A match is a review lead, not a violation; context, clarity, and repetition "
    "determine whether to revise it."
)


class ScanError(Exception):
    """An input problem the caller can correct."""


@dataclass(frozen=True)
class RankedTerm:
    text: str
    rank: int


@dataclass(frozen=True)
class SourceText:
    name: str
    text: str


@dataclass(frozen=True)
class Occurrence:
    source: str
    line: int
    column: int
    excerpt: str


@dataclass
class Finding:
    term: RankedTerm
    occurrences: List[Occurrence]


def load_ranked_terms(path: Path = TERMS_PATH) -> Tuple[List[RankedTerm], int]:
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except UnicodeDecodeError as error:
        raise ScanError(
            f"Could not decode the discourage list at '{path}' as UTF-8 text "
            f"(invalid byte at offset {error.start}). Restore the checked-in "
            "references/claudisms.md file, then try again."
        ) from error
    except OSError as error:
        raise ScanError(
            f"Could not read the discourage list at '{path}': {error}. "
            "Restore references/claudisms.md beside the scanner, then try again."
        ) from error

    entries = [line.strip() for line in lines if line.strip()]
    if not entries:
        raise ScanError(
            f"The discourage list at '{path}' has no terms. "
            "Restore its ranked contents before running the audit."
        )

    terms: List[RankedTerm] = []
    seen = set()
    for rank, text in enumerate(entries, 1):
        key = text.casefold()
        if key in seen or not _is_scannable_term(text):
            continue
        seen.add(key)
        terms.append(RankedTerm(text=text, rank=rank))
    return terms, len(entries)


def _is_scannable_term(text: str) -> bool:
    """Whether a vendored list entry can be a meaningful review lead.

    The list is kept verbatim (its ranks are the point), but it carries
    tokenizer debris: bare digits ("2", "0"), single letters ("c", "t"),
    two-letter fragments ("un", "re", "ly") and hyphen stubs ("phase-",
    "-preserving"). Those match ordinary technical prose constantly and, being
    ranked, would head every report; skip them at load time so the scanner
    reports words rather than noise. Real short words ("its", "own") still
    pass because they carry three letters.
    """
    if len(text) < 3:
        return False
    if not any(character.isalpha() for character in text):
        return False
    return not (text.startswith("-") or text.endswith("-"))


def _has_word_character(character: str) -> bool:
    return re.match(r"\w", character, flags=re.UNICODE) is not None


def compile_term_pattern(terms: Sequence[RankedTerm]) -> re.Pattern[str]:
    alternatives = []
    for term in sorted(terms, key=lambda item: (-len(item.text), item.rank)):
        pattern = re.escape(term.text)
        if _has_word_character(term.text[0]):
            pattern = rf"(?<!\w){pattern}"
        if _has_word_character(term.text[-1]):
            pattern = rf"{pattern}(?!\w)"
        alternatives.append(f"(?:{pattern})")
    return re.compile("|".join(alternatives), flags=re.IGNORECASE)


def _excerpt(line: str, start: int, end: int, width: int = 180) -> str:
    padding = max(0, (width - (end - start)) // 2)
    left = max(0, start - padding)
    right = min(len(line), end + padding)
    excerpt = line[left:right].strip()
    if left:
        excerpt = f"…{excerpt}"
    if right < len(line):
        excerpt = f"{excerpt}…"
    return excerpt


def scan_sources(
    sources: Sequence[SourceText], terms: Sequence[RankedTerm]
) -> List[Finding]:
    pattern = compile_term_pattern(terms)
    terms_by_key = {term.text.casefold(): term for term in terms}
    occurrences: Dict[str, List[Occurrence]] = {}

    for source in sources:
        for line_number, line in enumerate(source.text.splitlines(), 1):
            for match in pattern.finditer(line):
                key = match.group(0).casefold()
                term = terms_by_key.get(key)
                if term is None:
                    continue
                occurrences.setdefault(key, []).append(
                    Occurrence(
                        source=source.name,
                        line=line_number,
                        column=match.start() + 1,
                        excerpt=_excerpt(line, match.start(), match.end()),
                    )
                )

    findings = [
        Finding(term=terms_by_key[key], occurrences=matches)
        for key, matches in occurrences.items()
    ]
    return sorted(findings, key=lambda finding: finding.term.rank)


def _read_source(path_text: str) -> SourceText:
    if path_text == "-":
        try:
            raw_text = sys.stdin.buffer.read()
        except OSError as error:
            raise ScanError(
                f"Could not read standard input for the language audit: {error}. "
                "Check the producing command, then try the pipeline again."
            ) from error
        try:
            text = raw_text.decode("utf-8")
        except UnicodeDecodeError as error:
            raise ScanError(
                "Could not scan standard input as UTF-8 text. Extract text from "
                "the source format, then pipe that text to the scanner."
            ) from error
        if "\0" in text:
            raise ScanError(
                "Standard input appears to contain binary data. Extract its text "
                "with a format-aware tool, then pipe that text to the scanner."
            )
        return SourceText(name="<stdin>", text=text)

    path = Path(path_text)
    if not path.exists():
        raise ScanError(
            f"Could not scan '{path}': the file does not exist. "
            "Check the path, or pass '-' to scan text from standard input."
        )
    if not path.is_file():
        raise ScanError(
            f"Could not scan '{path}': it is not a regular file. "
            "Pass the specific UTF-8 text files in the deliverable."
        )
    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError as error:
        raise ScanError(
            f"Could not scan '{path}' as UTF-8 text (invalid byte at offset "
            f"{error.start}). Extract text from the source format, then scan "
            "the extracted text."
        ) from error
    except OSError as error:
        raise ScanError(
            f"Could not read '{path}' while preparing the language audit: {error}. "
            "Check the file's permissions and try again."
        ) from error
    if "\0" in text:
        raise ScanError(
            f"Could not scan '{path}' because it appears to contain binary data. "
            "Extract its text with a format-aware tool, then scan that text."
        )
    return SourceText(name=path_text, text=text)


def read_sources(path_texts: Sequence[str]) -> List[SourceText]:
    if path_texts.count("-") > 1:
        raise ScanError(
            "Standard input '-' was requested more than once. Pass it once so the "
            "scanner can identify every source unambiguously."
        )
    return [_read_source(path_text) for path_text in path_texts]


def _finding_record(finding: Finding, total_terms: int) -> dict:
    return {
        "term": finding.term.text,
        "rank": finding.term.rank,
        "list_size": total_terms,
        "top_percent": round(100 * finding.term.rank / total_terms, 1),
        "count": len(finding.occurrences),
        "occurrences": [
            {
                "source": occurrence.source,
                "line": occurrence.line,
                "column": occurrence.column,
                "excerpt": occurrence.excerpt,
            }
            for occurrence in finding.occurrences
        ],
    }


def render_json(
    sources: Sequence[SourceText], findings: Sequence[Finding], total_terms: int
) -> str:
    payload = {
        "notice": NOTICE,
        "source_count": len(sources),
        "list_size": total_terms,
        "finding_count": len(findings),
        "occurrence_count": sum(len(finding.occurrences) for finding in findings),
        "findings": [_finding_record(finding, total_terms) for finding in findings],
    }
    return json.dumps(payload, ensure_ascii=False, indent=2)


def render_text(
    sources: Sequence[SourceText], findings: Sequence[Finding], total_terms: int
) -> str:
    occurrence_count = sum(len(finding.occurrences) for finding in findings)
    source_word = "source" if len(sources) == 1 else "sources"
    term_word = "term" if len(findings) == 1 else "terms"
    occurrence_word = "occurrence" if occurrence_count == 1 else "occurrences"
    lines = [
        f"Scanned {len(sources)} {source_word}; found {len(findings)} discourage-list "
        f"{term_word} ({occurrence_count} {occurrence_word}).",
        NOTICE,
        "Smaller rank numbers appear earlier in the supplied list and deserve "
        "earlier review.",
    ]
    for finding in findings:
        count = len(finding.occurrences)
        occurrence_word = "occurrence" if count == 1 else "occurrences"
        top_percent = 100 * finding.term.rank / total_terms
        lines.append(
            f"\nrank {finding.term.rank}/{total_terms} (top {top_percent:.1f}%) | "
            f"{count} {occurrence_word} | {finding.term.text}"
        )
        lines.extend(
            f"  {item.source}:{item.line}:{item.column}: {item.excerpt}"
            for item in finding.occurrences
        )
    return "\n".join(lines)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Find terms from the writing skill's ranked discourage list in UTF-8 text. "
            "Matches are candidates for contextual review, not failures."
        )
    )
    parser.add_argument(
        "paths",
        nargs="+",
        metavar="PATH",
        help="UTF-8 text file to scan; use '-' once to read standard input",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="emit structured JSON instead of the human-readable report",
    )
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    parser = build_parser()
    arguments = parser.parse_args(argv)
    try:
        terms, total_terms = load_ranked_terms()
        sources = read_sources(arguments.paths)
        findings = scan_sources(sources, terms)
    except ScanError as error:
        print(f"search_claudisms.py: error: {error}", file=sys.stderr)
        return 2

    if arguments.json:
        print(render_json(sources, findings, total_terms))
    else:
        print(render_text(sources, findings, total_terms))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
