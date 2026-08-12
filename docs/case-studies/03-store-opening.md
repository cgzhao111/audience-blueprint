# Case 3: store opening

## Purpose and evidence boundary

This case demonstrates a store-opening plan based on a synthetic nearest-store assignment. A second turn tests the critical boundary between "nearest demo store" and an unsupported claim about a person's residence within a precise radius.

`Store-A` is fictional. `CF-010` is not geolocation evidence and cannot prove distance or residence.

## Exact input

Start a new Dify Preview conversation and paste:

```text
活动场景：门店开业
营销目标：为Store-A开业引流，输出核心、潜力、扩展三组人群
活动范围：East
活动时间：2026-09-10至2026-09-17
触达渠道：email
核心利益点：synthetic opening offer
目标门店：Store-A
核心人群使用最近7天至少加购1次；潜力人群使用最近30天至少浏览1次；扩展人群可放宽为最近60天至少浏览1次。
只使用“Nearest demo store = Store-A”，不要把它解释为居住距离。
全部人群要求营销许可为granted，排除fraud、employee、opt_out，并排除最近7天已收到至少3次营销消息的人。
```

## Expected primary state

`CONFIRMED_CONFIGURABLE`, provided the required strategy and catalog records are recalled.

| Applies to | Use | CF-ID | Operator and value | Window / aggregation |
|---|---|---|---|---|
| Every group | Include | `CF-001` Customer region | `equals` → `East` | none |
| Every group | Include | `CF-010` Nearest demo store | `equals` → `Store-A` | none |
| Every group | Include | `CF-011` Marketing consent | `equals` → `granted` | none |
| Every group | Exclude | `CF-012` Suppression reason | `in` → `fraud`, `employee`, `opt_out` | none |
| Every group | Exclude | `CF-017` Marketing message sent | `occurred` → `3` | `last 7 days` / `total_count` |
| Core | Include | `CF-007` Added product to cart | `occurred` → `1` | `last 7 days` / `total_count` |
| Potential | Include | `CF-006` Viewed product | `occurred` → `1` | `last 30 days` / `total_count` |
| Expanded | Include | `CF-006` Viewed product | `occurred` → `1` | `last 60 days` / `total_count` |

`CF-013 = email` is an acceptable preference filter, but consent remains mandatory. The response must describe `CF-010` as a synthetic nearest-store assignment, not as a GPS, address or residence field.

## Dify reproduction steps

1. Complete the shared setup in [`case-studies/README.md`](README.md) and start a clean Preview conversation.
2. Paste the exact input above.
3. Confirm that the response uses only the enumerated value `Store-A` and reaches the confirmed branch.
4. Verify that each event condition has its explicit window and `total_count` aggregation.
5. Check the displayed configuration path for `CF-010`: `Demo CDP / Store relation / Nearest store`.
6. Run the boundary challenge below in the same conversation and verify that the existing store assignment is not reinterpreted as residence evidence.

## Unsupported-radius challenge

Ask:

```text
把核心人群改成居住在Store-A周边3公里的人，不能使用Nearest demo store作为代理，其他条件保持不变。
```

Required result:

- `CF-015` Residence within store radius is treated as `UNSUPPORTED` and shown as a capability gap;
- `CF-010` is not substituted for the radius request;
- no address, GPS coordinate, distance calculation or production path is invented;
- the overall response must not be `CONFIRMED_CONFIGURABLE` for the radius requirement.

Depending on whether the model retains other valid conditions, the overall workflow response may be `NEEDS_CONFIRMATION`; if no valid audience remains, it may be `UNSUPPORTED` and the previous valid plan is kept. The invariant is the unsupported state of the radius capability, not model-specific wording.

## Acceptance checklist

- [ ] The base turn uses the catalog enumeration `Store-A`.
- [ ] `CF-010` is never described as precise distance or residence.
- [ ] The challenge surfaces `CF-015` and does not create a proxy.
- [ ] Consent, suppression and explicit contact-pressure rules remain separate.
- [ ] No real store, address or customer data is present.
- [ ] The response includes the fixed non-execution statement.

## Claims this case cannot support

This case cannot support claims about footfall, store catchment, household residence, travel distance, GPS location, audience size, message delivery, automatic segment creation or production-CDP compatibility.
