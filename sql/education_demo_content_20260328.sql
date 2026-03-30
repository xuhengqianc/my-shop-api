SET @now_varchar = DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s');
SET @asset_host = 'http://127.0.0.1:8001/education/demo';
SET @demo_video_url = CONCAT(@asset_host, '/math-island-demo.mp4');

INSERT INTO `user_info` (
  `createTime`,
  `updateTime`,
  `tenantId`,
  `unionid`,
  `email`,
  `avatarUrl`,
  `nickName`,
  `phone`,
  `gender`,
  `status`,
  `loginType`,
  `password`,
  `emailVerified`,
  `isDemo`,
  `allUnlocked`,
  `description`
)
SELECT
  @now_varchar,
  @now_varchar,
  NULL,
  'email:student@math-island.local',
  'student@math-island.local',
  NULL,
  '学习账号',
  NULL,
  0,
  1,
  3,
  'e10adc3949ba59abbe56e057f20f883e',
  1,
  0,
  0,
  '默认学习账号，用于测试章节解锁流程'
WHERE NOT EXISTS (
  SELECT 1 FROM `user_info` WHERE `email` = 'student@math-island.local'
);

INSERT INTO `edu_chapter` (
  `createTime`,
  `updateTime`,
  `tenantId`,
  `name`,
  `description`,
  `sort`,
  `thumbnail`,
  `thumbnailType`,
  `visuals`,
  `status`
)
SELECT
  @now_varchar,
  @now_varchar,
  NULL,
  '第1章 数与加减法',
  '通过场景合并和数量比较，理解加法与减法在什么情况下使用。',
  1,
  CONCAT(@asset_host, '/chapter-1-cover.svg'),
  1,
  JSON_ARRAY(
    JSON_OBJECT(
      'title', '数量合并图',
      'url', CONCAT(@asset_host, '/chapter-1-visual.svg'),
      'type', 1,
      'cover', '',
      'description', '把离散的数量重新合并，先观察再列式。'
    ),
    JSON_OBJECT(
      'title', '微课回放',
      'url', @demo_video_url,
      'type', 2,
      'cover', CONCAT(@asset_host, '/chapter-1-cover.svg'),
      'description', '复习“先找已知条件，再决定运算方向”的思路。'
    )
  ),
  1
WHERE NOT EXISTS (
  SELECT 1 FROM `edu_chapter` WHERE `name` = '第1章 数与加减法'
);

INSERT INTO `edu_chapter` (
  `createTime`,
  `updateTime`,
  `tenantId`,
  `name`,
  `description`,
  `sort`,
  `thumbnail`,
  `thumbnailType`,
  `visuals`,
  `status`
)
SELECT
  @now_varchar,
  @now_varchar,
  NULL,
  '第2章 分数与比较',
  '借助切分图与对比图，理解分数的意义以及如何比较大小。',
  2,
  CONCAT(@asset_host, '/chapter-2-cover.svg'),
  1,
  JSON_ARRAY(
    JSON_OBJECT(
      'title', '四等分示意图',
      'url', CONCAT(@asset_host, '/chapter-2-visual.svg'),
      'type', 1,
      'cover', '',
      'description', '先看平均分成几份，再看拿了几份。'
    ),
    JSON_OBJECT(
      'title', '分数动画回放',
      'url', @demo_video_url,
      'type', 2,
      'cover', CONCAT(@asset_host, '/chapter-2-cover.svg'),
      'description', '配合视频，理解同分母分数比较。'
    )
  ),
  1
WHERE NOT EXISTS (
  SELECT 1 FROM `edu_chapter` WHERE `name` = '第2章 分数与比较'
);

INSERT INTO `edu_chapter` (
  `createTime`,
  `updateTime`,
  `tenantId`,
  `name`,
  `description`,
  `sort`,
  `thumbnail`,
  `thumbnailType`,
  `visuals`,
  `status`
)
SELECT
  @now_varchar,
  @now_varchar,
  NULL,
  '第3章 图形面积与拆分',
  '通过切分、平移、拼接，理解面积公式背后的由来。',
  3,
  CONCAT(@asset_host, '/chapter-3-cover.svg'),
  1,
  JSON_ARRAY(
    JSON_OBJECT(
      'title', '图形拆分图',
      'url', CONCAT(@asset_host, '/chapter-3-visual.svg'),
      'type', 1,
      'cover', '',
      'description', '先拆分，再比较新旧图形的面积关系。'
    ),
    JSON_OBJECT(
      'title', '面积推导回放',
      'url', @demo_video_url,
      'type', 2,
      'cover', CONCAT(@asset_host, '/chapter-3-cover.svg'),
      'description', '跟着动画一起复盘面积公式的推导过程。'
    )
  ),
  1
WHERE NOT EXISTS (
  SELECT 1 FROM `edu_chapter` WHERE `name` = '第3章 图形面积与拆分'
);

SET @chapter_1_id = (SELECT `id` FROM `edu_chapter` WHERE `name` = '第1章 数与加减法' LIMIT 1);
SET @chapter_2_id = (SELECT `id` FROM `edu_chapter` WHERE `name` = '第2章 分数与比较' LIMIT 1);
SET @chapter_3_id = (SELECT `id` FROM `edu_chapter` WHERE `name` = '第3章 图形面积与拆分' LIMIT 1);

INSERT INTO `edu_video` (
  `createTime`,
  `updateTime`,
  `tenantId`,
  `chapterId`,
  `title`,
  `videoUrl`,
  `duration`,
  `coverUrl`,
  `status`
)
SELECT
  @now_varchar,
  @now_varchar,
  NULL,
  @chapter_1_id,
  '加减法思路微课',
  @demo_video_url,
  10,
  CONCAT(@asset_host, '/chapter-1-cover.svg'),
  1
WHERE @chapter_1_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM `edu_video` WHERE `chapterId` = @chapter_1_id
  );

INSERT INTO `edu_video` (
  `createTime`,
  `updateTime`,
  `tenantId`,
  `chapterId`,
  `title`,
  `videoUrl`,
  `duration`,
  `coverUrl`,
  `status`
)
SELECT
  @now_varchar,
  @now_varchar,
  NULL,
  @chapter_2_id,
  '分数意义微课',
  @demo_video_url,
  10,
  CONCAT(@asset_host, '/chapter-2-cover.svg'),
  1
WHERE @chapter_2_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM `edu_video` WHERE `chapterId` = @chapter_2_id
  );

INSERT INTO `edu_video` (
  `createTime`,
  `updateTime`,
  `tenantId`,
  `chapterId`,
  `title`,
  `videoUrl`,
  `duration`,
  `coverUrl`,
  `status`
)
SELECT
  @now_varchar,
  @now_varchar,
  NULL,
  @chapter_3_id,
  '面积拆分微课',
  @demo_video_url,
  10,
  CONCAT(@asset_host, '/chapter-3-cover.svg'),
  1
WHERE @chapter_3_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM `edu_video` WHERE `chapterId` = @chapter_3_id
  );

SET @video_1_id = (SELECT `id` FROM `edu_video` WHERE `chapterId` = @chapter_1_id LIMIT 1);
SET @video_2_id = (SELECT `id` FROM `edu_video` WHERE `chapterId` = @chapter_2_id LIMIT 1);
SET @video_3_id = (SELECT `id` FROM `edu_video` WHERE `chapterId` = @chapter_3_id LIMIT 1);

INSERT INTO `edu_video_marker` (`createTime`, `updateTime`, `tenantId`, `videoId`, `title`, `time`, `sort`)
SELECT @now_varchar, @now_varchar, NULL, @video_1_id, '认识已知条件', 0, 0
WHERE @video_1_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM `edu_video_marker` WHERE `videoId` = @video_1_id AND `title` = '认识已知条件');
INSERT INTO `edu_video_marker` (`createTime`, `updateTime`, `tenantId`, `videoId`, `title`, `time`, `sort`)
SELECT @now_varchar, @now_varchar, NULL, @video_1_id, '决定运算方向', 4, 1
WHERE @video_1_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM `edu_video_marker` WHERE `videoId` = @video_1_id AND `title` = '决定运算方向');
INSERT INTO `edu_video_marker` (`createTime`, `updateTime`, `tenantId`, `videoId`, `title`, `time`, `sort`)
SELECT @now_varchar, @now_varchar, NULL, @video_1_id, '检验答案', 8, 2
WHERE @video_1_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM `edu_video_marker` WHERE `videoId` = @video_1_id AND `title` = '检验答案');

INSERT INTO `edu_video_marker` (`createTime`, `updateTime`, `tenantId`, `videoId`, `title`, `time`, `sort`)
SELECT @now_varchar, @now_varchar, NULL, @video_2_id, '平均分成几份', 0, 0
WHERE @video_2_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM `edu_video_marker` WHERE `videoId` = @video_2_id AND `title` = '平均分成几份');
INSERT INTO `edu_video_marker` (`createTime`, `updateTime`, `tenantId`, `videoId`, `title`, `time`, `sort`)
SELECT @now_varchar, @now_varchar, NULL, @video_2_id, '分数大小比较', 4, 1
WHERE @video_2_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM `edu_video_marker` WHERE `videoId` = @video_2_id AND `title` = '分数大小比较');
INSERT INTO `edu_video_marker` (`createTime`, `updateTime`, `tenantId`, `videoId`, `title`, `time`, `sort`)
SELECT @now_varchar, @now_varchar, NULL, @video_2_id, '常见错误提醒', 8, 2
WHERE @video_2_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM `edu_video_marker` WHERE `videoId` = @video_2_id AND `title` = '常见错误提醒');

INSERT INTO `edu_video_marker` (`createTime`, `updateTime`, `tenantId`, `videoId`, `title`, `time`, `sort`)
SELECT @now_varchar, @now_varchar, NULL, @video_3_id, '找底和高', 0, 0
WHERE @video_3_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM `edu_video_marker` WHERE `videoId` = @video_3_id AND `title` = '找底和高');
INSERT INTO `edu_video_marker` (`createTime`, `updateTime`, `tenantId`, `videoId`, `title`, `time`, `sort`)
SELECT @now_varchar, @now_varchar, NULL, @video_3_id, '切分与平移', 4, 1
WHERE @video_3_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM `edu_video_marker` WHERE `videoId` = @video_3_id AND `title` = '切分与平移');
INSERT INTO `edu_video_marker` (`createTime`, `updateTime`, `tenantId`, `videoId`, `title`, `time`, `sort`)
SELECT @now_varchar, @now_varchar, NULL, @video_3_id, '公式复盘', 8, 2
WHERE @video_3_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM `edu_video_marker` WHERE `videoId` = @video_3_id AND `title` = '公式复盘');

INSERT INTO `edu_courseware` (
  `createTime`,
  `updateTime`,
  `tenantId`,
  `chapterId`,
  `title`,
  `fileUrl`,
  `pageCount`,
  `status`
)
SELECT
  @now_varchar,
  @now_varchar,
  NULL,
  @chapter_1_id,
  '数与加减法课件',
  CONCAT(@asset_host, '/chapter-1-courseware.pdf'),
  1,
  1
WHERE @chapter_1_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM `edu_courseware` WHERE `chapterId` = @chapter_1_id
  );

INSERT INTO `edu_courseware` (
  `createTime`,
  `updateTime`,
  `tenantId`,
  `chapterId`,
  `title`,
  `fileUrl`,
  `pageCount`,
  `status`
)
SELECT
  @now_varchar,
  @now_varchar,
  NULL,
  @chapter_2_id,
  '分数与比较课件',
  CONCAT(@asset_host, '/chapter-2-courseware.pdf'),
  1,
  1
WHERE @chapter_2_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM `edu_courseware` WHERE `chapterId` = @chapter_2_id
  );

INSERT INTO `edu_courseware` (
  `createTime`,
  `updateTime`,
  `tenantId`,
  `chapterId`,
  `title`,
  `fileUrl`,
  `pageCount`,
  `status`
)
SELECT
  @now_varchar,
  @now_varchar,
  NULL,
  @chapter_3_id,
  '图形面积与拆分课件',
  CONCAT(@asset_host, '/chapter-3-courseware.pdf'),
  1,
  1
WHERE @chapter_3_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM `edu_courseware` WHERE `chapterId` = @chapter_3_id
  );

INSERT INTO `edu_question_category` (`createTime`, `updateTime`, `tenantId`, `name`, `sort`, `status`)
SELECT @now_varchar, @now_varchar, NULL, '数与运算', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM `edu_question_category` WHERE `name` = '数与运算');

INSERT INTO `edu_question_category` (`createTime`, `updateTime`, `tenantId`, `name`, `sort`, `status`)
SELECT @now_varchar, @now_varchar, NULL, '分数理解', 2, 1
WHERE NOT EXISTS (SELECT 1 FROM `edu_question_category` WHERE `name` = '分数理解');

INSERT INTO `edu_question_category` (`createTime`, `updateTime`, `tenantId`, `name`, `sort`, `status`)
SELECT @now_varchar, @now_varchar, NULL, '图形面积', 3, 1
WHERE NOT EXISTS (SELECT 1 FROM `edu_question_category` WHERE `name` = '图形面积');

SET @cat_1_id = (SELECT `id` FROM `edu_question_category` WHERE `name` = '数与运算' LIMIT 1);
SET @cat_2_id = (SELECT `id` FROM `edu_question_category` WHERE `name` = '分数理解' LIMIT 1);
SET @cat_3_id = (SELECT `id` FROM `edu_question_category` WHERE `name` = '图形面积' LIMIT 1);

INSERT INTO `edu_question` (
  `createTime`, `updateTime`, `tenantId`, `categoryId`, `type`, `title`, `content`, `options`, `answer`, `analysis`, `difficulty`, `status`
)
SELECT
  @now_varchar, @now_varchar, NULL, @cat_1_id, 1,
  '妈妈买了 3 个苹果，又买了 2 个苹果，一共有多少个苹果？',
  '先找出“原来有多少”和“又增加了多少”。',
  JSON_ARRAY(
    JSON_OBJECT('label', 'A', 'value', '4'),
    JSON_OBJECT('label', 'B', 'value', '5'),
    JSON_OBJECT('label', 'C', 'value', '6')
  ),
  'B',
  '把 3 和 2 合并，列式 3+2=5。',
  1,
  1
WHERE @cat_1_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM `edu_question` WHERE `title` = '妈妈买了 3 个苹果，又买了 2 个苹果，一共有多少个苹果？'
  );

INSERT INTO `edu_question` (
  `createTime`, `updateTime`, `tenantId`, `categoryId`, `type`, `title`, `content`, `options`, `answer`, `analysis`, `difficulty`, `status`
)
SELECT
  @now_varchar, @now_varchar, NULL, @cat_1_id, 4,
  '盒子里原来有 8 支铅笔，用掉了 3 支，还剩多少支？',
  '想一想这是“合并”还是“减少”。',
  JSON_ARRAY(),
  '5',
  '从总数里去掉用掉的部分，8-3=5。',
  1,
  1
WHERE @cat_1_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM `edu_question` WHERE `title` = '盒子里原来有 8 支铅笔，用掉了 3 支，还剩多少支？'
  );

INSERT INTO `edu_question` (
  `createTime`, `updateTime`, `tenantId`, `categoryId`, `type`, `title`, `content`, `options`, `answer`, `analysis`, `difficulty`, `status`
)
SELECT
  @now_varchar, @now_varchar, NULL, @cat_2_id, 1,
  '把一个圆平均分成 4 份，涂了其中 1 份，应该写成哪个分数？',
  '分母表示平均分成几份，分子表示取了几份。',
  JSON_ARRAY(
    JSON_OBJECT('label', 'A', 'value', '1/2'),
    JSON_OBJECT('label', 'B', 'value', '1/3'),
    JSON_OBJECT('label', 'C', 'value', '1/4')
  ),
  'C',
  '平均分成 4 份，取 1 份，所以是 1/4。',
  1,
  1
WHERE @cat_2_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM `edu_question` WHERE `title` = '把一个圆平均分成 4 份，涂了其中 1 份，应该写成哪个分数？'
  );

INSERT INTO `edu_question` (
  `createTime`, `updateTime`, `tenantId`, `categoryId`, `type`, `title`, `content`, `options`, `answer`, `analysis`, `difficulty`, `status`
)
SELECT
  @now_varchar, @now_varchar, NULL, @cat_2_id, 3,
  '同分母分数比较大小时，分子越大，分数越大。',
  '回忆一下：当“份数一样多”时，谁拿得更多谁更大。',
  JSON_ARRAY(),
  'true',
  '分母相同表示每份一样大，分子大的拿得份数更多，所以分数更大。',
  2,
  1
WHERE @cat_2_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM `edu_question` WHERE `title` = '同分母分数比较大小时，分子越大，分数越大。'
  );

INSERT INTO `edu_question` (
  `createTime`, `updateTime`, `tenantId`, `categoryId`, `type`, `title`, `content`, `options`, `answer`, `analysis`, `difficulty`, `status`
)
SELECT
  @now_varchar, @now_varchar, NULL, @cat_3_id, 1,
  '一个长方形长 6 厘米，宽 4 厘米，它的面积是多少平方厘米？',
  '先找面积公式，再代入长和宽。',
  JSON_ARRAY(
    JSON_OBJECT('label', 'A', 'value', '10'),
    JSON_OBJECT('label', 'B', 'value', '20'),
    JSON_OBJECT('label', 'C', 'value', '24')
  ),
  'C',
  '长方形面积 = 长 × 宽，所以是 6×4=24。',
  1,
  1
WHERE @cat_3_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM `edu_question` WHERE `title` = '一个长方形长 6 厘米，宽 4 厘米，它的面积是多少平方厘米？'
  );

INSERT INTO `edu_question` (
  `createTime`, `updateTime`, `tenantId`, `categoryId`, `type`, `title`, `content`, `options`, `answer`, `analysis`, `difficulty`, `status`
)
SELECT
  @now_varchar, @now_varchar, NULL, @cat_3_id, 5,
  '为什么把平行四边形剪开再平移，面积不会变？',
  '可以从“面积是由整个平面覆盖范围决定的”这个角度思考。',
  JSON_ARRAY(),
  '覆盖的平面大小没有变',
  '虽然形状位置变了，但拼接前后覆盖的总面积没有变化，所以面积保持不变。',
  2,
  1
WHERE @cat_3_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM `edu_question` WHERE `title` = '为什么把平行四边形剪开再平移，面积不会变？'
  );

SET @q11_id = (SELECT `id` FROM `edu_question` WHERE `title` = '妈妈买了 3 个苹果，又买了 2 个苹果，一共有多少个苹果？' LIMIT 1);
SET @q12_id = (SELECT `id` FROM `edu_question` WHERE `title` = '盒子里原来有 8 支铅笔，用掉了 3 支，还剩多少支？' LIMIT 1);
SET @q21_id = (SELECT `id` FROM `edu_question` WHERE `title` = '把一个圆平均分成 4 份，涂了其中 1 份，应该写成哪个分数？' LIMIT 1);
SET @q22_id = (SELECT `id` FROM `edu_question` WHERE `title` = '同分母分数比较大小时，分子越大，分数越大。' LIMIT 1);
SET @q31_id = (SELECT `id` FROM `edu_question` WHERE `title` = '一个长方形长 6 厘米，宽 4 厘米，它的面积是多少平方厘米？' LIMIT 1);
SET @q32_id = (SELECT `id` FROM `edu_question` WHERE `title` = '为什么把平行四边形剪开再平移，面积不会变？' LIMIT 1);

INSERT INTO `edu_chapter_exam` (`createTime`, `updateTime`, `tenantId`, `chapterId`, `questionId`, `sort`)
SELECT @now_varchar, @now_varchar, NULL, @chapter_1_id, @q11_id, 0
WHERE @chapter_1_id IS NOT NULL AND @q11_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM `edu_chapter_exam` WHERE `chapterId` = @chapter_1_id AND `questionId` = @q11_id);
INSERT INTO `edu_chapter_exam` (`createTime`, `updateTime`, `tenantId`, `chapterId`, `questionId`, `sort`)
SELECT @now_varchar, @now_varchar, NULL, @chapter_1_id, @q12_id, 1
WHERE @chapter_1_id IS NOT NULL AND @q12_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM `edu_chapter_exam` WHERE `chapterId` = @chapter_1_id AND `questionId` = @q12_id);

INSERT INTO `edu_chapter_exam` (`createTime`, `updateTime`, `tenantId`, `chapterId`, `questionId`, `sort`)
SELECT @now_varchar, @now_varchar, NULL, @chapter_2_id, @q21_id, 0
WHERE @chapter_2_id IS NOT NULL AND @q21_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM `edu_chapter_exam` WHERE `chapterId` = @chapter_2_id AND `questionId` = @q21_id);
INSERT INTO `edu_chapter_exam` (`createTime`, `updateTime`, `tenantId`, `chapterId`, `questionId`, `sort`)
SELECT @now_varchar, @now_varchar, NULL, @chapter_2_id, @q22_id, 1
WHERE @chapter_2_id IS NOT NULL AND @q22_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM `edu_chapter_exam` WHERE `chapterId` = @chapter_2_id AND `questionId` = @q22_id);

INSERT INTO `edu_chapter_exam` (`createTime`, `updateTime`, `tenantId`, `chapterId`, `questionId`, `sort`)
SELECT @now_varchar, @now_varchar, NULL, @chapter_3_id, @q31_id, 0
WHERE @chapter_3_id IS NOT NULL AND @q31_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM `edu_chapter_exam` WHERE `chapterId` = @chapter_3_id AND `questionId` = @q31_id);
INSERT INTO `edu_chapter_exam` (`createTime`, `updateTime`, `tenantId`, `chapterId`, `questionId`, `sort`)
SELECT @now_varchar, @now_varchar, NULL, @chapter_3_id, @q32_id, 1
WHERE @chapter_3_id IS NOT NULL AND @q32_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM `edu_chapter_exam` WHERE `chapterId` = @chapter_3_id AND `questionId` = @q32_id);
