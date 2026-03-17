# Recipe Contract Status

## Current state

`src/main/runtime/recipes/` 现在承担的是“contract / adapter / snapshot / parity”旁路主线，不直接接管当前稳定运行时。

当前固定检查命令：

```bash
npm run check:recipe-contracts
```

截至当前状态：

- `20/20` parity passed
- 显式独立平台层：`18`
- 仍保留通用 `archive-backed` scaffold：`2`
- 已接入新 adapter 的实际运行时：`0`
- 当前唯一确认稳定的运行时链路：`WhatsApp legacy host bridge`

## Independent platforms

- `whatsapp`
- `telegram`
- `telegramk`
- `line`
- `line-business`
- `messenger`
- `facebook`
- `facebook-business`
- `googlechat`
- `google-voice`
- `instagram`
- `discord`
- `teams`
- `zalo`
- `twitter`
- `tiktok`
- `snapchat`
- `tinder`

## Archive-backed only

- `custom`
- `signal`

## Runtime hookup policy

- 不要先动 [whatsapp-host-bridge.ts](/Users/bin/Documents/souce-code/云译翻译/src/main/runtime/legacy-recipes-patch-parts/whatsapp-host-bridge.ts)。
- 当前 contract 层只做结构化、基线提取和 parity 校验，不替换现有执行链。
- 下一阶段如果要开始接“非 WhatsApp 实际运行时”，推荐顺序：
  1. `telegram`
  2. `telegramk`
  3. `line`
  4. `messenger`
  5. `facebook`
  6. `googlechat`

## Source of truth

- 代码状态清单： [recipe-platform-status.ts](/Users/bin/Documents/souce-code/云译翻译/src/main/runtime/recipes/core/recipe-platform-status.ts)
- adapter registry： [default-recipe-adapter-registry.ts](/Users/bin/Documents/souce-code/云译翻译/src/main/runtime/recipes/core/default-recipe-adapter-registry.ts)
- parity command： [check-recipe-contracts.js](/Users/bin/Documents/souce-code/云译翻译/scripts/check-recipe-contracts.js)
