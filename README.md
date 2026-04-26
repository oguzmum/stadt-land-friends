# Stadt Land Fluss Friends

While going out with friends we sometimes played Stadt Land Fluss on websites, but the ads were so annoying that I decided to just build it myself.

The UI and game content are fully in German, since this is a game we play with friends in German.

No accounts, no ads, no nonsense. Just scan a QR code and play.

---

Built with the help of [Claude Code](https://claude.ai/code) and [Claude Design](https://claude.ai).

The original UI mockups created with Claude Design are under `./design/`.

## Getting Started

```bash
npm install
npm run dev
```

---

## Docker

```bash
cp .env.example .env

docker build -f Docker/Dockerfile -t stadt-land-fluss .

docker compose up -d --build
```
