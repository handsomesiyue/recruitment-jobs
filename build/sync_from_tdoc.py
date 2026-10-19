#!/usr/bin/env python3
"""把腾讯文档「招聘信息汇总」智能表记录转换成站点数据文件 data/jobs.json / data/jobs.js。

完整流程（两步）：

  1) 拉取腾讯文档记录（file_id=GvspgdzHikui, sheet_id=t00i2h）。
     注意必须显式指定 TDOC_API_BASE_URL，否则 TLS 握手会失败：

     TDOC_API_BASE_URL=https://docs.qq.com \\
       python <tencent-docs-plugin>/skills/tencent-docs/tencentdocs.py \\
       tdoc_call tencent-docs smartsheet.list_records \\
       '{"file_id":"GvspgdzHikui","sheet_id":"t00i2h"}' > .workbuddy/tdoc_records.json

  2) 生成数据文件：

     python build/sync_from_tdoc.py .workbuddy/tdoc_records.json .

字段映射：公司→company、招聘项目→title、岗位分类→positions、工作城市→locations、
内推码/投递链接→referral_*、投递二维码→qr_code + images、招聘详情→description 等。
旧 jobs.json 里手工维护的 extra_links 会按 (公司, 项目) 回填，不会被覆盖清空。
图片按腾讯文档里的文件名复用 images/ 下已有文件，缺的会打印下载清单（需带 Referer 下载）。
"""
import json
import os
import re
import sys

SPLIT_RE = re.compile(r"[、/／,，]")


def load_records(path):
    d = json.load(open(path, encoding="utf-8"))
    text = d["result"]["content"][0]["text"]
    return json.loads(text)["records"]


def field(rec, name):
    for f in rec.get("field_values", []):
        if f.get("field") == name:
            return f
    return None


def txt(rec, name):
    f = field(rec, name)
    if not f:
        return ""
    return "".join(i.get("text", "") for i in f.get("text_value", {}).get("items", [])).strip()


def opts(rec, name):
    f = field(rec, name)
    if not f:
        return []
    return [i["text"] for i in f.get("option_value", {}).get("items", [])]


def url(rec, name):
    f = field(rec, name)
    if not f:
        return ""
    items = f.get("url_value", {}).get("items", [])
    return items[0].get("link", "") if items else ""


def boolv(rec, name):
    f = field(rec, name)
    if not f:
        return False
    return bool(f.get("bool_value"))


def images(rec, name):
    f = field(rec, name)
    if not f:
        return []
    return f.get("image_value", {}).get("items", [])


def split_locations(raw):
    if not raw:
        return []
    return [p.strip() for p in SPLIT_RE.split(raw) if p.strip()]


def convert(records, images_dir, old_jobs=None):
    """返回 (jobs, 需要下载的图片清单 [(url, 目标相对路径)])

    腾讯文档没有 extra_links 字段，但旧数据里有手填的原文链接等，
    按 (company, title) 回填，避免覆盖时丢信息。
    """
    old_links = {}
    old_ids = {}
    for j in old_jobs or []:
        key = (j.get("company", ""), j.get("title", ""))
        if j.get("extra_links"):
            old_links[key] = j["extra_links"]
        old_ids[key] = j.get("id")

    used_ids = set(old_ids.values())
    next_id = (max(used_ids) + 1) if used_ids else 1

    local = set(os.listdir(images_dir)) if os.path.isdir(images_dir) else set()
    jobs, downloads, reused_id = [], [], 0
    for idx, rec in enumerate(records, start=1):
        imgs = images(rec, "投递二维码")
        qr_path = ""
        gallery = []
        for it in imgs:
            title = (it.get("title") or "").strip()
            remote = it.get("image_url", "")
            if not title:
                continue
            rel = "images/" + title
            # 本地已有同名文件直接复用；否则登记下载
            if title not in local:
                downloads.append((remote, os.path.join(images_dir, title)))
                local.add(title)
            if not qr_path:
                qr_path = rel
            gallery.append(rel)

        key = (txt(rec, "公司"), txt(rec, "招聘项目"))
        # 旧记录沿用原 id，保证既有引用稳定；新记录从不冲突的最小空位顺延
        jid = old_ids.get(key)
        if jid:
            reused_id += 1
        else:
            jid = next_id
            while jid in used_ids:
                jid += 1
            used_ids.add(jid)
            next_id = jid + 1

        jobs.append({
            "id": jid,
            "company": key[0],
            "title": key[1],
            "positions": opts(rec, "岗位分类"),
            "locations": split_locations(txt(rec, "工作城市")),
            "has_hc": boolv(rec, "有HC"),
            "hc_detail": txt(rec, "HC详情"),
            "referral_code": txt(rec, "内推码"),
            "referral_url": url(rec, "投递链接"),
            "description": txt(rec, "招聘详情"),
            "target": txt(rec, "目标人群"),
            # 招聘类型是选项字段，多选时用 "/" 连接（如同时勾选实习与校招）
            "type": "/".join(opts(rec, "招聘类型")),
            "industry": opts(rec, "行业"),
            "tags": opts(rec, "标签"),
            "post_date": txt(rec, "发布时间"),
            "salary": txt(rec, "薪资"),
            "education": txt(rec, "学历要求"),
            "experience": txt(rec, "经验要求"),
            "qr_code": qr_path,
            "images": gallery,
            "extra_links": old_links.get(key, []),
        })
    return jobs, downloads, reused_id, len(old_links)


def main():
    src, repo = sys.argv[1], sys.argv[2]
    records = load_records(src)

    old_path = os.path.join(repo, "data", "jobs.json")
    old_jobs = []
    if os.path.exists(old_path):
        try:
            old_jobs = json.load(open(old_path, encoding="utf-8"))
        except Exception as e:
            print(f"警告: 旧 jobs.json 解析失败({e})，跳过回填", file=sys.stderr)

    jobs, downloads, reused_id, link_src = convert(
        records, os.path.join(repo, "images"), old_jobs
    )

    out_json = os.path.join(repo, "data", "jobs.json")
    out_js = os.path.join(repo, "data", "jobs.js")
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(jobs, f, ensure_ascii=False, indent=2)
    with open(out_js, "w", encoding="utf-8") as f:
        f.write("window.__JOBS_DATA__ = ")
        json.dump(jobs, f, ensure_ascii=False, indent=2)
        f.write("\n;\n")

    print(f"条数: {len(jobs)}  (旧 {len(old_jobs)})")
    print(f"有图: {sum(1 for j in jobs if j['qr_code'])}")
    print(f"沿用旧 id: {reused_id}  回填 extra_links 来源: {link_src}")
    print(f"需下载图片: {len(downloads)}")
    for remote, dest in downloads:
        print(f"  {dest} <- {remote[:80]}")
    print(f"写出: {out_json} / {out_js}")

    # 供下载步骤使用
    with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "downloads.json"), "w", encoding="utf-8") as f:
        json.dump([{"url": u, "dest": d} for u, d in downloads], f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
