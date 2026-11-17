# Fact-check: CPU and GPU catalog

Scope: `src/catalog/parts/cpu.ts`, `src/catalog/parts/gpu.ts` (types in `src/catalog/types/cpu.ts`, `gpu.ts`). Cross-checked against `src/data/options.ts` and `src/data/parts.ts`.
Research date: 2026-11-16. No files in `src/` were edited.

Verdict key: OK = matches an official page that was opened. WRONG = official page disagrees. UNVERIFIED = no official page could be opened for this value (see note). ESTIMATE-OK = the official source gives no exact value, and the catalog value is within the official range or a plausible reference value.

Source notes:
- Intel values: Intel product-specification pages on intel.com (`products/sku/...`), opened with WebFetch. The "up to X GHz" in the Intel product title is the marketing maximum (Turbo Boost Max 3.0). The spec-table "Performance-core Max Turbo Frequency" is listed separately; both are shown below.
- NVIDIA values: nvidia.com product pages (RTX 5090, RTX 5080, RTX 5070 family), opened with WebFetch. These are Founders Edition (FE) values.
- ASUS values: asus.com tech-spec page for PRIME-RTX5080-O16G (opened with WebFetch).
- AMD values: NOT verified. The amd.com product pages (9800X3D, RX 9070 XT) timed out on every attempt (3 tries each), so they could not be opened. Search snippets were seen but are secondary and are not used for verdicts.

## CPU

### cpu-intel-i7-12700k (Core i7-12700K)

| field | catalog value | official value | source URL | verdict |
|---|---|---|---|---|
| socket | LGA1700 | FCLGA1700 | https://www.intel.com/content/www/us/en/products/sku/134594/intel-core-i712700k-processor-25m-cache-up-to-5-00-ghz/specifications.html | OK |
| cores | 12 | Total Cores 12 (8P + 4E) | same | OK |
| threads | 20 | Total Threads 20 | same | OK |
| baseClockGHz | 3.6 | Performance-core Base 3.60 GHz | same | OK |
| boostClockGHz | 5.0 | Product title "up to 5.00 GHz"; P-core Max Turbo 4.90 GHz; E-core Max Turbo 3.80 GHz | same | OK (ambiguous: catalog uses the title maximum, P-core max is 4.9) |
| maxPowerW | 190 | Maximum Turbo Power 190 W (Processor Base Power 125 W) | same | OK |
| gen | 12 | Not captured on the fetched page | same | UNVERIFIED |
| memTypes | DDR4, DDR5 | Up to DDR5 4800 MT/s; Up to DDR4 3200 MT/s | same | OK |
| maxRamGB | 128 | Max Memory Size 128 GB | same | OK |

### cpu-intel-i7-14700k (Core i7-14700K)

Catalog currently has `socket`, `cores` etc. OK. Note the source URL that was first tried (sku/236773) is the 14900K page; the URL below is the correct 14700K SKU.

| field | catalog value | official value | source URL | verdict |
|---|---|---|---|---|
| socket | LGA1700 | FCLGA1700 | https://www.intel.com/content/www/us/en/products/sku/236783/intel-core-i7-processor-14700k-33m-cache-up-to-5-60-ghz/specifications.html | OK |
| cores | 20 | Total Cores 20 (8P + 12E) | same | OK |
| threads | 28 | Total Threads 28 | same | OK |
| baseClockGHz | 3.4 | Performance-core Base 3.4 GHz (E-core base 2.5 GHz) | same | OK |
| boostClockGHz | 5.6 | Product title "up to 5.60 GHz"; P-core Max Turbo 5.5 GHz; E-core Max Turbo 4.3 GHz | same | OK (ambiguous: title maximum vs P-core 5.5) |
| maxPowerW | 253 | Maximum Turbo Power 253 W (Processor Base Power 125 W) | same | OK |
| gen | 14 | Not captured on the fetched page | same | UNVERIFIED |
| memTypes | DDR4, DDR5 | Up to DDR5 5600 MT/s; Up to DDR4 3200 MT/s | same | OK |
| maxRamGB | 192 | Max Memory Size 192 GB | same | OK |

### cpu-intel-i9-14900k (Core i9-14900K)

| field | catalog value | official value | source URL | verdict |
|---|---|---|---|---|
| socket | LGA1700 | FCLGA1700 | http://www.intel.com/content/www/us/en/products/sku/236773/intel-core-i9-processor-14900k-36m-cache-up-to-6-00-ghz/specifications.html | OK |
| cores | 24 | Total Cores 24 (8P + 16E) | same | OK |
| threads | 32 | Total Threads 32 | same | OK |
| baseClockGHz | 3.2 | Performance-core Base 3.2 GHz (E-core base 2.4 GHz) | same | OK |
| boostClockGHz | 6.0 | Product title "up to 6.00 GHz"; P-core Max Turbo 5.6 GHz; E-core Max Turbo 4.4 GHz | same | OK (ambiguous: title maximum vs P-core 5.6) |
| maxPowerW | 253 | Maximum Turbo Power 253 W (Processor Base Power 125 W) | same | OK |
| gen | 14 | Not captured on the fetched page | same | UNVERIFIED |
| memTypes | DDR4, DDR5 | Up to DDR5 5600 MT/s; Up to DDR4 3200 MT/s | same | OK |
| maxRamGB | 192 | Max Memory Size 192 GB | same | OK |

### cpu-intel-core-ultra-7-265k (Core Ultra 7 265K)

| field | catalog value | official value | source URL | verdict |
|---|---|---|---|---|
| socket | LGA1851 | FCLGA1851 | https://www.intel.com/content/www/us/en/products/sku/241063/intel-core-ultra-7-processor-265k-30m-cache-up-to-5-50-ghz/specifications.html | OK |
| cores | 20 | Total Cores 20 (8P + 12E, 0 LP-E) | same | OK |
| threads | 20 | Total Threads 20 | same | OK |
| baseClockGHz | 3.9 | Performance-core Base 3.9 GHz (E-core base 3.3 GHz) | same | OK |
| boostClockGHz | 5.5 | Product title "up to 5.50 GHz"; P-core Max Turbo 5.4 GHz; E-core Max Turbo 4.6 GHz | same | OK (ambiguous: title maximum vs P-core 5.4) |
| maxPowerW | 250 | Maximum Turbo Power 250 W (Processor Base Power 125 W) | same | OK |
| memTypes | DDR5 | Up to DDR5 6400 MT/s | same | OK |
| maxRamGB | 192 | Max Memory Size (dependent on memory type) 256 GB | same | WRONG (should be 256) |

Note: an Intel series-level brief gives 192 GB for the whole Series 2 desktop lineup. The per-SKU page is the more specific source and says 256 GB. This is the value the catalog should follow.

### cpu-amd-ryzen-7-9800x3d (Ryzen 7 9800X3D)

| field | catalog value | official value | source URL | verdict |
|---|---|---|---|---|
| socket | AM5 | Not captured (AMD page timed out) | https://www.amd.com/en/products/processors/desktops/ryzen/9000-series/amd-ryzen-7-9800x3d.html | UNVERIFIED |
| cores | 8 | Not captured (secondary search snippet: 8 cores, 16 threads) | same | UNVERIFIED |
| threads | 16 | Not captured | same | UNVERIFIED |
| baseClockGHz | 4.7 | Not captured (secondary snippet: base 4.7 GHz) | same | UNVERIFIED |
| boostClockGHz | 5.2 | Not captured (secondary snippet: "up to 5.2 GHz"). Matches the snippet, but the official page could not be opened | same | UNVERIFIED |
| maxPowerW | 162 | Not captured. Secondary snippet gives default TDP 120 W; 162 W is probably the PPT figure, not checked | same | UNVERIFIED |
| memTypes | DDR5 | Not captured | same | UNVERIFIED |
| maxRamGB | 192 | Not captured | same | UNVERIFIED |

## GPU

### gpu-asus-prime-rtx5080-oc (ASUS Prime GeForce RTX 5080 OC)

| field | catalog value | official value | source URL | verdict |
|---|---|---|---|---|
| chip | GB203 | Not on the fetched ASUS or NVIDIA page | https://www.asus.com/motherboards-components/graphics-cards/prime/prime-rtx5080-o16g/techspec/ | UNVERIFIED |
| vramGB | 16 | Video Memory 16GB GDDR7 | same | OK |
| vramType | GDDR7 | 16GB GDDR7 | same | OK |
| lengthMm | 304 | Dimensions 304 x 126 x 50 mm | same | OK |
| slots | 2.5 | Slot 2.5 Slot | same | OK |
| dims (w x h x d) | 304 x 126 x 50 | 304 x 126 x 50 mm (page does not label which is length, width, thickness; matches ASUS listing) | same | OK |
| powerW | 360 | ASUS does not list TGP. NVIDIA FE Total Graphics Power 360 W | https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5080/ | ESTIMATE-OK (ASUS OC TGP not published; FE value used) |
| connector | 12V-2x6 | Power Connectors: 1 x 16-pin (16-pin is the 12V-2x6 family connector) | https://www.asus.com/motherboards-components/graphics-cards/prime/prime-rtx5080-o16g/techspec/ | OK |
| recommendedPsuW | 850 | Recommended PSU 850W | same | OK |
| boostClockMHz | 2640 | Engine Clock: OC mode 2685 MHz; Default mode 2655 MHz | same | WRONG (2640 matches neither; see corrections) |
| fanCount | 3 | Not listed on the ASUS page | same | UNVERIFIED |

### gpu-nvidia-rtx-5090 (GeForce RTX 5090)

Reference = NVIDIA Founders Edition (FE). The catalog entry is marked `estimated: true`; partner cards are often larger.

| field | catalog value | official value | source URL | verdict |
|---|---|---|---|---|
| chip | GB202 | Not on the fetched NVIDIA page | https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/ | UNVERIFIED |
| vramGB | 32 | Standard Memory Config 32 GB GDDR7 | same | OK |
| vramType | GDDR7 | 32 GB GDDR7 | same | OK |
| lengthMm | 340 | FE Length 304 mm (Width 137 mm) | same | WRONG vs FE (340 mm is a partner-card size; keep only if the entry is meant as a generic partner card) |
| slots | 3.5 | FE table says "2-Slot"; installation text says "3-slot card (61mm)". Page is internally inconsistent; FE thickness 61 mm = 3 slots | same | WRONG vs FE (3.5 does not match either value) |
| powerW | 575 | Total Graphics Power 575 W | same | OK |
| connector | 12V-2x6 | Supplementary connectors: 4x PCIe 8-pin (adapter) OR 1x 600 W PCIe Gen 5 cable | same | OK |
| recommendedPsuW | 1000 | Required System Power (W) 1000. Note: the same page's PSU heading says "850W Minimum" | same | OK (conflict noted; the 1000 W value matches the Required System Power field) |
| boostClockMHz | 2410 | Boost Clock 2.41 GHz | same | OK |
| fanCount | (not in catalog) | n/a | n/a | n/a |

### gpu-nvidia-rtx-5070ti (GeForce RTX 5070 Ti)

NVIDIA lists length, width and slots as "Varies by manufacturer" for the 5070 Ti, so no FE dimensions were published on the page.

| field | catalog value | official value | source URL | verdict |
|---|---|---|---|---|
| chip | GB203 | Not on the fetched page | https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5070-family/ | UNVERIFIED |
| vramGB | 16 | Standard Memory Config 16 GB GDDR7 | same | OK |
| vramType | GDDR7 | 16 GB GDDR7 (256-bit) | same | OK |
| lengthMm | 305 | "Varies by manufacturer" (no FE value published) | same | ESTIMATE-OK (within the typical partner range of ~300-304 mm) |
| slots | 2.5 | "Varies by manufacturer" (no FE value published) | same | ESTIMATE-OK |
| powerW | 300 | Total Graphics Power 300 W | same | OK |
| connector | 12V-2x6 | Supplementary connectors: 2x PCIe 8-pin (adapter) OR 300 W or greater PCIe Gen 5 cable | same | OK |
| recommendedPsuW | 750 | Required System Power (W) 750 (footnote: PCIe CEM 5.1 compliant PSU) | same | OK |
| boostClockMHz | 2452 | Boost Clock 2.45 GHz (rounded on the page) | same | OK |

### gpu-amd-rx-9070xt (Radeon RX 9070 XT)

All official values UNVERIFIED: the amd.com page timed out on every attempt. Secondary search snippets (not used for verdicts) reported: TBP 304 W, recommended PSU 750 W, boost up to 2970 MHz, 16 GB GDDR6 on a 256-bit bus. These agree with the catalog's powerW, recommendedPsuW, boostClockMHz and vramType, but that is not an official check. Reference dimensions and connector were not found at all.

| field | catalog value | official value | source URL | verdict |
|---|---|---|---|---|
| chip | Navi 48 | Not captured | https://www.amd.com/en/products/graphics/desktops/radeon/9000-series/amd-radeon-rx-9070xt.html | UNVERIFIED |
| vramGB | 16 | Not captured (secondary snippet: 16 GB) | same | UNVERIFIED |
| vramType | GDDR6 | Not captured (secondary snippet: GDDR6) | same | UNVERIFIED |
| lengthMm | 320 | Not captured; no reference dimensions checked | same | UNVERIFIED |
| slots | 3 | Not captured | same | UNVERIFIED |
| powerW | 304 | Not captured (secondary snippet: Typical Board Power 304 W) | same | UNVERIFIED |
| connector | 8-pin | Not captured | same | UNVERIFIED |
| recommendedPsuW | 750 | Not captured (secondary snippet: 750 W minimum) | same | UNVERIFIED |
| boostClockMHz | 2970 | Not captured (secondary snippet: up to 2970 MHz) | same | UNVERIFIED |

## Corrections to apply

Apply in `src/catalog/parts/cpu.ts` and `src/catalog/parts/gpu.ts` (the other agent's `image` edits are unaffected):

1. `src/catalog/parts/cpu.ts`, `cpu-intel-core-ultra-7-265k`: `maxRamGB: 192` -> `maxRamGB: 256`. Official: Intel SKU 241063, Max Memory Size 256 GB.
2. `src/catalog/parts/gpu.ts`, `gpu-asus-prime-rtx5080-oc`: `boostClockMHz: 2640` -> `boostClockMHz: 2685` (OC mode, matches the "ASUS OC preset" comment). Default mode is 2655 MHz if the default is wanted instead.
3. `src/catalog/parts/gpu.ts`, `gpu-nvidia-rtx-5090`: `lengthMm: 340` -> `lengthMm: 304` and `slots: 3.5` -> `slots: 3` to match the Founders Edition reference (304 x 137 x 61 mm). Keep 340 / 3.5 only if the entry is meant to represent a partner card, and then say so in the entry.
4. Same values also live in `src/data/options.ts`, `OPT.gpu` entry `'5090'` (`len: 340, slots: 3.5`). Apply the same change there so the options list and the catalog agree.

No change needed (verified, OK): every other field that has an OK verdict above.

Open items (not corrections):
- 9800X3D: all fields UNVERIFIED. Re-run this check when the amd.com page can be opened.
- RX 9070 XT: all fields UNVERIFIED for the same reason. Reference length/slots and connector still need an official source.
- 5090 recommended PSU: the NVIDIA page shows both 1000 W (Required System Power) and "850W Minimum" (PSU heading). The catalog uses 1000 W; leave as is, but know the conflict.
- Intel `gen` values (12, 14, 14) and the 5080 `chip`, 5090 `chip`, 5070 Ti `chip`, 5080 `fanCount`: not on the pages fetched, so UNVERIFIED.
- Intel "boostClockGHz" values follow the product-title maximum ("up to X GHz"). The spec-table P-core Max Turbo values are lower (12700K 4.9, 14700K 5.5, 14900K 5.6, 265K 5.4). No change is required, but the field comment should say which one it means.

## Totals

| verdict | count |
|---|---|
| OK | 50 |
| WRONG | 4 |
| ESTIMATE-OK | 3 |
| UNVERIFIED | 24 |
| Total fields checked | 81 |
