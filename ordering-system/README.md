# ordering-system · 全流程点餐系统

单文件 HTML5 SPA 点餐系统，覆盖**完整闭环**：菜单 → 购物车 → 下单 → **支付** → 取餐码 → 订单历史。零依赖、零构建，数据存 localStorage（刷新不丢）。

## 全流程

1. **点餐** `#/menu` — 5 大分类（招牌面/盖饭/小吃/饮品/甜品）、17 道菜、卡片 + 菜品详情弹层（份量/辣度/温度/备注 + 数量）
2. **购物车** `#/cart` — 增删改数量、满减（满100减15 / 满60减8）、优惠码（`NEW10` / `VIP20`）、实时合计
3. **下单** `#/checkout` — 取餐方式三选一（堂食选桌号 / 外带+餐盒费¥1 / 外送地址+满50免配送费）、联系人/手机号/备注，前端校验
4. **支付** `#/pay` — 模拟收银台：微信/支付宝/银行卡/余额；银行卡输卡号/有效期/CVV（格式校验）
5. **支付处理** `#/paying` — 支付动画 → 成功/失败；失败可回上一步换方式重试
6. **完成** `#/success` — **取餐号**、订单号、实付、明细、状态
7. **订单** `#/orders` — 历史订单 + 状态（已接单→制作中→可取餐→完成）+ **状态时间轴**

## 演示支付说明

- 前端模拟收银台，**不接真实网关、不产生真实扣款**
- 卡号 `4000 0000 0000 0002` → 触发**支付失败**（体验重试流程）
- 其他卡号 / 微信 / 支付宝 / 余额 → 支付成功

## 玩法 / 使用

```bash
open index.html               # 直接浏览器打开
# 或
python3 -m http.server 8080   # http://localhost:8080
```

底部购物车条常驻（结算/支付流程中隐藏）；快捷键无依赖，纯点击即可走完全程。

## 结构（单文件 index.html）

- 样式：暗色→亮色主题、响应式三档断点（≤900/≤640/≤420）、卡片/弹层/时间轴
- 数据：`MENU/CATS/SPICE/TEMP/PORTION`、`cart/orders`（localStorage `ods_cart_v1` / `ods_orders_v1`）
- 路由：`route()` 哈希路由，`steps()` 步骤指示器
- 视图：`renderMenu/renderCart/renderCheckout/renderPay/renderPaying/renderSuccess/renderOrders`
- 逻辑：`addToCart/total/validateCheckout/buildOrder/statusInfo`（订单号/取餐号生成、状态模拟）

## 部署

静态页已部署 GitHub Pages：`demo-test/ordering-system/`。