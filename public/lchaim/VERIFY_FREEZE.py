"""L'CHAIM kosher dataset - freeze verifier.

Run this at any time to confirm the frozen dataset has not drifted:

    python VERIFY_FREEZE.py

It checks three things:
  1. every file listed in FREEZE_MANIFEST.json still has its recorded SHA-256
  2. every category file's records still hash to its frozen record fingerprint
  3. no not-approved record has leaked into an approved list

Exit code 0 = clean. Non-zero = something changed.
"""
import json, os, sys, hashlib

HERE = os.path.dirname(os.path.abspath(__file__))
CATS = ("scotch", "bourbon", "tequila", "vodka", "beer", "liqueur")
N1 = 'list_1_approved_only_when_bearing_required_symbol'
L2, L3, L4 = ('list_2_approved_without_symbol', 'list_3_approved_only_with_symbol',
              'list_4_not_approved')

def record_fingerprint(recs):
    return hashlib.sha256(json.dumps(sorted(
        (r['agency'], r['brand_exact'], r['product_exact'], r['agency_status_exact'],
         ','.join(r['certification_or_symbol']), str(r.get('symbol_required_for_approval')),
         r['physical_symbol_independently_observed'], ''.join(sorted(r['lists_literal'])),
         r.get('conditions_exact', '') or '') for r in recs),
        ensure_ascii=False).encode()).hexdigest()[:16]

def file_sha(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()

fail = 0

man_path = os.path.join(HERE, 'FREEZE_MANIFEST.json')
if not os.path.exists(man_path):
    print("FREEZE_MANIFEST.json not found"); sys.exit(2)
man = json.load(open(man_path, encoding='utf-8'))

print("1. FILE HASHES")
for name, rec in sorted(man['files'].items()):
    p = os.path.join(HERE, name)
    if not os.path.exists(p):
        print(f"   MISSING  {name}"); fail += 1; continue
    now = file_sha(p)
    ok = now == rec['sha256']
    if not ok: fail += 1
    print(f"   {'ok  ' if ok else 'DIFF'} {name}")

print("\n2. RECORD FINGERPRINTS")
for fn in CATS:
    p = os.path.join(HERE, f"{fn}_kosher_research.json")
    o = json.load(open(p, encoding='utf-8'))
    live = record_fingerprint(o['records'])
    stored = o['dataset_status']['record_fingerprint_sha256_16']
    ok = live == stored
    if not ok: fail += 1
    print(f"   {'ok  ' if ok else 'DIFF'} {fn:<9} {len(o['records']):>5} records  "
          f"stored={stored} live={live}")

print("\n3. SAFETY - not-approved must never appear in an approved list")
neg = bad = 0
for fn in CATS:
    o = json.load(open(os.path.join(HERE, f"{fn}_kosher_research.json"), encoding='utf-8'))
    for r in o['records']:
        if r['agency_status_exact'].lower().startswith(('not approved', 'not recommended')):
            neg += 1
            if L4 not in r['lists_literal'] or any(
                    x in r['lists_literal'] for x in (N1, L2, L3)):
                bad += 1
                print(f"   LEAK {fn} {r['agency']} {r['brand_exact']} | {r['product_exact']}")
print(f"   {neg} not-approved records checked, {bad} leaks")
fail += bad

print("\nRESULT:", "CLEAN - dataset matches the freeze" if fail == 0
      else f"{fail} PROBLEM(S) - the dataset has drifted from the freeze")
sys.exit(0 if fail == 0 else 1)
