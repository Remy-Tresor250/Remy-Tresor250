"""Render GitHub contributions as animated isometric skylines: the last 12 months,
plus one per earlier year, and list those years in the README.

Stdlib only. Needs GITHUB_TOKEN; USERNAME defaults to the repo owner.
Usage: python contrib_3d.py [assets_dir] [readme]
"""
import base64
import json
import os
import sys
import urllib.request

QUERY = """
query($login: String!, $from: DateTime, $to: DateTime) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      contributionYears
      contributionCalendar {
        totalContributions
        weeks { contributionDays { contributionCount date weekday } }
      }
    }
  }
}"""

FONTS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts")
PAPER, PAPER_DK, INK = "#FFF7EC", "#F3E6D3", "#2B2340"
# pastel ramp across the year: peach, honey, mint, sky, lilac, pink
RAMP = ["#FF8F70", "#FFC94D", "#7DD9B8", "#8EC9FF", "#B7A4FF", "#FF9EC4"]


def fetch(login, token, year=None):
    variables = {"login": login}
    if year:
        variables.update({"from": f"{year}-01-01T00:00:00Z", "to": f"{year}-12-31T23:59:59Z"})
    body = json.dumps({"query": QUERY, "variables": variables}).encode()
    req = urllib.request.Request("https://api.github.com/graphql", data=body, method="POST")
    req.add_header("Authorization", "Bearer " + token)
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req) as resp:
        data = json.load(resp)
    if "errors" in data:
        raise SystemExit(f"GraphQL error: {data['errors']}")
    coll = data["data"]["user"]["contributionsCollection"]
    return coll["contributionCalendar"], coll["contributionYears"]


def font_face(family, filename):
    with open(os.path.join(FONTS, filename), "rb") as f:
        b64 = base64.b64encode(f.read()).decode()
    return f"@font-face{{font-family:'{family}';src:url(data:font/woff2;base64,{b64}) format('woff2')}}"


def ramp(t):
    t = max(0.0, min(1.0, t)) * (len(RAMP) - 1)
    i = min(int(t), len(RAMP) - 2)
    a, b = RAMP[i].lstrip("#"), RAMP[i + 1].lstrip("#")
    f = t - i
    return tuple(int(a[k:k + 2], 16) * (1 - f) + int(b[k:k + 2], 16) * f for k in (0, 2, 4))


def rgb(c, k=1.0):
    return "#%02x%02x%02x" % tuple(max(0, min(255, round(v * k))) for v in c)


def render(cal, login, subtitle):
    W, H = 1000, 440
    weeks = cal["weeks"]
    counts = sorted(d["contributionCount"] for w in weeks for d in w["contributionDays"])
    nonzero = [c for c in counts if c] or [1]
    cap = max(nonzero[int(len(nonzero) * 0.95) - 1] if len(nonzero) > 1 else nonzero[0], 1)
    # screen-space step for one week and one weekday (a flattened isometric grid)
    wx, wy, dx, dy, gap = 15.5, 3.4, -7.0, 5.5, 0.84
    ox = W / 2 - (len(weeks) / 2) * wx - 3.5 * dx
    oy = 190

    def at(w, d, h=0.0):
        return ox + w * wx + d * dx, oy + w * wy + d * dy - h

    def pts(*ps):
        return " ".join(f"{x:.1f},{y:.1f}" for x, y in ps)

    bars = []
    for wi, week in enumerate(weeks):
        for day in week["contributionDays"]:
            bars.append((day["weekday"], wi, day["contributionCount"], day["date"]))
    bars.sort()  # back rows first, so nearer bars paint over farther ones

    out = []
    for di, wi, n, date in bars:
        corners = [(wi, di), (wi + gap, di), (wi + gap, di + gap), (wi, di + gap)]
        if n == 0:
            out.append(f'<polygon points="{pts(*(at(w, d) for w, d in corners))}" fill="{PAPER_DK}"/>')
            continue
        h = 6 + 70 * min(n, cap) / cap
        a, b, c, d = (at(w, dd) for w, dd in corners)
        ta, tb, tc, td = (at(w, dd, h) for w, dd in corners)
        col = ramp(wi / max(len(weeks) - 1, 1))
        out.append(
            f'<g class="b" style="animation-delay:{wi * 28}ms"><title>{n} on {date}</title>'
            f'<polygon points="{pts(tb, tc, c, b)}" fill="{rgb(col, .76)}"/>'
            f'<polygon points="{pts(td, tc, c, d)}" fill="{rgb(col, .9)}"/>'
            f'<polygon points="{pts(ta, tb, tc, td)}" fill="{rgb(col)}"/></g>')

    total = cal["totalContributions"]
    fonts = font_face("Grotesk", "grotesk-700.woff2") + font_face("Hand", "caveat-700.woff2")
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-label="{total} contributions {subtitle}, as a 3D skyline">
<title>{login} · {total} contributions {subtitle}</title>
<defs>
<pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.3" fill="{PAPER_DK}"/></pattern>
<style>
{fonts}
@keyframes rise{{from{{transform:scaleY(0);opacity:0}}to{{transform:scaleY(1);opacity:1}}}}
.b{{transform-box:fill-box;transform-origin:50% 100%;animation:rise .9s cubic-bezier(.2,.8,.2,1.2) both}}
.b polygon{{stroke:{INK};stroke-width:.9;stroke-linejoin:round}}
.h{{font:700 30px Grotesk;fill:{INK};letter-spacing:-.5px}}
.k{{font:700 28px Hand;fill:#FF8F70}}
@media (prefers-reduced-motion:reduce){{.b{{animation:none}}}}
</style>
</defs>
<rect width="{W}" height="{H}" rx="28" fill="{PAPER}"/>
<rect width="{W}" height="{H}" rx="28" fill="url(#dots)"/>
<rect x="1" y="1" width="{W - 2}" height="{H - 2}" rx="27" fill="none" stroke="{PAPER_DK}" stroke-width="2"/>
<text class="h" x="40" y="62">{total:,} contributions</text>
<text class="k" x="42" y="96" transform="rotate(-2 42 96)">{subtitle}, stacked up</text>
{"".join(out)}
</svg>'''


def years_block(years):
    """The README rows that unfold earlier years."""
    if not years:
        return ""
    rows = ['<p align="center"><sub>rewind to an earlier year</sub></p>', ""]
    for year, total in years:
        rows += ["<details>",
                 f"<summary><b>{year}</b> &nbsp;·&nbsp; {total:,} contributions</summary>",
                 "<br/>",
                 f'<img src="./assets/contrib-3d-{year}.svg" width="100%" alt="My GitHub contributions in {year}, stacked up as a 3D skyline." />',
                 "</details>", ""]
    return "\n".join(rows)


def update_readme(path, block):
    start, end = "<!-- years:start -->", "<!-- years:end -->"
    with open(path, encoding="utf-8") as f:
        text = f.read()
    if start not in text or end not in text:
        return
    head, rest = text.split(start, 1)
    _, tail = rest.split(end, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(f"{head}{start}\n{block}{end}{tail}")


def main():
    assets = sys.argv[1] if len(sys.argv) > 1 else "assets"
    readme = sys.argv[2] if len(sys.argv) > 2 else "README.md"
    login = os.environ.get("USERNAME") or os.environ["GITHUB_REPOSITORY_OWNER"]
    token = os.environ["GITHUB_TOKEN"]
    os.makedirs(assets, exist_ok=True)

    cal, all_years = fetch(login, token)
    with open(os.path.join(assets, "contrib-3d.svg"), "w", encoding="utf-8") as f:
        f.write(render(cal, login, "in the last year"))
    print(f"last 12 months: {cal['totalContributions']} contributions")

    this_year = int(max(d["date"] for w in cal["weeks"] for d in w["contributionDays"])[:4])
    past = []
    for year in sorted((y for y in all_years if y < this_year), reverse=True):
        ycal, _ = fetch(login, token, year)
        with open(os.path.join(assets, f"contrib-3d-{year}.svg"), "w", encoding="utf-8") as f:
            f.write(render(ycal, login, f"in {year}"))
        past.append((year, ycal["totalContributions"]))
        print(f"{year}: {ycal['totalContributions']} contributions")
    update_readme(readme, years_block(past))


if __name__ == "__main__":
    main()
