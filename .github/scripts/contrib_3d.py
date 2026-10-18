"""Render the last year of GitHub contributions as an animated isometric 3D skyline.

Stdlib only. Needs GITHUB_TOKEN; USERNAME defaults to the repo owner.
Usage: python contrib_3d.py <output.svg>
"""
import json
import os
import sys
import urllib.request

QUERY = """
query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { contributionCount date weekday } }
      }
    }
  }
}"""

FONT = "'Segoe UI', 'Helvetica Neue', Ubuntu, Arial, sans-serif"


def fetch(login, token):
    body = json.dumps({"query": QUERY, "variables": {"login": login}}).encode()
    req = urllib.request.Request("https://api.github.com/graphql", data=body, method="POST")
    req.add_header("Authorization", "Bearer " + token)
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req) as resp:
        data = json.load(resp)
    if "errors" in data:
        raise SystemExit(f"GraphQL error: {data['errors']}")
    return data["data"]["user"]["contributionsCollection"]["contributionCalendar"]


def hsl(h, s, l):
    s, l = s / 100, l / 100
    c = (1 - abs(2 * l - 1)) * s
    x = c * (1 - abs((h / 60) % 2 - 1))
    m = l - c / 2
    r, g, b = [(c, x, 0), (x, c, 0), (0, c, x), (0, x, c), (x, 0, c), (c, 0, x)][int(h // 60) % 6]
    return "#%02x%02x%02x" % tuple(round((v + m) * 255) for v in (r, g, b))


def render(cal, login):
    W, H = 1000, 420
    weeks = cal["weeks"]
    counts = sorted(d["contributionCount"] for w in weeks for d in w["contributionDays"])
    nonzero = [c for c in counts if c] or [1]
    cap = max(nonzero[int(len(nonzero) * 0.95) - 1] if len(nonzero) > 1 else nonzero[0], 1)
    # screen-space step for one week and one weekday (a flattened isometric grid)
    wx, wy, dx, dy, gap = 15.5, 3.4, -7.0, 5.5, 0.84
    ox = W / 2 - (len(weeks) / 2) * wx - 3.5 * dx
    oy = 170

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
            out.append(f'<polygon points="{pts(*(at(w, d) for w, d in corners))}" fill="#1b2147"/>')
            continue
        h = 6 + 70 * min(n, cap) / cap
        a, b, c, d = (at(w, dd) for w, dd in corners)
        ta, tb, tc, td = (at(w, dd, h) for w, dd in corners)
        hue = 330 - 230 * wi / max(len(weeks) - 1, 1)  # pink -> cyan across the year
        out.append(
            f'<g class="b" style="animation-delay:{wi * 28}ms"><title>{n} on {date}</title>'
            f'<polygon points="{pts(tb, tc, c, b)}" fill="{hsl(hue, 70, 34)}"/>'
            f'<polygon points="{pts(td, tc, c, d)}" fill="{hsl(hue, 75, 46)}"/>'
            f'<polygon points="{pts(ta, tb, tc, td)}" fill="{hsl(hue, 90, 68)}"/></g>')

    total = cal["totalContributions"]
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-label="{total} contributions in the last year, as a 3D skyline">
<title>{login} · {total} contributions in the last year</title>
<style>
@keyframes rise{{from{{transform:scaleY(0);opacity:0}}to{{transform:scaleY(1);opacity:1}}}}
.b{{transform-box:fill-box;transform-origin:50% 100%;animation:rise .9s cubic-bezier(.2,.8,.2,1.2) both}}
.h{{font:700 22px {FONT};fill:#E6E9FF}}
.k{{font:500 14px {FONT};fill:#8F9BD8}}
@media (prefers-reduced-motion:reduce){{.b{{animation:none}}}}
</style>
<rect width="{W}" height="{H}" rx="20" fill="#080b1f"/>
<text class="h" x="32" y="48">{total:,} contributions</text>
<text class="k" x="32" y="72">last 12 months · rendered in 3D</text>
{"".join(out)}
</svg>'''



def main():
    out = sys.argv[1] if len(sys.argv) > 1 else "assets/contrib-3d.svg"
    login = os.environ.get("USERNAME") or os.environ["GITHUB_REPOSITORY_OWNER"]
    cal = fetch(login, os.environ["GITHUB_TOKEN"])
    os.makedirs(os.path.dirname(out) or ".", exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        f.write(render(cal, login))
    print(f"wrote {out}: {cal['totalContributions']} contributions")


if __name__ == "__main__":
    main()
