#!/usr/bin/env python3
"""MuFriends 照片墙 · 一键导出工具

把 Supabase 里的照片全部下载到本地，并生成一份 index.csv 名单
（昵称 / 留言 / 上传时间 / 文件名）。

用法：
    python3 export-photos.py                # 导出所有照片（含已删除的）到 ./export/
    python3 export-photos.py --live         # 只导出大屏上还在展示的（未删除的）
    python3 export-photos.py -o 我的文件夹   # 指定输出目录

无需安装任何依赖，python3 自带库就够。
"""
import argparse
import csv
import json
import os
import sys
import urllib.request

SUPABASE_URL = "https://kqttuewfmvuuohvqbhel.supabase.co"
ANON_KEY = "sb_publishable_TeAH2DCcPXl2e-MVtwyPOQ_kIEQ79YB"


def fetch_rows(live_only):
    url = SUPABASE_URL + "/rest/v1/photos?select=id,nickname,message,photo_url,deleted,created_at&order=created_at.asc"
    if live_only:
        url += "&deleted=eq.false"
    req = urllib.request.Request(url, headers={
        "apikey": ANON_KEY,
        "Authorization": "Bearer " + ANON_KEY,
    })
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def main():
    ap = argparse.ArgumentParser(description="导出照片墙的全部照片")
    ap.add_argument("--live", action="store_true", help="只导出未删除的照片")
    ap.add_argument("-o", "--out", default="export", help="输出目录（默认 ./export/）")
    args = ap.parse_args()

    rows = fetch_rows(args.live)
    if not rows:
        print("没有找到任何照片。")
        return

    os.makedirs(args.out, exist_ok=True)
    index_path = os.path.join(args.out, "index.csv")
    ok, fail = 0, 0

    with open(index_path, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(["文件名", "昵称", "留言", "上传时间(UTC)", "已删除"])
        for i, row in enumerate(rows, 1):
            url = row.get("photo_url") or ""
            if not url:
                continue
            ext = os.path.splitext(url.split("?")[0])[1] or ".jpg"
            fname = "%03d-%s%s" % (i, row["id"][:8], ext)
            path = os.path.join(args.out, fname)
            try:
                urllib.request.urlretrieve(url, path)
                ok += 1
                print("✓ %s  %s" % (fname, row.get("nickname") or ""))
            except Exception as e:
                fail += 1
                print("✗ %s 下载失败: %s" % (fname, e), file=sys.stderr)
            w.writerow([fname, row.get("nickname") or "", row.get("message") or "",
                        row.get("created_at") or "", "是" if row.get("deleted") else ""])

    print("\n完成：%d 张成功，%d 张失败" % (ok, fail))
    print("照片在 %s/，名单在 %s" % (args.out, index_path))


if __name__ == "__main__":
    main()
