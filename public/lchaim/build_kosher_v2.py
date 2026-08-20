"""L'chaim kosher liquor data — rebuild v2.

Design rules learned from v1:
  1. Source wording is never rewritten, merged or reinterpreted.
  2. No derived field may combine two distinct source states. The four
     kosher groups below are DISTINCT because the sites publish them
     distinctly, and they stay distinct.
  3. Every derived field is reversible - you can always see the source text
     it came from, in the same row.
  4. Nothing is deleted. Mixers/bar-stock stay in the file with a flag so
     they can be filtered, not silently dropped.
  5. Category provenance is always stated. A category is either sourced,
     brand-inferred-and-unverified, or not researched. Never guessed silently.

The four groups (identical meaning on both lists, different source wording):
  1 HAS_SYMBOL   - the product carries a kosher symbol; production supervised
  2 NO_CERT      - approved/acceptable, but no certification on the bottle
  3 ONLY_IF_SYMBOL - acceptable ONLY if the bottle bears the named symbol
  4 NOT_APPROVED - not approved / not recommended
"""
import re, html, json, collections, os

SP = os.path.dirname(os.path.abspath(__file__))
OUTDIR = r'C:/Users/azony/Downloads/lchaim_data'
os.makedirs(OUTDIR, exist_ok=True)

def t(s):
    s = re.sub(r'<br\s*/?>', ' ', s or '')
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', s))).strip()

GROUP = {
    1: 'Has kosher symbol (supervised)',
    2: 'Approved without certification',
    3: 'Approved only if bottle bears the symbol',
    4: 'Not approved',
}

# ----------------------------------------------------------------- STAR-K --
SK_NONALC = {
    'Bitters', 'Black and Green Olives, Domestic', 'Coconut Milk (100% Pure)',
    'Fruit Juices', 'Grenadine', 'Maraschino Cherries', 'Pearl Onions, Jarred',
    'Tabasco',
}
CERTBY = re.compile(r'^\s*certified by\s+(.+?)\s*$', re.I)
COND = re.compile(r'when bearing|requires? (?:kosher|approved) certification|'
                  r'only with kosher certification|unless has kosher symbol', re.I)
SYM = re.compile(r'(?:when bearing|certified by)\s+(.+)', re.I)

def parse_starkk():
    h = open(os.path.join(SP, 'starkk_raw.html'), encoding='utf-8').read()
    rows, cur = [], {}
    for m in re.finditer(r'<li class="(brand|prevBrand|name|status)"[^>]*>(.*?)</li>', h, re.S):
        cls, raw = m.group(1), m.group(2)
        if cls in ('brand', 'prevBrand'):
            cur['brand'] = t(raw)
        elif cls == 'name':
            sp = re.search(r'<span class="note[^"]*">(.*?)</span>', raw, re.S)
            cur['note'] = t(sp.group(1)) if sp else ''
            cur['product'] = t(re.sub(r'<span class="note[^"]*">.*?</span>', '', raw, flags=re.S))
        elif cls == 'status':
            status = t(raw)
            product, note = cur.get('product', ''), cur.get('note', '')
            if not product or product == 'Name':
                cur = {k: v for k, v in cur.items() if k == 'brand'}
                continue
            paren = ' '.join(re.findall(r'\(([^)]*)\)', product))
            blob = ' '.join(x for x in (note, paren) if x)
            cb = CERTBY.match(note.strip())
            certified_by = cb.group(1).strip() if cb else ''
            conditional = bool(COND.search(blob))
            if status.lower() != 'approved':
                grp = 4
            elif certified_by:
                grp = 1
            elif conditional:
                grp = 3
            else:
                grp = 2
            syms = []
            for chunk in re.findall(r'(?:when bearing|certified by)\s+([^.;]+)', blob, re.I):
                for s in re.split(r'\s+or\s+|\s*\|\s*|,', chunk):
                    s = s.strip().rstrip('.')
                    if s and len(s) < 40:
                        syms.append(s)
            rows.append({
                'agency': 'Star-K',
                'brand': cur.get('brand', ''),
                'product': product,
                'kosher_group': grp,
                'kosher_group_label': GROUP[grp],
                'certifying_agency': '; '.join(dict.fromkeys(syms)),
                'source_status': status,
                'source_note': note,
                'product_class': 'Mixer or bar stock' if product.split(' (')[0] in SK_NONALC
                                 else 'Alcoholic beverage',
            })
            cur = {k: v for k, v in cur.items() if k == 'brand'}
    return rows

# -------------------------------------------------------------------- cRc --
def parse_crc():
    h = open(os.path.join(SP, 'crc_raw.html'), encoding='utf-8').read()
    rows = []
    for r in re.findall(r'<tr[^>]*>(.*?)</tr>', h, re.S):
        c = re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>', r, re.S)
        if len(c) < 7 or t(c[0]).lower() == 'brand':
            continue
        smalls = [t(x) for x in re.findall(r'<small[^>]*>(.*?)</small>', c[0], re.S)]
        qualifier = smalls[0] if smalls else ''
        extra = smalls[1] if len(smalls) > 1 else ''
        brand = t(re.sub(r'<small[^>]*>.*?</small>', '', c[0], flags=re.S))
        rec, hashg, sym = t(c[3]), t(c[4]), t(c[5])
        rl, ql = rec.lower(), qualifier.lower()
        if rl.startswith('not recommended'):
            grp = 4
        elif rl.startswith('acceptable'):
            grp = 2
        elif ql.startswith('certified when bearing'):
            grp = 3
        elif rl.startswith('certified'):
            grp = 1
        else:
            grp = 0
        rows.append({
            'agency': 'cRc',
            'brand': brand,
            'product': t(c[1]),
            'category': t(c[2]),
            'category_source': 'Published by cRc',
            'kosher_group': grp,
            'kosher_group_label': GROUP.get(grp, 'Other / see source wording'),
            'certifying_agency': hashg,
            'source_recommendation': rec,
            'source_qualifier': qualifier,
            'source_note': extra,
            'symbol_required_field': sym,
            'product_class': 'Mixer or bar stock' if t(c[2]) == 'Bar Stock Items'
                             else 'Alcoholic beverage',
        })
    return rows

sk = parse_starkk()
crc = parse_crc()

# ---------------- OPTION E: categories for Star-K, with provenance ----------
CATW = r'vodka|whisk(e)?y|bourbon|scotch|gin|rum|tequila|beer|ale|lager|wine|cider|seltzer|liqueur|cognac|brandy|mezcal|sake|mead|rye|spirits?'
NOISE = r'\b(the|inc|llc|ltd|co|company|brewing|brewery|distiller(y|s|ies)|distilling|winery|vineyards?|cellars?|imports?|group)\b'
def nb(s):
    s = (s or '').lower().replace('&amp;', '&')
    s = re.sub(NOISE, ' ', s); s = re.sub(r'\b(' + CATW + r')\b', ' ', s)
    return re.sub(r'[^a-z0-9]', '', s)
def npd(s):
    s = (s or '').lower(); s = re.sub(r'\([^)]*\)', '', s)
    return re.sub(r'[^a-z0-9]', '', s)

crc_bp = {(nb(r['brand']), npd(r['product'])): r['category'] for r in crc}
crc_brand = collections.defaultdict(collections.Counter)
for r in crc:
    crc_brand[nb(r['brand'])][r['category']] += 1

for r in sk:
    k = (nb(r['brand']), npd(r['product']))
    if k in crc_bp:
        r['category'] = crc_bp[k]
        r['category_source'] = 'cRc exact brand+product match (sourced)'
    elif nb(r['brand']) in crc_brand and len(crc_brand[nb(r['brand'])]) == 1:
        r['category'] = next(iter(crc_brand[nb(r['brand'])]))
        r['category_source'] = 'BRAND-INFERRED FROM cRc — UNVERIFIED, may be wrong'
    else:
        r['category'] = 'Not researched'
        r['category_source'] = 'Not researched'

for r in sk:
    r['_order'] = ['agency','brand','product','category','category_source','kosher_group',
                   'kosher_group_label','certifying_agency','source_status','source_note','product_class']

print('STAR-K rows:', len(sk), '| cRc rows:', len(crc))
print()
print('STAR-K kosher groups:')
for g, n in sorted(collections.Counter(r['kosher_group'] for r in sk).items()):
    print(f'   {n:5}  {g}. {GROUP[g]}')
print('cRc kosher groups:')
for g, n in sorted(collections.Counter(r['kosher_group'] for r in crc).items()):
    print(f'   {n:5}  {g}. {GROUP.get(g,"other")}')
print()
print('STAR-K category provenance:')
for k, n in collections.Counter(r['category_source'] for r in sk).most_common():
    print(f'   {n:5}  {k}')

json.dump(sk, open(OUTDIR + '/starK_liquor.json', 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
json.dump(crc, open(OUTDIR + '/cRc_liquor.json', 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
print()
print('wrote JSON to', OUTDIR)
