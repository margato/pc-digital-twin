# Fact-check: PSU, cooler and case catalog entries

Checked 2026-11-16 against official manufacturer pages opened with WebFetch. Catalog files were read only; no file under `src/` was edited.

## Source access

| Source | Opened? | Notes |
|---|---|---|
| https://www.xpg.com/en/xpg/pc-components-core-reactor-ii-ve?tab=spec | No (HTTP 403) | Same for `/us/`, `/bg/`, `/uk/` locales. XPG rows stay UNVERIFIED. |
| https://www.coolermaster.com/en-global/products/masterliquid-pl360-flux-white-edition/ | Yes | Spec table read. |
| https://www.coolermaster.com/en-us/products/masterliquid-pl360-flux-white-edition/?tab=overview | Yes | Same spec table. |
| https://nzxt.com/product/h7-flow-2022 | Yes, but page is pt-BR | Spec table read in Portuguese and translated. |
| https://www.nzxt.com/product/h7-flow-rgb-2023 | Yes, but page is pt-BR | Spec table read in Portuguese and translated. |
| https://nzxt.com/en-NZ/product/h7-flow-rgb-2023 | No (HTTP 404) | |
| https://support.nzxt.com/hc/en-us/articles/37837320894875-H7-2022-2023-Series-Specs and ...47607864027547 and ...40379376386203 | No (HTTP 403) | NZXT support spec tables were not readable. |

Caveat: WebFetch summarises pages with a small model. The NZXT figures below come from Portuguese pages and should be re-read on the en-US page before they are applied.

## PSU: XPG Core Reactor II VE 850 W

Official XPG pages could not be opened. Every row is UNVERIFIED. Search snippets (not opened, so not counted as official) describe the unit as 120 mm fan, 80 Plus Gold, ATX 3.1, one 12V-2x6, ADATA-made XPG brand.

| field | catalog value | official value | source URL | verdict |
|---|---|---|---|---|
| manufacturer | ADATA | Not read. Third-party listing: "ADATA XPG Core Reactor II VE" | https://www.xpg.com/en/xpg/pc-components-core-reactor-ii-ve?tab=spec (403) | UNVERIFIED |
| brand | XPG | Not read. Product is branded XPG | same as above (403) | UNVERIFIED |
| name | Core Reactor II VE 850 W | Not read. Listing title "CORE REACTOR II VE" | same as above (403) | UNVERIFIED |
| wattage | 850 | Not read. Listings say 850 W | same as above (403) | UNVERIFIED |
| efficiency | 80+ Gold | Not read. Snippet says 80 Plus Gold | same as above (403) | UNVERIFIED |
| atx | ATX 3.1 | Not read. Snippet says Intel ATX 12V v3.1 | same as above (403) | UNVERIFIED |
| native12v2x6 | true | Not read. Snippet says one 12V-2x6 on 850 W | same as above (403) | UNVERIFIED |
| fanMm | 135 | Not read. Snippet says 120 mm fluid dynamic bearing fan, 2400 RPM. Likely wrong, but unconfirmed | same as above (403) | UNVERIFIED |
| dims (w/h/d) | 150 x 86 x 140 | Not read. Snippet says 140 x 150 x 86 mm, axis order unclear | same as above (403) | UNVERIFIED |

## Cooler: Cooler Master MasterLiquid PL360 Flux

Official source opened. The official product number is MLY-D36M-A23PZ-R1. The page URL is the White Edition, but its spec table says "Exterior Color: Black", so the colour is unclear.

| field | catalog value | official value | source URL | verdict |
|---|---|---|---|---|
| manufacturer | Cooler Master | Cooler Master | https://www.coolermaster.com/en-global/products/masterliquid-pl360-flux-white-edition/ | OK |
| brand | MasterLiquid | Series "MasterLiquid Pro" | same | OK |
| type | aio | "Cooler Type: Liquid Cooler" | same | OK |
| radiatorMm | 360 | Radiator Size "360" | same | OK |
| fanCount | 3 | Fan Quantity "3 PCS" | same | OK |
| fanMm | 120 | Fan dimensions "120 x 120 x 25 mm" | same | OK |
| powerW | 24 | Pump "6W". Fans 12 VDC, 0.15 A rated, 0.3 A safety. Fan wattage not stated. Rated sum = 6 + 3 x 1.8 = 11.4 W. Safety-current ceiling = 6 + 3 x 3.6 = 16.8 W. 24 W exceeds both. | same | WRONG |
| sockets | LGA1700, AM5 | Intel: 1851/1700/1200/2066/2011-v3/2011/1151/1150/1155/1156. AMD: AM5/AM4/AM3+/AM3/AM2+/AM2/FM2+/FM2/FM1/TR4 | same | OK (subset; LGA1851 and AM4 also supported if the list is widened) |
| dims (w/h/d) | 394 x 119.6 x 27.2 | Radiator Dimensions "394 x 119.6 x 27.2 mm" | same | OK |

## Case: NZXT H7 (H7 Flow family)

NZXT's H7 Flow (2022) and H7 Flow RGB (2023) pages were opened, both in Portuguese. Both state 7 expansion slots, top radiator support up to 360 mm, and a single GPU length figure of "up to 410 mm". Neither gives a with-front-fans or without-front-fans split. The 365 mm / 349 mm figures and the 400 mm no-front-fans figure come only from search summaries, which I did not open, so they are not counted as official. The NZXT support pages (which may hold the H7 tables) returned 403.

| field | catalog value | official value | source URL | verdict |
|---|---|---|---|---|
| manufacturer | NZXT | NZXT | https://nzxt.com/product/h7-flow-2022 | OK |
| brand | H Series | Not seen on opened pages. Pages say "H7 Flow" / "H7 Flow RGB" | same | UNVERIFIED |
| name | H7 | Model "H7 Flow" (2022, CM-H72FW-01 / CM-H72FB-01) and "H7 Flow RGB" (2023, CM-H72FW-R1 / CM-H72FB-R1). The user's SKU is not known | https://nzxt.com/product/h7-flow-2022 and https://www.nzxt.com/product/h7-flow-rgb-2023 | UNVERIFIED |
| formFactors | ATX, mATX, ITX | Not listed on the opened pages | same | UNVERIFIED |
| gpuMaxLenMm | 375 | "Até 410 mm (16,1 pol)" on both 2022 and 2023 pages. No with-fans figure of 375 found | https://nzxt.com/product/h7-flow-2022 and https://www.nzxt.com/product/h7-flow-rgb-2023 | WRONG |
| gpuMaxLenNoFrontFansMm | 400 | No split on the official pages. The single official figure is 410 mm. The 400 mm figure is not found on any opened official page | same | UNVERIFIED |
| expansionSlots | 7 | "Slots de expansão: 7" | same (both pages) | OK |
| frontFans (maker default) | 3 | 2022 page: "Quantidade: 3", model F120Q (Case Version), "3 x 120 mm / 3 x 140 mm (3 incluídos)". 2023 RGB page: 1 included, model F360 RGB Core, at the front. Included count depends on model year | https://nzxt.com/product/h7-flow-2022 and https://www.nzxt.com/product/h7-flow-rgb-2023 | OK (for the 2022 H7 Flow; the 2023 RGB ships 1) |
| rearFans (maker default) | 1 | No rear fan is included on either opened page. The rear supports "Até 140 mm". The 1 rear fan is the user's own setup | same | WRONG |
| topRadiatorMm | 360 | "Até 360 mm" top radiator support | same (both pages) | OK |
| dims (w/h/d) | 230 x 505 x 480 | 2022 page: "544 x 244 x 468 mm" as A x L x P (height x width x depth), volume 62.1 L, weight 10.97 kg. 2023 page: "544 x 244 x 475,5 mm". Both pages give W = 244 and H = 544 | same (both pages) | WRONG |

Mixed-up data: `frontFans` and `rearFans` are documented in `src/catalog/types/case.ts` as "fans installed by the maker". The sheet's `rearFans: 1` matches the user's build (3 front intake + 1 rear exhaust), not the maker's default. The `frontFans: 3` value matches the maker default of the 2022 H7 Flow, but the 2023 RGB ships with only 1. The user's setup is recorded in `src/data/parts.ts` line 40 and should stay there.

## Scenario constant and text that depend on the case

| item | location | value | official value | verdict |
|---|---|---|---|---|
| GPU_CLEAR | src/data/scenarios.ts:62 | 375 | Official single figure is 410 mm. Comment says "clears the three front fans", which no official source supports | WRONG |
| compat text | src/sim/compat.ts:25 | "H7 allows 400 mm without front fans" | Not found on opened official pages (official figure is 410 mm, no split) | UNVERIFIED |
| source provenance | src/data/parts.ts | No source URLs recorded for these numbers | n/a | UNVERIFIED |

## Generic entries (sanity check only)

| entry | catalog value | check | verdict |
|---|---|---|---|
| psu-generic-1000-gold | 1000 W, Gold, ATX 3.1, 135 mm fan | Plausible for the class | ESTIMATE-OK |
| psu-generic-1200-platinum | 1200 W, Platinum, ATX 3.1, 135 mm fan | Plausible for the class | ESTIMATE-OK |
| cooler-generic-aio-240 | 240 mm, 2 x 120 mm, 18 W, 274 x 120 x 27 mm | Plausible | ESTIMATE-OK |
| cooler-generic-aio-360 | 360 mm, 3 x 120 mm, 24 W, 394 x 120 x 27 mm | Plausible size. 24 W is high but labelled an estimate | ESTIMATE-OK |
| case-generic-atx-mid-tower | 350 mm GPU, 400 mm no front fans, 2 front, 1 rear, 230 x 490 x 470 | Plausible | ESTIMATE-OK |

## Counts (real products, not generic)

- OK: 12
- WRONG: 4 (cooler powerW; case gpuMaxLenMm, rearFans, dims) plus `GPU_CLEAR`
- UNVERIFIED: 13 (9 XPG PSU rows; case brand, name, formFactors, gpuMaxLenNoFrontFansMm)
- ESTIMATE-OK: 5 generic entries

## Corrections to apply

These are proposed. Do not apply them until the XPG rows are checked on an official page and the NZXT rows are re-read on the en-US page.

1. `src/catalog/parts/cooler.ts`, `cooler-masterliquid-pl360-flux`: `powerW: 24` becomes `powerW: 17`. Official pump 6 W plus three 12 V fans at the 0.3 A safety current gives 16.8 W. Rated-current sum is 11.4 W if a typical value is preferred.
2. `src/catalog/parts/case.ts`, `case-nzxt-h7`: `dims: { w: 230, h: 505, d: 480 }` becomes `dims: { w: 244, h: 544, d: 468 }`, per the NZXT 2022 page. Confirm on the en-US page first.
3. `src/catalog/parts/case.ts`, `case-nzxt-h7`: `gpuMaxLenMm: 375` becomes `gpuMaxLenMm: 410`, per the official single figure. The user should decide whether to keep 375 as a conservative user-measured clearance, marked as an estimate.
4. `src/catalog/parts/case.ts`, `case-nzxt-h7`: `rearFans: 1` becomes `rearFans: 0` (the maker default). Record the user's rear fan separately (for example in `parts.ts` only).
5. `src/data/scenarios.ts:62`: `GPU_CLEAR = 375` follows change 3 (becomes 410) or is kept and relabelled as a user-measured estimate. Its comment "clears the three front fans" must also be fixed to match.
6. `src/sim/compat.ts:25`: remove or correct "H7 allows 400 mm without front fans" (no official source).
7. `src/catalog/parts/case.ts`, `case-nzxt-h7`: optional. `name: 'H7'` becomes `name: 'H7 Flow'` (or `'H7 Flow RGB'`, depending on the user's SKU). Confirm the `brand: 'H Series'` label on the en-US page.
8. `src/catalog/parts/case.ts`, `case-nzxt-h7`: `gpuMaxLenNoFrontFansMm: 400` stays UNVERIFIED. Do not change it without an official source.
9. XPG PSU rows: no change yet. `fanMm: 135` is likely wrong (search snippet says 120 mm), and `dims` axis order needs confirming. Re-run this check once xpg.com can be opened, or open it in a browser.
