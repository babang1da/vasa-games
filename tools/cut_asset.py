#!/usr/bin/env python3
"""Вырезает объект с фото и сохраняет webp с альфой (для игровых ассетов)."""
import sys, os
from PIL import Image, ImageFilter, ImageEnhance
from rembg import remove, new_session

def cut(src, dst, max_side=512, out_side=256, sharpen=True):
    im = Image.open(src).convert("RGB")
    # уменьшаем ДО rembg — иначе на CPU слишком долго
    sc = min(1.0, max_side / max(im.size))
    if sc < 1.0:
        im = im.resize((int(im.size[0]*sc), int(im.size[1]*sc)), Image.LANCZOS)
    sess = new_session("u2net")
    out = remove(im, session=sess)
    a = out.getchannel("A")
    box = a.getbbox()
    if box:
        out = out.crop(box)
    w, h = out.size
    s2 = out_side / max(w, h)
    if s2 < 1.0:
        out = out.resize((max(1, int(w*s2)), max(1, int(h*s2))), Image.LANCZOS)
    if sharpen:
        rgb = ImageEnhance.Contrast(out.convert("RGB")).enhance(1.08)
        rgb = rgb.filter(ImageFilter.UnsharpMask(radius=2, percent=60, threshold=3))
        rgb = Image.merge("RGB", rgb.split())
        rgb.putalpha(out.getchannel("A"))
        out = rgb
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    out.save(dst, "WEBP", quality=88, method=6)
    hist = out.getchannel("A").histogram()
    tot = out.size[0]*out.size[1]
    print("OK %s %s | непрозрачных %.1f%% | %d КБ" % (
        dst, out.size, sum(hist[200:])/tot*100, os.path.getsize(dst)//1024))
    # превью на белом для визуальной проверки
    prev = Image.new("RGB", out.size, (255,255,255))
    prev.paste(out, (0,0), out)
    prev.save(dst.replace(".webp", "_prev.png"))

if __name__ == "__main__":
    src, dst = sys.argv[1], sys.argv[2]
    out_side = int(sys.argv[3]) if len(sys.argv) > 3 else 256
    cut(src, dst, out_side=out_side)
