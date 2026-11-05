# 一座国际机场是如何建成的？

React + TypeScript + Remotion，8个场景、25个镜头、1920×1080、30fps、5400帧、180秒。由原创矢量动画和已验证的Blender模型渲染组成。

当前交付为无配音版，没有音乐，没有调用TTS。`subtitles.zh-CN.editorial.srt`是编辑时间稿，不是实际语音对齐结果。开篇只说明一次虚构案例，之后统一称“新建机场”；无底部说明、秒数及全片进度条。施工段中的甘特图用于解释并行施工，属于内容图表。

## 安装、预览和渲染

需要Node.js 20+、npm、FFmpeg/FFprobe与Chromium。中文字体Noto Sans CJK和许可证已随`public/fonts`提供，不依赖系统字体或外部图床。

```bash
cd airport180
npm ci
npm run typecheck
npm test
npm run studio
npm run render
node scripts/verify-video.mjs
node scripts/check-playback.mjs
```

Studio选择`Airport180`。输出为`renders/airport-180s-1080p.mp4`，编码H.264 / yuv420p / BT.709，包含faststart索引。浏览器路径可用`CHROME_PATH`覆盖，FFmpeg路径可用`FFMPEG_PATH`覆盖。无配音版不保留伪音轨。

```bash
node scripts/stills.mjs
python3 scripts/contact-sheet.py
```

生成25张镜头代表PNG、片头片尾PNG及接触表。`reports/ui-audit.json`在实际截图时测量DOM，检查字体、字幕边界、文字溢出及后续画面无重复机场名字和虚构标注。

## 编辑入口

- `src/scenes/Scene01.tsx`–`Scene08.tsx`：8个独立场景组件。
- `src/config/scene01.json`–`scene08.json`：场景标题、分镜起止、旁白、流程与卡片内容。投资拆分也在scene03配置中。
- `src/config/project.json`：叙事容量及投资设定。当前故事为既有2400万、新机场规划目标6000万人次、示例投资20亿美元。
- `src/config/shots.json`与`captions.json`：由各场景JSON导出，分别驱动全片标题与字幕。
- `src/airport.tsx`：使用工程JSON的绝对米制坐标投影到SVG，不随机布局，不逐场景另造机场。
- `src/VerifiedTests.tsx`：经过验证的合同关系与文件流图。合同使用橙色实线，提交与审查反馈使用不同颜色虚线。
- `public/blender/*.mp4`：复用已验证的总规、BIM分层、碰撞和复位底片；全片字幕和信息图由Remotion叠加。
- `src/data/camera-keyframes.json`：导演数值相机预设；`input`保存原始资料供追溯。
- `narration.zh-CN.md`与SRT：可编辑、可单独交付的旁白与字幕文稿。

修改旁白、镜头时间或流程内容后运行：

```bash
node scripts/export-editorial.mjs
npm test
node scripts/stills.mjs
```

保持8场景与25镜头连续，总长180秒。3D底片已渲染为9/18/5秒，涉及这些镜头时长或几何修改时应先重渲染底片并更新相应Sequence范围，不能只修改字幕。所有运动均由帧数驱动，无CSS无限动画或随机数。

## 工程与导演依据

机场设施的坐标来自用户提供的`airport-project.json`。原始基准的1500万人次元数据保持原样归档；本次用户要求的6000万是叙事规划目标，**没有把一条3200米跑道的简化模型宣称为已验证的6000万容量设计**。模型只表现核心功能分区，不用于设计、净空、容量、消防或适航合规证明。

机场维持空侧→航站楼→陆侧关系，未在跑道及示意进离场范围增加建筑。未提供货运建筑坐标，因此以总体规划内容说明Cargo，未擅自追加货运楼。SVG与Blender均使用原始世界位置；仅视角、显示阶段和可视化材质改变。SVG塔台为圆形截面，建筑高度沿用已验证的展示配置：航站楼90米、塔台100米、停车设施24米、交通中心20米；这些高度只是示意建模选择。

相机的目标点、方位、俯角及缓动来自导演JSON；取景倍率按画幅和安全区修正。已验证的Blender段沿用其校正结果，SVG详细设计入口使用2倍距离，其余SVG段主要使用1.05–1.65倍取景。投影保留连续北向参照，不在同一镜头中突然改“上方向”。机场对象坐标不随取景移动。3D局部切换采用短叠化，BIM爆炸分层后归位并保留已协调桥架路径。

BIM是受控示意子模型，非真实施工图。主场景中可看到结构、建筑、暖通、电气和弱电；给排水、消防、BHS及机场IT在旁白及后续系统图中说明，不虚称已建立完整工程BIM。碰撞示例来自真实网格相交，局部桥架改线、端点不变；状态显示按同一缓动参数更新。复位最后一帧才标记完成。

最后4秒只在跑道JSON中心线的指定直线范围示意加速和抬升，不制作飞机滑行。自动检查只确认示意轨迹的地面投影位于跑道矩形内，不代表真实航行程序或障碍物评估。

## 合同管理表达

主线是业主委托设计的DBB：业主分别与设计顾问、工程师、施工总包签约；工程师与总包之间的提交、审查与反馈不是施工合同。采购/供应合同另行表示。

FIDIC红、黄、银皮书只作为常见模式示例，不能替代具体版本、专用条件、法律及权限约定。主体设计、承包商详图与约定设计责任分开；审查不免除提交方责任。设备品牌按合同、技术规范、制造商资格及授权程序确认，必要时才由业主确认。不符合的资料退回修订，不能默认批准。

ORAT提前筹备并与建设交叉推进；测试、合同接收/移交、监管许可及启用并非同一事项。180秒视频不穷尽缺陷通知期、最终结算和全部法定程序。

## 接入真实中文配音

本次环境未配置TTS密钥。先按旁白稿生成正常语速的中文音频，再按真实音频作句级强制对齐和人工听检。优先调整镜头节奏与字幕，不自动改语速、不裁掉语句。导入脚本不承担语音识别或强制对齐。

```bash
node scripts/import-voice.mjs /path/narration.wav /path/aligned.srt --confirm-aligned
npm test
node scripts/stills.mjs
npm run render
```

脚本检查实测时长、字幕顺序、完整旁白文本和音轨，导入后才启用音频。超过180秒会阻止导入并提示重新安排旁白/动画；不会自动压缩语速。每句内容与画面的对应仍需人工审阅。

## Blender工程

完整ZIP包含`blender/blender/director-master.blend`及建模脚本，源码仓库保留Python脚本和原始JSON。直接打开.blend可检查Collections；动画由Python逐帧驱动，不是全部烘焙到.blend时间轴。

```bash
python3 -m pip install 'Pillow>=10,<13'
bash scripts/rebuild-blender.sh
```

已验证环境为Blender4.3.2、无界面Cycles CPU、3线程、1采样、关闭不可用的OpenImageDenoise。复建机场底片成本明显高于仅重渲染Remotion叠加。修改机场布局必须先重做碰撞及空间检查。

## 检查与导出

`reports/source-checks.json`检查时间轴、投资合计、合同边和固定工程数据；`reports/ui-audit.json`检查真实截图DOM；`renders/verification.json`检查5400帧、180秒、分辨率、全片解码及各场景动态样本；`renders/playback-check.json`记录Chromium实际播放与跳转。`reports/baseline-risk-audit.json`是此前同一Blender主模型的检查结果，作为来源证据保留，不冒充本次完整视频的重新建模验收。
