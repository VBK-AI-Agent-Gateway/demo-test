#!/usr/bin/env python3
"""任务看板 E2E 验收：真实后端 + Playwright（非 mock）。

流程：
  1. 启动真实后端 server.js（子进程，同端口同时托管静态页与 /api）
  2. Playwright 同源访问，跑通：
     登录 / 表单校验 / 错误提示 / 注册建账号 / 项目空态 / 建项目 /
     任务空态 / 建任务 / 任务改状态(待办->进行中->已完成) / 基本可访问性

运行：python3 tests/e2e/e2e_test.py   （退出码 0 = 全部通过）
前置：先执行 npm run build 生成 dist/
"""
import os
import subprocess
import sys
import time
import urllib.request

from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))) if "__file__" in globals() else os.getcwd()
API = 8791
APIU = "http://127.0.0.1:%d" % API

results = []


def ck(name, cond, detail=""):
    results.append((name, bool(cond)))
    print(("PASS " if cond else "FAIL ") + name +
          ((" | " + str(detail)) if (detail and not cond) else ""))


def start_backend():
    env = dict(os.environ, PORT=str(API),
               DB_FILE=os.path.join(HERE, "e2e_data.json"))
    env.setdefault("SERVE_DIR", os.path.join(HERE, "dist"))
    if os.path.exists(env["DB_FILE"]):
        os.remove(env["DB_FILE"])
    proc = subprocess.Popen(["node", os.path.join(HERE, "src", "server.js")],
                            env=env, cwd=HERE,
                            stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    for _ in range(50):
        try:
            urllib.request.urlopen(APIU + "/api/health", timeout=0.5).read()
            return proc
        except Exception:
            time.sleep(0.1)
    proc.kill()
    raise RuntimeError("backend did not start")


def main():
    backend = start_backend()
    ts = int(time.time())
    user, pw = "e2e_%d" % ts, "e2e_pass_123"
    proj = "验收项目-%d" % ts
    task = "写首页 Hero 区块"

    with sync_playwright() as p:
        br = p.chromium.launch()
        pg = br.new_page()
        pg.goto(APIU + "/")

        # 可访问性
        ck("登录表单 label 存在", pg.locator("label[for='login-user']").count() == 1)
        ck("错误区 aria-live 存在", pg.locator("#login-user-err[aria-live='polite']").count() == 1)

        # 表单校验：空提交
        pg.click("#btn-login")
        ck("空表单被拦截并提示", "必填" in pg.inner_text("#login-user-err"))
        ck("空表单标记 aria-invalid", pg.get_attribute("#login-user", "aria-invalid") == "true")

        # 错误提示：错误密码
        pg.fill("#login-user", user)
        pg.fill("#login-pass", "wrongpass")
        pg.click("#btn-login")
        pg.wait_for_selector("#login-banner:not(.hidden)", timeout=3000)
        ck("错误密码显示失败横幅", "登录失败" in pg.inner_text("#login-banner"))

        # 注册新账号并进入主界面
        pg.fill("#reg-user", user)
        pg.fill("#reg-pass", pw)
        pg.click("#btn-register")
        pg.wait_for_selector("#view-app:not(.hidden)", timeout=5000)
        ck("注册并进入主界面", True)

        # 加载结束 -> 项目空态
        pg.wait_for_selector("#projects-empty:not(.hidden)", timeout=4000)
        ck("项目空状态可见", pg.locator("#projects-empty").is_visible())

        # 建项目
        pg.fill("#proj-name", proj)
        pg.click("#btn-create-project")
        pg.wait_for_selector("#project-list li", timeout=3000)
        ck("创建项目出现在列表", pg.locator("#project-list li", has_text=proj).count() >= 1)

        pg.locator("#project-list li", has_text=proj).first.click()
        pg.wait_for_selector("#board-card", timeout=3000)
        ck("看板卡片显示", pg.locator("#board-card").is_visible())

        # 任务空态
        pg.wait_for_selector("#tasks-empty:not(.hidden)", timeout=4000)
        ck("任务空状态可见", pg.locator("#tasks-empty").is_visible())

        # 表单校验：任务标题过短
        pg.fill("#task-title", "a")
        pg.click("#btn-create-task")
        ck("任务标题过短被拦截", "至少" in pg.inner_text("#task-title-err"))

        # 建任务
        pg.fill("#task-title", task)
        pg.select_option("#task-status", "todo")
        pg.click("#btn-create-task")
        pg.wait_for_selector(".task", timeout=3000)
        ck("创建任务出现在看板", pg.locator(".task", has_text=task).count() == 1)
        ck("任务落在待办列", task in pg.locator(".col", has_text="待办").inner_text())

        # 改状态: 待办 -> 进行中
        mv = pg.get_by_role("button", name="将任务「%s」改为进行中" % task)
        mv.wait_for(timeout=3000)
        mv.click()
        pg.wait_for_function(
            "t=>[...document.querySelectorAll('.col')].some(c=>c.innerText.includes('进行中')&&c.innerText.includes(t))",
            arg=task, timeout=3000)
        ck("任务移动到进行中列", task in pg.locator(".col", has_text="进行中").inner_text())

        # 改状态: 进行中 -> 已完成
        dn = pg.get_by_role("button", name="将任务「%s」改为已完成" % task)
        dn.wait_for(timeout=3000)
        dn.click()
        pg.wait_for_function(
            "t=>[...document.querySelectorAll('.col')].some(c=>c.innerText.includes('已完成')&&c.innerText.includes(t))",
            arg=task, timeout=3000)
        ck("任务移动到已完成列", task in pg.locator(".col", has_text="已完成").inner_text())

        br.close()

    backend.terminate()
    failed = [n for n, ok in results if not ok]
    print("\n==== 结果 %d/%d 通过 ====" % (len(results) - len(failed), len(results)))
    if failed:
        for n in failed:
            print("  FAILED:", n)
        sys.exit(1)
    print("ALL PASS")


if __name__ == "__main__":
    main()