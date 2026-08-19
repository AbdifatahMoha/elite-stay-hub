FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then \
      echo "ERROR: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in Railway Variables before the Docker build." >&2; \
      exit 1; \
    fi \
 && printf 'VITE_SUPABASE_URL=%s\nVITE_SUPABASE_ANON_KEY=%s\n' "$VITE_SUPABASE_URL" "$VITE_SUPABASE_ANON_KEY" > .env.production \
 && echo "EliteStay: writing Vite production env (url host only)" \
 && node -e "const u=process.env.VITE_SUPABASE_URL||''; try { console.log('VITE_SUPABASE_URL host=', new URL(u).host); } catch { console.log('VITE_SUPABASE_URL invalid'); process.exit(1) } console.log('VITE_SUPABASE_ANON_KEY length=', (process.env.VITE_SUPABASE_ANON_KEY||'').length)"

RUN npm run build

FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0

COPY --from=build /app/.output ./.output

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
