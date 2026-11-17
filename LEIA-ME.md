# Esquenta GTA VI 🌴

Contagem regressiva até 19/11/2026 00:00 (horário de Brasília) + bolão de palpites da galera.

## Como colocar no ar (escolhe UM caminho)

> ⚠️ O "arrastar e soltar" do Netlify (Netlify Drop) NÃO liga o banco de dados.
> O site abre, mas cada um só vê os próprios palpites. Use um dos caminhos abaixo.

### Caminho A: pelo terminal (uns 3 minutos)
Precisa ter o Node.js instalado (nodejs.org).

```bash
cd esquenta-gta
npm install
npx netlify-cli login          # abre o navegador pra entrar na tua conta Netlify
npx netlify-cli deploy --prod  # escolhe "Create & configure a new project"
```
Pronto: ele te devolve o link. O banco (Netlify Blobs) é criado sozinho, sem configurar nada.

### Caminho B: pelo GitHub
1. Cria um repositório no GitHub e sobe esta pasta inteira.
2. No Netlify: **Add new project → Import an existing project → GitHub** → escolhe o repo.
3. Deixa tudo como está (o `netlify.toml` já configura) e clica em **Deploy**.

## Como funciona
- Cada pessoa entra, coloca o nome e crava palpites (com categoria e % de certeza).
- Antes do lançamento: a galera vota 🔥 Concordo / 🧢 Duvido.
- À meia-noite: palpites trancam (ninguém cria nem apaga mais), cai confete e o site vira **Hora da verdade**.
- Depois de jogar: todo mundo marca ✅ Rolou / ❌ Não rolou em cada palpite. Vale a maioria.
- **Ranking dos profetas**: acerto = 10 pts + bônus se o palpite era ousado (pouca certeza ou muita gente duvidando). Errar com muita certeza tira ponto.

## Mudar a data/hora
Está em dois lugares (precisam ser iguais):
- `public/index.html` → `const LAUNCH = ...`
- `netlify/functions/api.mjs` → `const LAUNCH = ...`

## Testar o modo pós-lançamento
Abra o site localmente (sem o banco) com `?lancou=1` no fim do link.
