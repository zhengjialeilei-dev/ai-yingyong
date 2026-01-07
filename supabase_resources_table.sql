-- ============================================
-- 创建 resources 表
-- 基于代码中的 AppItem 和 mockResources 数据结构
-- ============================================

-- 创建 resources 表
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL,
  grade VARCHAR(20) NOT NULL,
  image_url TEXT NOT NULL,
  description TEXT NOT NULL,
  file_path TEXT, -- 对应 AppItem.file
  route_path TEXT, -- 对应 AppItem.path
  resource_type VARCHAR(20) DEFAULT 'html', -- 对应 AppItem.type (html/react)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);
CREATE INDEX IF NOT EXISTS idx_resources_grade ON resources(grade);
CREATE INDEX IF NOT EXISTS idx_resources_created_at ON resources(created_at DESC);

-- ============================================
-- 插入测试数据（Mock Data）
-- 基于代码中的实际数据
-- ============================================

-- 清除旧数据以避免重复（仅用于开发环境）
TRUNCATE TABLE resources;

-- 插入来自 aiApps 的数据
INSERT INTO resources (title, category, grade, image_url, description, file_path, route_path, resource_type) VALUES
('SVG 扇形统计图', '统计与概率', '六上', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=pie%20chart%20statistics%20visualization%20minimalist&image_size=landscape_4_3', '交互式扇形统计图教学工具', NULL, '/tools/pie-chart', 'react'),
('圆的面积推导', '图形与几何', '六上', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=circle%20area%20derivation%20math%20geometry&image_size=landscape_4_3', '圆的面积公式推导演示', 'ci.HTML', NULL, 'html'),
('奇异博士', '综合实践', '拓展', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=mystic%20magic%20geometry%20mathematics%20art&image_size=landscape_4_3', '趣味数学互动', '奇异博士.html', NULL, 'html'),
('全栈负数教学', '数与代数', '六下', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=negative%20numbers%20math%20education%20concept&image_size=landscape_4_3', '负数概念综合教学', '全栈负数教学SPA整合.HTML', NULL, 'html'),
('随机点名神器', '赋能教学', '通用', 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Picker', '课堂互动随机点名工具', NULL, '/tools/random-picker', 'react'),
('沉浸式倒计时', '赋能教学', '通用', 'https://api.dicebear.com/7.x/shapes/svg?seed=Timer', '大屏沉浸式课堂计时工具', NULL, '/tools/timer', 'react'),
('小组龙虎榜', '赋能教学', '通用', 'https://api.dicebear.com/7.x/notionists/svg?seed=Trophy', '课堂小组竞赛实时计分板', NULL, '/tools/scoreboard', 'react'),
('扇形统计图实验室', '统计与概率', '六上', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=pie%20chart%20statistics%20interactive%20lab&image_size=landscape_4_3', '跨学科数学：扇形统计图实验室', 'AI应用｜扇形统计图.html', NULL, 'html'),
('魔法药水浓度模拟器', '数与代数', '六上', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=magic%20potion%20concentration%20percentage%20lab&image_size=landscape_4_3', '魔法药水浓度模拟器 - 百分数的认识', 'AI应用｜百分数浓度调节.html', NULL, 'html'),
('长方体切割最大正方体', '图形与几何', '五下', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cuboid%20cutting%20cube%20geometry%203d&image_size=landscape_4_3', '长方体切割最大正方体演示', 'AI应用｜长方体切割最大正方体.html', NULL, 'html');

-- 插入来自 mockResources 的数据 (这里假设这些也是 html 或 react 资源，暂时作为 html 处理，或者根据需要在前端处理)
-- 注意：Home.tsx 中的 mockResources 有些没有 file/path，只有 title/subtitle 等。
-- 这里我们假设它们是 placeholder 或者待完善的资源，或者我们需要为它们指定类型。
-- Home.tsx 中 displayResources 渲染逻辑：resource.type === 'react' 才渲染 link，否则 null (第 302 行)。
-- 但是 mockResources 数据里并没有 type 字段。
-- 仔细看 Home.tsx:302 `resource.type === 'react' ? ... : null`
-- 但是 mockResources 定义在 28-45 行，并没有 type 字段。
-- 这意味着 Home.tsx 里的 Bento Grid 其实根本没有渲染 mockResources 里的东西？
-- 等等，`displayResources` 是过滤后的 `mockResources`。
-- `mockResources` 数组里的对象确实没有 `type` 字段。
-- 所以 `resource.type` 是 undefined。 `undefined === 'react'` 是 false。
-- 所以 Home.tsx 里的 Bento Grid 是空的？
-- 让我们再检查一下 Home.tsx。
-- line 59: `count = interactiveApps.length + mockResources.length;`
-- line 301: `displayResources.map(...)`
-- line 302: `resource.type === 'react'`
-- 如果 mockResources 没有 type，那这里肯定渲染不出来。
-- 也许这是一个 bug，或者 user 之前的代码有问题。
-- 不过，既然 user 要我 "build backend"，我可以把这些 mockResources 也存进去，并给它们赋予合适的 type。
-- 暂时把它们标记为 'concept' 或者 'html'，或者如果它们只是展示用的卡片。
-- 为了保持一致性，我将把它们作为 'html' 类型插入，但没有具体的 file_path。

INSERT INTO resources (title, category, grade, image_url, description, resource_type) VALUES
('喝果汁问题', '数与代数', '三年级', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=juice%20cup%20math%20problem%20illustration&image_size=landscape_4_3', '神奇杯组，水和果汁分离', 'html'),
('圆换方、绕圆、旋三角形', '图形与几何', '六年级', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=geometry%20circle%20square%20triangle%20transformation&image_size=landscape_4_3', '圆换圆形形状或切角的动画', 'html'),
('圆们的周长和面积', '图形与几何', '六年级', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=circles%20area%20and%20circumference%20geometry&image_size=landscape_4_3', '大圆内分为若干小圆', 'html'),
('有趣的平衡', '综合实践', '六年级', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=balance%20scale%20math%20experiment&image_size=landscape_4_3', '六下综合实践最后一个内容', 'html'),
('阴影部分的周长', '图形与几何', '六年级', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=geometry%20shaded%20area%20triangle%20sector&image_size=landscape_4_3', '三角形内扇形阴影周长', 'html'),
('长方体盒子剪开', '图形与几何', '三年级', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=unfolding%20rectangular%20box%20geometry&image_size=landscape_4_3', '三上互动剪开长方体盒子', 'html'),
('数与形', '数与代数', '六年级', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=math%20patterns%20numbers%20and%20shapes&image_size=landscape_4_3', '六上数学广角"数与形"', 'html');

-- 验证数据
SELECT * FROM resources ORDER BY created_at DESC;
