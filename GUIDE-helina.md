# 现场操作说明 · Helina

给活动当天看大屏的人。不需要改代码。

## 预览链接 · Preview links

这些是 GitHub Pages 预览，**不会把照片写进正式活动**。

- 演示墙（有样片，可点开看说明和联系方式）  
  Demo wall: https://helinaio.github.io/encountering/wall/?e=mushenzhen-2026&demo=1
- 上传页预览  
  Upload preview: https://helinaio.github.io/encountering/wall/upload/?e=mushenzhen-2026
- 看某一刻正在进行的场次（预览用，时间要写成 `+08:00`）  
  One session: `?now=2026-11-29T15:00:00%2B08:00`  
  Several at once: `?now=2026-12-02T14:30:00%2B08:00`  
  None: `?now=2026-11-28T15:00:00%2B08:00`  
  加在墙或上传页地址后面，例如  
  `https://helinaio.github.io/encountering/wall/?e=mushenzhen-2026&demo=1&now=2026-12-02T14:30:00%2B08:00`

正式站要等 Sunny 部署之后才用：

- 墙 Wall: https://mufriends.mushenzhen.xyz/?e=mushenzhen-2026
- 上传 Upload: https://mufriends.mushenzhen.xyz/upload/?e=mushenzhen-2026

## 现场怎么开大屏 · Open the TV

1. 用电脑浏览器打开正式墙地址（Chrome 或 Edge）。
2. 按 `F11` 全屏。macOS 用浏览器自己的「进入全屏」。
3. 系统设置里把屏幕休眠关掉，或接上电源并选择「永不休眠」。
4. 照片不出来时，先按一次刷新（F5 或 Ctrl/Cmd+R），再看下面的检查清单。
5. 不要关这个浏览器窗口。预览地址和正式地址不要搞混。

## 当前活动名从哪来 · Current event

墙上黑块里的名字来自 sola.day 上 muShenzhen 的公开日程（组 `3mywjlvveoge2`）。

- 此刻只有一场：黑块显示这场的标题。
- 此刻有好几场叠在一起：显示**最晚开始**的那场。上传页的下拉框里能看到全部正在进行的场，也可以改选。
- 此刻没有场：黑块显示 `muShenzhen 2026`。
- 日程暂时读不到：同样显示 `muShenzhen 2026`，上传不受影响。

照片永远进 `mushenzhen-2026` 这一场，不会进 11 月 6 日的旧活动。

## 藏起一张不该上墙的照片 · Hide a photo

1. 在大屏页面按键盘 `M`。
2. 点那张照片角上的 `✕`。
3. 再按一次 `M` 退出。

没有密码。只有现场操作的人按。删掉的是「隐藏」，照片文件还在云端。

## 给别人看效果 · Demo mode

把演示墙链接发给同事即可。它只用仓库里的三张官方海报，**不读、不写**正式照片。点照片可以看说明；有联系方式的，只在放大层里出现。

## 照片不上墙时 · If photos do not appear

按这个顺序看：

1. 手机打开的是不是正式上传页 `mufriends.mushenzhen.xyz/upload/?e=mushenzhen-2026`。预览页会明确说不会写入正式活动。
2. 手机和这台大屏电脑是不是都能上网。会场 Wi‑Fi 有时拦外网。
3. 上传时有没有点「同意 / Agree」。不同意就不会上传。
4. 大屏左下角如果变红，多半是云端暂停了。让 Sunny 到 Supabase 里点 Resume。
5. 等大约 5–10 秒。空墙也会在下一轮轮询里接住第一张新照片。
6. 仍没有：刷新大屏一次。还没有就叫 Sunny。

## 不要做的事 · Do not

- **先不要印上传二维码。** 等 Sunny 部署正式站、你在现场用手机走通一次之后再印。墙上的二维码在部署后会指向正式上传页。
- 同意文案还没有律师定稿。现场先用现在的句子，不要自己改一版印出去。
- 不要把预览链接印到物料上。
- 不要在大屏上随便连点 `M` 和 `✕`。

## 怎么向上游开 PR · Open the upstream PR

代码在 Helina 的 fork：`helinaio/encountering`，分支 `cursor/mushenzhen-2026-photo-wall-8277`。  
要给 `xiaoyug/encountering` 开 PR 时，用浏览器打开：

https://github.com/xiaoyug/encountering/compare/main...helinaio:cursor/mushenzhen-2026-photo-wall-8277?expand=1

然后点 **Create pull request**。base 必须是 `xiaoyug/encountering` 的 `main`，compare 必须是 `helinaio` 的那条分支。不要把代码 push 到 `xiaoyug/yu` 或 `xiaoyug/mufriends-wall`。

## 当天清单 · Day-of checklist

- [ ] Sunny 已部署，正式墙和正式上传页能打开
- [ ] 自己的手机走通：选照片 → 同意 → 大屏在大约 10 秒内出现
- [ ] 不同意时，照片不会上墙
- [ ] 大屏全屏、不休眠
- [ ] 知道 `M` 藏照片
- [ ] 二维码确认指向正式上传页之后，才印刷或投到另一块屏
