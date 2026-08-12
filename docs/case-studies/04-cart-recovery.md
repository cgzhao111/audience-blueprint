# Case 4: cart recovery

## Purpose and evidence boundary

This case demonstrates same-window inclusion and exclusion for a cart-recovery audience. It is the only case in this folder that also has a deterministic local workflow-core runner.

The local runner validates embedded workflow code and synthetic catalog records. It does not call Dify, an LLM, a CDP or a messaging provider.

## Exact input

Start a new Dify Preview conversation and paste:

```text
活动场景：购物车挽回
营销目标：召回近7天加购未购买用户，只输出1组核心人群
活动范围：East
活动时间：2026-09-01至2026-09-07
触达渠道：email
核心利益点：synthetic reminder
满足最近7天至少加购1次；排除最近7天至少完成购买1次；排除最近7天已收到至少3次营销消息的人。
要求营销许可为granted，并排除fraud、employee、opt_out。
```

## Expected primary state

`CONFIRMED_CONFIGURABLE`, provided the cart-recovery strategy and all six required records are recalled.

| Use | CF-ID | Operator and value | Window / aggregation |
|---|---|---|---|
| Include | `CF-001` Customer region | `equals` → `East` | none |
| Include | `CF-007` Added product to cart | `occurred` → `1` | `last 7 days` / `total_count` |
| Exclude | `CF-016` Completed purchase | `occurred` → `1` | `last 7 days` / `total_count` |
| Include | `CF-011` Marketing consent | `equals` → `granted` | none |
| Exclude | `CF-012` Suppression reason | `in` → `fraud`, `employee`, `opt_out` | none |
| Exclude | `CF-017` Marketing message sent | `occurred` → `3` | `last 7 days` / `total_count` |

The completed-purchase exclusion must use the same seven-day observation window as the cart signal. `CF-013 = email` is allowed as an additional preference filter, but it cannot replace marketing consent.

## Local deterministic reproduction

From the repository root:

```bash
npm install
npm run demo
```

Expected headline:

```text
# Audience Blueprint deterministic workflow-core demo

- Scenario: CART_RECOVERY
- Status: CONFIRMED_CONFIGURABLE
- Confirmed conditions: 6
```

This command runs the same embedded strategy-selection and catalog-validation Python used by the public workflow. See [`docs/DEMO.md`](../DEMO.md) for the exact proof boundary.

## Dify reproduction steps

1. Complete the shared setup in [`case-studies/README.md`](README.md) and start a new Preview conversation.
2. Paste the exact input above.
3. Confirm that the slot extractor preserves the request for one audience group.
4. Verify that both `CF-007` and `CF-016` use `last 7 days` with `total_count`, with one included and the other excluded.
5. Confirm that all displayed paths, operators, values and sources come from the synthetic `TAG_RECORD` blocks.
6. Record the Dify/runtime evidence separately; a passing local demo must not be reported as a passing Dify import.

## Acceptance checklist

- [ ] The result contains one core audience group.
- [ ] `CF-007` is included and `CF-016` is excluded in the same window.
- [ ] `CF-011`, `CF-012` and `CF-017` retain their governance roles.
- [ ] No cart value, inventory, discount conversion rate or audience count is invented.
- [ ] A cart event is not described as a completed purchase or guaranteed intent.
- [ ] The response includes the fixed non-execution statement.

## Claims this case cannot support

This case cannot support claims about cart value, stock, expected conversion, incremental revenue, audience size, actual message delivery, automatic segment creation, Dify-version compatibility or production-CDP connectivity.
