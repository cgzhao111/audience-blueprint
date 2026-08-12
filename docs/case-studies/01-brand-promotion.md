# Case 1: brand promotion

## Purpose and evidence boundary

This case demonstrates a three-layer promotion plan using only the synthetic promotion whitelist. It also includes a second turn that proves an incompletely evidenced model lead cannot be presented as executable.

The input and catalog are synthetic. The expected result below is a Dify acceptance contract, not evidence of audience size, campaign execution, ROI or production-CDP availability.

## Exact input

Start a new Dify Preview conversation and paste:

```text
活动场景：品牌促销
营销目标：提升Running品类转化，输出核心、潜力、扩展三组人群
活动范围：East
活动时间：2026-09-01至2026-09-07
触达渠道：email
核心利益点：synthetic demo coupon
品牌或品类：Running
核心人群使用最近7天至少加购1次的信号；潜力人群使用最近30天至少浏览1次；扩展人群可放宽为最近60天至少浏览1次。
全部人群要求营销许可为granted，排除fraud、employee、opt_out，并排除最近7天已收到至少3次营销消息的人。
```

## Expected primary state

`CONFIRMED_CONFIGURABLE`, provided the strategy and all referenced `TAG_RECORD` blocks are recalled. The answer should contain three audience groups and no capability gap.

The exact prose may vary by model, but these rule invariants must hold:

| Applies to | Use | CF-ID | Operator and value | Window / aggregation |
|---|---|---|---|---|
| Every group | Include | `CF-001` Customer region | `equals` → `East` | none |
| Every group | Include | `CF-009` Preferred category | `equals` → `Running` | none |
| Every group | Include | `CF-011` Marketing consent | `equals` → `granted` | none |
| Every group | Exclude | `CF-012` Suppression reason | `in` → `fraud`, `employee`, `opt_out` | none |
| Every group | Exclude | `CF-017` Marketing message sent | `occurred` → `3` | `last 7 days` / `total_count` |
| Core | Include | `CF-007` Added product to cart | `occurred` → `1` | `last 7 days` / `total_count` |
| Potential | Include | `CF-006` Viewed product | `occurred` → `1` | `last 30 days` / `total_count` |
| Expanded | Include | `CF-006` Viewed product | `occurred` → `1` | `last 60 days` / `total_count` |

`CF-013 = email` is an acceptable additional preference filter, but it must not replace `CF-011 = granted`. `CF-002` is also allowed by the strategy, but the model must not use membership tier to claim purchasing power.

## Dify reproduction steps

1. Complete the shared setup in [`case-studies/README.md`](README.md) and open a new Preview conversation.
2. Paste the exact input above without adding a real brand code, customer identifier or internal CDP field.
3. Confirm that the response reaches the confirmed branch and displays each condition's CF-ID, synthetic path, source and configuration state.
4. Check that all event conditions include both a time window and `total_count` aggregation.
5. Compare the response with the invariant table; extra conditions are acceptable only if their CF-IDs are in the `BRAND_PROMOTION` whitelist and their operators and values are catalog-backed.
6. Record the Dify/model/retrieval details described in the case-study index before treating the run as compatibility evidence.

## Pending-state challenge

In the same conversation, ask:

```text
在核心人群中再增加潮流敏感度分数不低于80的条件，其他条件不变。
```

Expected: `CF-014` Trend affinity score may appear only as `NEEDS_CONFIRMATION`. The overall response must not remain `CONFIRMED_CONFIGURABLE`; it should list the missing model owner/source/version evidence or an equivalent confirmation checklist. The workflow must not invent a production model ID or pretend that the synthetic score is published.

## Acceptance checklist

- [ ] Only `CF-001`, `CF-002`, `CF-006`, `CF-007`, `CF-009`, `CF-011`, `CF-012`, `CF-013`, `CF-014` and `CF-017` can appear.
- [ ] The base turn uses `Running`, which is a catalog enumeration, and does not invent a brand code.
- [ ] Consent and suppression remain distinct governance conditions.
- [ ] The challenge turn treats `CF-014` as pending, never confirmed.
- [ ] The response includes the fixed non-execution statement.

## Claims this case cannot support

This case cannot support claims about audience volume, conversion uplift, coupon performance, a production trend model, live CDP connectivity, automatic segment creation or message delivery.
