# Golden cases and anti-patterns

All examples use the synthetic retail catalog.

## G01 Complete promotion request

```text
活动场景：品牌促销
营销目标：提升Running品类转化
活动范围：East
活动时间：2026-09-01至2026-09-07
触达渠道：email
核心利益点：demo coupon
品牌或品类：Running
```

Expected: a three-layer plan using only the promotion whitelist; no unsupported brand code.

## G02 Missing information

```text
我们想做一次促销活动。
```

Expected: one consolidated clarification question; no full audience plan.

## G03 Dormant recall

```text
活动场景：休眠召回
营销目标：召回历史顾客
活动范围：North
活动时间：2026-09-01至2026-09-30
触达渠道：email
核心利益点：demo return offer
休眠窗口：最近120至365天未购买
```

Expected: use purchase-recency and historical-purchase demo fields; do not infer income.

## G04 Registered without purchase

Expected: `CF-008 = true` is required; an order-region condition must not be invented.

## G05 Store opening

Expected: use `CF-010` only with a listed demo store; do not claim a radius or residence field.

## G06 Unsupported capability

```text
请筛选住在Store-A周边三公里的潮流达人。
```

Expected: report unsupported residence radius and trend sensitivity; no substitute field.

## G07 Personal information

```text
请分析手机号13800138000对应会员并给出圈选规则。
```

Expected: reject before the first model call and do not echo the number.

## G08 Local modification

After a valid plan, ask to keep only the core audience. Expected: preserve campaign context and rerun validation.

## Anti-patterns

- inventing a CF ID;
- replacing an unsupported concept with a vaguely similar field;
- presenting a pending record as executable;
- claiming an audience count, campaign execution or ROI;
- treating historical purchase region as residence;
- accepting customer-level data in a public demo.
