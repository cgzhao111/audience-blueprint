# Registered without purchase strategy

> 场景代码：`REGISTERED_NO_PURCHASE`
> 知识版本：`audience-blueprint-demo-v1`
> 审核状态：`APPROVED`

## 允许引用的标签

`CF-001`、`CF-002`、`CF-006`、`CF-008`、`CF-011`、`CF-012`

## 核心人群

- 必须满足 `CF-008 = true`。
- 可使用 `CF-006` 识别近期有浏览行为的演示用户。

## 潜力与扩展人群

- 在保持注册未购买条件的前提下，逐步放宽浏览窗口。
- 不得把订单区域用于覆盖从未下单的用户。

## 排除

- 必须满足 `CF-011 = granted`，并排除 `CF-012`。
