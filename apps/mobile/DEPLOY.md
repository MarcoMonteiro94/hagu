# Deploy Guide - Hagu Mobile

Guia completo para fazer deploy do app Hagu Mobile usando EAS (Expo Application Services).

## Pré-requisitos

1. **Conta Expo**
   - Criar conta em: https://expo.dev
   - Instalar EAS CLI: `npm install -g eas-cli`
   - Login: `eas login`

2. **Credenciais Supabase**
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`

3. **Contas de Desenvolvedor** (para production)
   - Apple Developer Account (iOS)
   - Google Play Console (Android)

## Configuração Inicial

### 1. Configurar Variáveis de Ambiente

Edite o arquivo `eas.json` na raiz do monorepo e adicione suas credenciais:

```json
"env": {
  "EXPO_PUBLIC_SUPABASE_URL": "https://seu-projeto.supabase.co",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY": "sua-chave-anon-aqui"
}
```

**Importante**: Configure isso para cada profile (development, preview, production).

### 2. Verificar Configuração

```bash
# Na raiz do monorepo
cat eas.json

# Verificar app.json
cat apps/mobile/app.json
```

## Perfis de Build

### Development
Build para desenvolvimento com DevClient (permite hot reload e debugging).

```bash
cd apps/mobile
pnpm build:dev
```

### Preview
Build interno para testes (APK/IPA que pode compartilhar com testers).

```bash
# Android e iOS
pnpm build:preview

# Apenas Android
pnpm build:android

# Apenas iOS
pnpm build:ios
```

### Production
Build para as lojas (App Store e Play Store).

```bash
pnpm build:production
```

## Processo de Deploy

### 1. Build Preview (Recomendado para começar)

```bash
# Na pasta apps/mobile
pnpm build:android
```

Isso vai:
1. Criar uma build no servidor EAS
2. Gerar um APK que você pode baixar
3. Fornecer um link para instalar no dispositivo

### 2. Testar o Build

1. Acesse o link fornecido pelo EAS
2. Baixe o APK no seu dispositivo Android
3. Instale e teste todas as funcionalidades
4. Verifique conexão com Supabase

### 3. Build Production

Quando estiver satisfeito com os testes:

```bash
pnpm build:production
```

### 4. Submit para as Lojas

```bash
# Android
eas submit --platform android

# iOS
eas submit --platform ios
```

## Estrutura do Monorepo

O projeto usa pnpm workspaces. O `eas.json` está na raiz e aponta para `apps/mobile`:

```
hagu/
├── eas.json              # Configuração EAS (raiz)
├── apps/
│   └── mobile/
│       ├── app.json      # Configuração Expo
│       ├── package.json  # Scripts de build
│       └── ...
```

## Comandos Úteis

```bash
# Ver builds em andamento
eas build:list

# Ver detalhes de uma build
eas build:view [BUILD_ID]

# Cancelar build
eas build:cancel [BUILD_ID]

# Ver configuração
eas build:configure

# Update OTA (sem rebuild)
eas update --branch production
```

## Troubleshooting

### Erro: "App config not found"
- Verifique se `projectDir` está correto no `eas.json`
- Deve apontar para `apps/mobile`

### Erro: Variáveis de ambiente não encontradas
- Adicione as env vars no `eas.json` em cada profile
- Ou use EAS Secrets: `eas secret:create`

### Build falha com erro de dependências
- Limpe cache: `pnpm clean`
- Reinstale: `pnpm install`
- Tente novamente

### iOS: Erro de certificado
- Configure credenciais: `eas credentials`
- EAS pode gerenciar certificados automaticamente

## EAS Secrets (Recomendado)

Para não expor credenciais no `eas.json`:

```bash
# Criar secrets
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://..."
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "..."

# Listar secrets
eas secret:list

# Remover do eas.json as env vars
# EAS vai usar os secrets automaticamente
```

## Updates OTA (Over-The-Air)

Para atualizar o app sem rebuild:

```bash
# Criar update para branch production
eas update --branch production --message "Fix: corrige bug na tela de login"

# Criar update para branch preview
eas update --branch preview --message "Feature: nova funcionalidade"
```

**Limitações**:
- Apenas código JS/TS
- Não funciona para mudanças em dependências nativas
- Não funciona para mudanças no app.json

## Recursos

- [EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [EAS Submit Docs](https://docs.expo.dev/submit/introduction/)
- [EAS Update Docs](https://docs.expo.dev/eas-update/introduction/)
- [Expo Dashboard](https://expo.dev)
