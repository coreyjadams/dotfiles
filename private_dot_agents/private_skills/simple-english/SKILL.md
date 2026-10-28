---
name: simple-english
description: >-
  Revise, write, or audit the prose in documents, code, talks, and other
  deliverables. Declaw by default: remove AI-sounding, unclear language while
  keeping the author's meaning and voice. Plain English on request: rewrite for
  readers outside the field with ASD-STE100 Simplified Technical English rules.
  Use to declaw, de-AI, de-slop, or humanize text, to put it in plain or
  layman's English, or to check STE compliance.
---

# Simple English

This skill does two jobs on a text. Pick one from the request:

- **Declaw**, the default, removes AI-sounding and unclear language. It keeps the author's meaning, voice, formality, and terms of art. Requests to declaw, de-AI, de-slop, humanize, or tighten prose mean this job.
- **Plain English** rewrites for a smart reader outside the field. Its rules come from ASD-STE100, the controlled language aerospace uses so a tired mechanic cannot misread an instruction. Requests for plain English, layman's terms, simpler wording, no jargon, non-native readers, or text that translates well mean this job. It runs in **Strict** mode when the user names STE, ASD-STE100, or compliance.

If the request does not say, declaw: it changes less. Apply the plain-English rules to a paper, a talk, or other text whose voice the author wants kept only when asked. Neither job is for marketing or brand copy. The plain-English rules delete persuasion by design; say so, and offer them for the docs instead.

## Start every job the same way

1. Confirm the requested outcome and the source of truth. An audit request is not edit permission. Preserve quotations, citations, generated files, and externally fixed text unless the user requests changes.
2. Obtain a plain-text representation that preserves the material. Scan text and source-code files directly. For PDFs, office files, slides, notebooks, images, or rendered pages, use a format-aware extractor or OCR first and note any content it could not cover.
3. Always run the bundled scanner before you assess the language: on the source when you revise or audit, and on your draft when you write new text. Resolve this skill's directory from `SKILL.md`, then use one of these forms:

   ```bash
   python3 /path/to/writing/scripts/search_claudisms.py path/to/file [path/to/another-file ...]
   extractor-command | python3 /path/to/writing/scripts/search_claudisms.py -
   python3 /path/to/writing/scripts/search_claudisms.py --json path/to/file
   ```

   Do not replace this step with a search assembled from memory or with language-model-only detection. The script loads `references/claudisms.md` itself, reports original ranks, counts repeated uses, and exits successfully when it finds candidates because a match is not a violation.

## Declaw

1. Review matches in ascending rank order. A smaller rank number receives earlier attention, and repetition is stronger evidence than a single use. Rank and repetition guide attention, but context decides:

   - Keep precise terms of art and wording that is natural for the subject. “This structural wall is load-bearing” is correct; any substitute is less accurate.
   - Scrutinize metaphorical uses, repeated verbal tics, vague emphasis, and compressed phrasing that makes the reader decode the author's intent.
   - Preserve quoted language and required identifiers. In code, inspect comments, docstrings, messages, and names, but do not rename a public API or external contract just to remove a match.
   - Prefer deleting clutter or rewriting the sentence over swapping in a synonym solely to clear the report.

2. After the scripted candidate search, make an ordinary clarity pass for problems a phrase list cannot detect: unsupported certainty, needless throat-clearing, repeated conclusions, vague references, and hard-to-follow sentence structure. Preserve the author's level of formality and technical precision; do not flatten a distinctive voice.
3. If edits are authorized, edit the source artifact, then run the same scanner again. Review every remaining high-ranked or repeated match and keep it when it is still the clearest wording. A zero-match report is not the objective. For code changes, also run the smallest relevant tests or checks.

## Plain English

Write plain English that a smart reader outside your field understands on one read. Apply these rules to the prose you write or rewrite:

1. **Classify each passage.** Procedural text tells the reader what to do: imperative mood, 20 words per sentence, one instruction per sentence. Descriptive text explains: simple tenses, 25 words per sentence, one topic per paragraph, six sentences per paragraph at most.
2. **Never touch** code, identifiers, commands, flags, file paths, quoted errors, product names, or facts. When the source gives no number or cause, keep the general statement.
3. **Condition before command, with a comma.** "If the build fails, read the log."
4. **Simple tenses, active voice.** No present perfect ("has completed" → "completed"). No "-ing" verb after a comma (", making it easy" → new sentence). Name the actor: "You run the migration."
5. **Modals: can, will, must.** Never should, would, may, might, could. A required "should" becomes "must". An optional one is deleted.
6. **Complete grammar.** No contractions, keep articles, keep "that". Short sentences, not telegraph style.
7. **No semicolons and no em-dashes.** Write two sentences, or name the relation.
8. **One word, one meaning, for the whole document.** Use `make sure that` for check, verify, confirm, validate, ensure. Use `configuration` for config, settings, options. Break noun chains over three words with a preposition ("the timeout value for the connection pool").
9. **State what the reader needs before you name the action.** Define a concept term at its first use, under ten words, one per sentence. Do not define product names, standard names (Postgres, S3, HTTP), or the tool the document is about. The same rule covers a fact, not just a word: name the host, the flag, or the prior step that a command depends on, instead of assuming the reader already has it. "Restart the service" becomes "Restart the `sync` service on the host that runs the job."
10. **State the fact, not its importance.** Delete words that carry no fact: simply, seamlessly, robust, powerful, comprehensive, leverage, crucial, "in order to", "it is worth noting". No "not just X, it is Y". No decorative triplets. No "in conclusion".
11. **Format for the eye, not for decoration.** No bold lead-ins, no bold as emphasis, no emoji, no heading over two sentences. A vertical list is for three or more parallel items or steps: colon on the lead-in, uppercase start, one instruction per item.
12. **Warnings: command or condition first, then the risk.** "Do not run this against production. The command deletes rows."

Use American spelling. `references/word-swaps.md` maps the overused words to plain ones. For an error message, a runbook, an incident report, release notes, a commit message, or UI copy, read `references/use-cases.md` first: it names the mode and the pattern for each.

**Before (real AI output):**

> **Connection timeouts.** If sqlpipe hangs or fails with `dial tcp: i/o timeout`, check that the host running sqlpipe can reach the Postgres port (usually 5432) — this is often a security group or firewall rule blocking the connection. If you're connecting to a managed database (RDS, Cloud SQL, etc.), confirm the instance allows connections from sqlpipe's IP.

**After (procedural, headed, numbered):**

> ## Connection timeouts
>
> sqlpipe stops with `dial tcp: i/o timeout` when it cannot connect to the Postgres port (5432 by default).
>
> 1. Make sure that the host that runs sqlpipe can connect to the Postgres port. A firewall or security group usually blocks it.
> 2. If the database is managed (RDS, Cloud SQL), make sure that the instance accepts connections from the IP of sqlpipe.

**Strict mode:** read `references/strict-vocabulary.md` before you draft the document, and say once that no tool guarantees compliance.

**Check mode:** when asked to check text instead of writing it, first open `references/rule-catalog.md`. Then report each violation as: rule number quoted from that file, the offending text, a compliant rewrite. Never cite a rule number from memory. When the user asked for compliance, end with one sentence: no tool can guarantee ASD-STE100 compliance, and the standard is a free download at asd-ste100.org.

**Self-check before you deliver:** count the words in your three longest sentences. Over 20 or 25, split. Search for `'`, `has been`, `should`, `may`, `;`, `—`, `, making`, `**`, `check`, `verify`, `config`, and any heading that covers fewer than three sentences. Fix each hit. Read each step: does it name a host, a flag, or a prior step the reader must already have? If not, add it or point to it. Then run the scanner on the result and review its matches as in Declaw step 1.

## Deliver

Return the revised artifact or, for audit-only requests, specific proposed changes. Briefly mention purposeful high-ranked matches that remain and any areas the text extraction did not cover. Do not dump the full scanner report unless requested.

In the reply that delivers the work, give the result in the first sentence instead of restating the question. Skip openers ("Certainly", "Great question") and closers ("I hope this helps"). Define a concept term the first time you use it. Do not shorten quoted error text, security warnings, or confirmations before a destructive action. These rules cover only that reply. They do not change later replies or the format of a report that another skill defines.

## References

- `references/claudisms.md` — the ranked discourage list the scanner reads, vendored verbatim; do not edit it by hand.
- `references/word-swaps.md` — slop-to-plain word map.
- `references/use-cases.md` — mode and pattern for error messages, runbooks, incident reports, release notes, commits, agent prompts, UI copy, translation prep.
- `references/strict-vocabulary.md` — the dictionary discipline for Strict mode.
- `references/rule-catalog.md` — the 53 rules of ASD-STE100 Issue 9 with software examples, for Check mode.

The plain-English rules and the last four references come from SimpleEnglish under the MIT License; see [NOTICE.md](NOTICE.md).
