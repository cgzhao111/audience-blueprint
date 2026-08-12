# Case 2: dormant-customer recall

## Purpose and evidence boundary

This case demonstrates lifecycle segmentation with explicit recency bands and a synthetic 180-day purchase-count attribute. It is deliberately written so that the workflow does not need to guess the dormant window or historical-value thresholds.

All dates, values and paths are synthetic. A successful run proves reviewable rule generation against the bundled metadata; it does not prove that a real customer is dormant or reachable.

## Exact input

Start a new Dify Preview conversation and paste:

```text
活动场景：休眠召回
营销目标：召回历史顾客，输出核心、潜力、扩展三组人群
活动范围：North
活动时间：2026-09-01至2026-09-30
触达渠道：email
核心利益点：synthetic return offer
核心人群：距上次购买120至180天，并且过去180天完成购买至少2次。
潜力人群：距上次购买120至180天，并且过去180天完成购买正好1次。
扩展人群：距上次购买181至365天，不增加收入或消费能力推断。
全部人群要求营销许可为granted，并排除fraud、employee、opt_out。
```

## Expected primary state

`CONFIRMED_CONFIGURABLE`, provided the strategy and catalog records are recalled. The plan should contain three groups and use the explicit numeric boundaries supplied by the user.

| Applies to | Use | CF-ID | Operator and value | Notes |
|---|---|---|---|---|
| Every group | Include | `CF-001` Customer region | `equals` → `North` | Campaign scope, not residence proof |
| Every group | Include | `CF-011` Marketing consent | `equals` → `granted` | Mandatory eligibility |
| Every group | Exclude | `CF-012` Suppression reason | `in` → `fraud`, `employee`, `opt_out` | OR semantics inside the exclusion set |
| Core | Include | `CF-003` Days since last purchase | `between` → `120`, `180` | Synthetic recency range |
| Core | Include | `CF-004` Purchase count in 180 days | `greater_than_or_equal` → `2` | Historical completed-purchase count |
| Potential | Include | `CF-003` Days since last purchase | `between` → `120`, `180` | Synthetic recency range |
| Potential | Include | `CF-004` Purchase count in 180 days | `equals` → `1` | Historical completed-purchase count |
| Expanded | Include | `CF-003` Days since last purchase | `between` → `181`, `365` | No unsupported value inference |

The dormant strategy does not allow `CF-013`, so the email channel should remain activity context rather than becoming an invented preference condition. `CF-005` may be used only if the user explicitly supplies an amount rule; it must never be described as income.

## Dify reproduction steps

1. Complete the shared setup in [`case-studies/README.md`](README.md) and start a clean Preview conversation.
2. Paste the exact input above.
3. Confirm that the workflow does not ask for additional required slots; all required activity fields are present.
4. Verify that the response contains three groups and preserves the supplied recency/count boundaries rather than generating its own thresholds.
5. Confirm that every displayed CF-ID belongs to the `DORMANT_RECALL` whitelist and that every path and operator comes from the recalled `TAG_RECORD`.
6. Record Dify version, model, retrieval settings and the final result before publishing the run as compatibility evidence.

## Acceptance checklist

- [ ] `CF-003` is used for all dormant ranges.
- [ ] `CF-004` is used only with the explicit 180-day count thresholds.
- [ ] `CF-011` and `CF-012` are present in each outbound group.
- [ ] No income, wealth, lifetime value or predicted purchasing-power field is invented.
- [ ] No order region is treated as residence.
- [ ] The response includes the fixed non-execution statement.

## Claims this case cannot support

This case cannot support claims about the number of dormant customers, deliverability, future spend, income, incremental revenue, production data freshness, automatic segment creation or campaign execution.
