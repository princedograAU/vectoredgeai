# VectorEdge AI

Marketing site for VectorEdge AI, a small Australian IT consultancy. Built as a static Vite site for [GitHub Pages](https://princedograAU.github.io/vectoredgeai/).

## Local development

Copy `.env.example` to `.env` and paste your Web3Forms access key:

```bash
cp .env.example .env
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173/`).

```bash
npm run build
npm run preview
```

## Deploy

Pushes to `main` build and publish via GitHub Actions (`.github/workflows/deploy.yml`).

In the GitHub repo: **Settings → Pages → Source → GitHub Actions**.

Custom domain can be attached later in the same Pages settings. Do not add a `CNAME` file until that domain is ready.

## Contact form

The inquiry form posts to [Web3Forms](https://web3forms.com/) and is delivered to `vectoredgeai@gmail.com`. Do not commit the access key. Use `VITE_WEB3FORMS_ACCESS_KEY` in a local `.env` file and as the GitHub Actions secret of the same name (repo **Settings → Secrets and variables → Actions**).

In the Web3Forms dashboard, allow the GitHub Pages domain (and later your custom domain) so submissions are not rejected. If a key was ever committed, revoke it in Web3Forms and create a new one.
