# 小满的 2025 · 照片日记

一个纯静态的照片日记网站。照片按拍摄月份排成一条横向胶片，拖动或滚动即可浏览，点开任意一张可以看日期、地点和说明。

- 在线浏览：<https://demo-0416.github.io/album/>
- 页面源码：[网站/](网站/)

## 照片来源

站点里所有照片的原始出处、作者与授权，见 **[照片来源.md](照片来源.md)**。

照片均来自 Wikimedia Commons，授权为 CC0 或公有领域；页面中显示的拍摄时间与地点是为演示编造的，不是照片的真实信息。

## 目录结构

```
.
├── 网站/              # 网站本体，也是发布到 GitHub Pages 的内容
│   ├── index.html
│   ├── styles.css
│   ├── photos.js      # 照片数据（由构建脚本生成）
│   ├── app.js
│   └── photos/        # 压缩后的 webp 图片及其缩略图
├── 照片来源.md         # 照片出处与授权
├── 关于我.md
└── README.md
```

`原图/`、`参考/`、`截图/` 属于本地素材，已在 `.gitignore` 中排除，不会提交到仓库。

## 本地预览

```bash
cd 网站
python3 -m http.server 8000
```

然后打开 <http://localhost:8000>。

## 发布

GitHub Pages 从 `gh-pages` 分支发布，该分支的内容就是 `网站/` 目录的副本（`index.html` 位于分支根目录）。

`gh-pages` 是一个独立的单提交分支，内容就是 `网站/` 的副本。更新网站后重新发布：

```bash
tree=$(git rev-parse HEAD:网站)
commit=$(git commit-tree "$tree" -m "发布网站")
git branch -f gh-pages "$commit"
git push -f origin gh-pages
```

> 这里没有用 `git subtree`：它对中文目录名会报断言错误。
