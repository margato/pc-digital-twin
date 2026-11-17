# Fact-check: board, RAM and SSD catalog entries

Scope: `src/catalog/parts/{board,ram,ssd}.ts`, the type files in `src/catalog/types/`, and the numeric claims in `src/data/parts.ts` (`RAM_LIMITS`, the board and SSD detail strings). `src/data/options.ts` was read for context only. No file under `src/` was edited.

Verdict key: OK = matches the official source. WRONG = official source contradicts the catalog value. UNVERIFIED = no official source could be opened for the claim. ESTIMATE-OK = a catalog estimate with no official value, judged plausible for its class.

## Sources opened

| Ref | URL | Result |
|---|---|---|
| S1 | https://www.asus.com/motherboards-components/motherboards/tuf-gaming/tuf-gaming-z690-plus-d4/techspec/ | Opened (WebFetch). Lists chipset, socket, memory, M.2, PCIe, form factor and dimensions. No power or thickness figure. |
| S2 | https://www.kingston.com/datasheets/KF440C19RB_8.pdf | Opened (Read on the saved PDF, doc no. 4810054B, 08/12/22). Part KF440C19RB/8. |
| S3 | https://www.kingston.com/datasheets/KF440C19RB2_8.pdf | Fetched, but the content was unreadable (metadata only). Not used. |
| S4 | https://www.kingston.com/datasheets/KC3000_us.pdf | Opened (Read on the saved PDF). Gives the spec table for the 512/1024/2048/4096 GB models. |
| S5 | https://www.kingston.com/en/ssd/kc3000-nvme-m2-solid-state-drive | HTTP 403. Not opened. |
| S6 | https://www.kingston.com/en/memory/gaming/kingston-fury-renegade-ddr4-memory and https://kingston.com/en/memory/search?partId=KF440C19RB%2F8 | HTTP 403. Not opened. The "discontinued, replaced by KF440C19RB2/8" note comes only from a search-result snippet. |

Kingston's product and parts-search pages returned 403, so the Kingston values come from the datasheets (S2, S4).

## 1. ASUS TUF Gaming Z690-Plus D4 (`board-asus-tuf-z690-plus-d4`)

| field | catalog value | official value | source URL | verdict |
|---|---|---|---|---|
| chipset | Z690 | Intel Z690 | S1 | OK |
| socket | LGA1700 | Intel LGA1700 | S1 | OK |
| formFactor | ATX | ATX | S1 | OK |
| memType | DDR4 | DDR4, non-ECC, unbuffered | S1 | OK |
| ramSlots | 4 | 4 DIMM slots | S1 | OK |
| maxRamGB | 128 | 128 GB | S1 | OK |
| m2Slots | 4 | 4 M.2 slots (all Key M) | S1 | OK |
| m2Gen | 4 | M.2_1 PCIe 4.0 x4 with 12th to 14th Gen CPUs; M.2_2/3/4 PCIe 4.0 x4 (chipset) | S1 | OK |
| pcieX16Gen | 5 | PCIe 5.0 x16 (CPU-attached) | S1 | OK |
| dims.w | 305 | 305 mm | S1 | OK |
| dims.h | 244 | 244 mm | S1 | OK |
| dims.d | 30 | Not on the page (thickness not listed) | S1 | UNVERIFIED |
| powerW | 30 | Not listed by ASUS | S1 | ESTIMATE-OK (ATX Z690 boards typically draw about 20 to 40 W; 30 W is reasonable) |

## 2. Kingston FURY Renegade 8 GB DDR4-4000 CL19 (`ram-kingston-fury-renegade-8gb-ddr4-4000`)

Official part: **KF440C19RB/8** (1x8 GB, 1Rx8, 288-pin DIMM). Per the S2 datasheet: XMP Profile #1 is DDR4-4000 CL19-23-23 at 1.35 V. The JEDEC default is DDR4-2400 CL17-17-17 at 1.2 V. Kingston's parts-search snippet (S6, not opened) marks KF440C19RB/8 as discontinued and names KF440C19RB2/8 as the replacement.

| field | catalog value | official value | source URL | verdict |
|---|---|---|---|---|
| memType | DDR4 | DDR4 | S2 | OK |
| moduleGB | 8 | 8 GB (1G x 64) | S2 | OK |
| speedMT | 4000 | DDR4-4000 (XMP #1) | S2 | OK |
| cl | 19 | CL19 (19-23-23 at 1.35 V) | S2 | OK |
| powerW | 2.5 | Not listed by Kingston | S2 | ESTIMATE-OK (DDR4 8 GB UDIMMs typically draw about 2 to 3 W) |

Notes (not catalog fields): the official voltage is 1.35 V under XMP. The catalog has no voltage field. The catalog name omits the part number. The part is discontinued, so the replacement KF440C19RB2/8 is the one to buy.

## 3. Generic 16 GB DDR4-3600 CL18 (`ram-generic-16gb-ddr4-3600`, estimated)

| field | catalog value | official value | source URL | verdict |
|---|---|---|---|---|
| speedMT / cl | 3600 / 18 | Generic class; DDR4-3600 CL16 to CL18 is typical | none (estimate) | ESTIMATE-OK |
| powerW | 3 | Generic | none (estimate) | ESTIMATE-OK |

## 4. Generic 16 GB DDR5-6000 CL30 (`ram-generic-16gb-ddr5-6000`, estimated)

| field | catalog value | official value | source URL | verdict |
|---|---|---|---|---|
| speedMT / cl | 6000 / 30 | Generic class; DDR5-6000 CL30 is the common mainstream kit | none (estimate) | ESTIMATE-OK |
| powerW | 5 | Generic | none (estimate) | ESTIMATE-OK |

## 5. Kingston KC3000 1 TB (`ssd-kingston-kc3000-1tb`)

Official source: S4 (KC3000 datasheet, 1024GB model, part SKC3000S/1024G). Values in the table are from S4.

| field | catalog value | official value | source URL | verdict |
|---|---|---|---|---|
| capacityGB | 1000 | 1024GB model (Kingston's "1 TB"). 1000 is a decimal approximation. | S4 | OK (decimal convention; see note) |
| iface | NVMe | PCIe 4.0 x4 NVMe | S4 | OK |
| pcieGen | 4 | PCIe 4.0 | S4 | OK |
| formFactor | M.2 2280 | M.2 2280 | S4 | OK |
| readMBs | 7000 | 1024GB: 7,000 MB/s read | S4 | OK |
| writeMBs | 6000 | 1024GB: 6,000 MB/s write | S4 | OK |
| dims.w | 80 | 80 mm | S4 | OK |
| dims.h | 22 | 22 mm | S4 | OK |
| dims.d | 3.5 | **1024GB: 2.21 mm** (3.5 mm applies only to the 2048GB and 4096GB models) | S4 | WRONG |
| powerW | 8 | **1024GB: 0.33 W avg, 2.8 W max read, 6.3 W max write**, 50 mW idle | S4 | WRONG |

Notes on the two WRONG fields:
- **dims.d:** The `M2_2280_DIMS` constant in `ssd.ts` is shared with the generic 2 TB and 4 TB Gen4 entries. Those are 2048GB-class sizes, so 3.5 mm is correct for them. The fix must apply to the KC3000 entry only.
- **powerW:** No official figure is 8 W. The highest published figure for this model is 6.3 W (max write). The field is documented as "typical draw under load," so 6.3 is the nearest official value. Average draw is 0.33 W.

## 6. Generic SSD entries (estimated)

| entry | field | catalog value | official value | source URL | verdict |
|---|---|---|---|---|---|
| Generic 2 TB Gen4 | readMBs / writeMBs | 7000 / 6000 | Generic Gen4 class, typical | none (estimate) | ESTIMATE-OK |
| Generic 2 TB Gen4 | powerW | 6 | Generic | none (estimate) | ESTIMATE-OK |
| Generic 4 TB Gen4 | readMBs / writeMBs | 7000 / 6000 | Generic Gen4 class, typical | none (estimate) | ESTIMATE-OK |
| Generic 4 TB Gen4 | powerW | 7 | Generic | none (estimate) | ESTIMATE-OK |
| Generic 2 TB Gen4 and 4 TB Gen4 | dims.d | 3.5 | Kingston uses 3.5 mm for 2048GB and 4096GB models (S4) | S4 | ESTIMATE-OK |
| Generic 2 TB Gen5 | readMBs / writeMBs | 12000 / 11000 | Generic Gen5 class; high-end Gen5 drives are about 10 to 14 GB/s read | none (estimate) | ESTIMATE-OK |
| Generic 2 TB Gen5 | powerW | 11 | Generic Gen5 class; Gen5 drives often run 8 to 15 W | none (estimate) | ESTIMATE-OK |

## 7. Generic motherboards (estimated)

| entry | field group | catalog value | official value | source URL | verdict |
|---|---|---|---|---|---|
| Generic Z890 DDR5 (`board-generic-z890-ddr5`) | platform and memory | LGA1851, Z890, DDR5-only, 4 DIMM, 192 GB max | Z890 is a DDR5-only LGA1851 platform. 4 DIMM and 192 GB are typical for this class. | none (estimate) | ESTIMATE-OK |
| Generic Z890 DDR5 | M.2 and power | 4 M.2, fastest Gen5, 35 W | Many Z890 boards have one or two Gen5 M.2 slots, with the rest Gen4. The field means "fastest supported," so the value is valid. 35 W is plausible. | none (estimate) | ESTIMATE-OK |
| Generic X870 DDR5 (`board-generic-x870-ddr5`) | platform and memory | AM5, X870, DDR5-only, 4 DIMM, 192 GB max | AM5 X870 is DDR5-only. 4 DIMM and 192 GB are typical. | none (estimate) | ESTIMATE-OK |
| Generic X870 DDR5 | M.2 and power | 4 M.2, fastest Gen5, 35 W | Same caveat as Z890: typically one or two Gen5 slots. 35 W is plausible. | none (estimate) | ESTIMATE-OK |

## 8. Detail strings and limits in `src/data/parts.ts` and `src/data/options.ts`

| claim | catalog value | official value | source URL | verdict |
|---|---|---|---|---|
| `RAM_LIMITS` maxGB / slots | 128 GB, 4 slots | 128 GB, 4 DIMM | S1 | OK |
| `RAM_LIMITS` perSlotMaxGB | 32 GB per module | Not on the ASUS page | S1 | UNVERIFIED |
| Board detail "M.2 slots under heatsinks" | claim | Not stated on the ASUS techspec page | S1 | UNVERIFIED |
| Board dims string "ATX 305 × 244 mm" | 305 × 244 | 305 × 244 mm | S1 | OK |
| SSD detail "1 TB · NVMe PCIe 4.0 · 7,000 / 6,000 MB/s · M.2 2280 · 80 × 22 mm" | as listed | Matches S4 for the 1024GB model (thickness not mentioned in the string) | S4 | OK |

`options.ts` board rows: `z690` has `gen5m2: false` and `m2Gen` 4, which is consistent with S1. Rows `z890` and `x870` are generic and ESTIMATE-OK as above.

## Totals

- **OK:** 26
- **WRONG:** 2 (KC3000 `dims.d` and `powerW`)
- **UNVERIFIED:** 3 (Z690 `dims.d`; `RAM_LIMITS.perSlotMaxGB`; Z690 "M.2 slots under heatsinks")
- **ESTIMATE-OK:** 17

## Corrections to apply

1. `src/catalog/parts/ssd.ts`, entry `ssd-kingston-kc3000-1tb`: change `dims: M2_2280_DIMS` to `dims: { w: 80, h: 22, d: 2.21 }`. Do NOT change the shared `M2_2280_DIMS` constant, because the generic 2 TB and 4 TB Gen4 entries need 3.5.
2. `src/catalog/parts/ssd.ts`, entry `ssd-kingston-kc3000-1tb`: change `powerW: 8` to `powerW: 6.3` (official max write; average is 0.33). If the field must mean typical draw, 0.33 is the official average.
3. Optional, no change needed: `capacityGB: 1000` could become `1024` to match Kingston's 1024GB model. Also `src/data/parts.ts` uses `gb: 1000`.
4. Optional, needs a type change: add a `partNumber` field to `RamSpec` and set `KF440C19RB/8` for the Renegade entry. Note in the name that KF440C19RB/8 is discontinued and KF440C19RB2/8 replaces it. Verify the replacement on the Kingston page first, since S6 was not opened.
5. Leave as is, or check the ASUS manual: Z690 `dims.d: 30`, the `perSlotMaxGB: 32` claim in `src/data/parts.ts`, and the "M.2 slots under heatsinks" text.
