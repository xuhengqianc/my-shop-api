SET @now_varchar = DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s');

ALTER TABLE `user_info`
  ADD COLUMN `email` varchar(255) NULL COMMENT '邮箱' AFTER `unionid`,
  ADD COLUMN `emailVerified` int NOT NULL DEFAULT 0 COMMENT '邮箱是否已验证 0-未验证 1-已验证' AFTER `password`,
  ADD COLUMN `isDemo` int NOT NULL DEFAULT 0 COMMENT '是否为演示账号 0-否 1-是' AFTER `emailVerified`,
  ADD COLUMN `allUnlocked` int NOT NULL DEFAULT 0 COMMENT '是否解锁全部章节 0-否 1-是' AFTER `isDemo`;

ALTER TABLE `edu_chapter`
  ADD COLUMN `visuals` json NULL COMMENT '章节可视化内容' AFTER `thumbnailType`;

CREATE UNIQUE INDEX `IDX_user_info_email` ON `user_info` (`email`);

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
  'email:demo@math-island.local',
  'demo@math-island.local',
  NULL,
  '演示账号',
  NULL,
  0,
  1,
  3,
  'e10adc3949ba59abbe56e057f20f883e',
  1,
  1,
  1,
  '默认演示账号，登录后解锁全部章节'
WHERE NOT EXISTS (
  SELECT 1 FROM `user_info` WHERE `email` = 'demo@math-island.local'
);

INSERT INTO `edu_ai_prompt` (`createTime`, `updateTime`, `tenantId`, `name`, `type`, `prompt`, `status`)
SELECT
  NOW(),
  NOW(),
  NULL,
  '默认学习助教',
  'chat',
  '你是一个面向 10-14 岁学生的数学助教。严禁直接给出最终答案。必须先复述题目线索，再提出 2-3 个循序渐进的引导问题，鼓励学生自己推理。',
  1
WHERE NOT EXISTS (
  SELECT 1 FROM `edu_ai_prompt` WHERE `type` = 'chat'
);

INSERT INTO `edu_ai_prompt` (`createTime`, `updateTime`, `tenantId`, `name`, `type`, `prompt`, `status`)
SELECT
  NOW(),
  NOW(),
  NULL,
  '默认测试辅导',
  'exam',
  '你正在辅导章末测试。不能直接提供答案，只能提示关键条件、公式方向、可能的错误点，并用苏格拉底式提问推动学生继续思考。',
  1
WHERE NOT EXISTS (
  SELECT 1 FROM `edu_ai_prompt` WHERE `type` = 'exam'
);

INSERT INTO `base_sys_menu` (
  `createTime`,
  `updateTime`,
  `tenantId`,
  `parentId`,
  `name`,
  `router`,
  `perms`,
  `type`,
  `icon`,
  `orderNum`,
  `viewPath`,
  `keepAlive`,
  `isShow`
)
SELECT
  @now_varchar,
  @now_varchar,
  NULL,
  NULL,
  '教育中心',
  NULL,
  NULL,
  0,
  'icon-component',
  2,
  NULL,
  1,
  1
WHERE NOT EXISTS (
  SELECT 1 FROM `base_sys_menu` WHERE `name` = '教育中心' AND `parentId` IS NULL
);

SET @edu_root_id = (
  SELECT `id`
  FROM `base_sys_menu`
  WHERE `name` = '教育中心' AND `parentId` IS NULL
  LIMIT 1
);

INSERT INTO `base_sys_menu` (`createTime`, `updateTime`, `tenantId`, `parentId`, `name`, `router`, `perms`, `type`, `icon`, `orderNum`, `viewPath`, `keepAlive`, `isShow`)
SELECT @now_varchar, @now_varchar, NULL, @edu_root_id, '章节管理', '/chapter/list', NULL, 1, 'icon-component', 1, 'modules/chapter/views/index.vue', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM `base_sys_menu` WHERE `router` = '/chapter/list');

INSERT INTO `base_sys_menu` (`createTime`, `updateTime`, `tenantId`, `parentId`, `name`, `router`, `perms`, `type`, `icon`, `orderNum`, `viewPath`, `keepAlive`, `isShow`)
SELECT @now_varchar, @now_varchar, NULL, @edu_root_id, '视频管理', '/video/list', NULL, 1, 'icon-component', 2, 'modules/video/views/index.vue', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM `base_sys_menu` WHERE `router` = '/video/list');

INSERT INTO `base_sys_menu` (`createTime`, `updateTime`, `tenantId`, `parentId`, `name`, `router`, `perms`, `type`, `icon`, `orderNum`, `viewPath`, `keepAlive`, `isShow`)
SELECT @now_varchar, @now_varchar, NULL, @edu_root_id, '课件管理', '/courseware/list', NULL, 1, 'icon-component', 3, 'modules/courseware/views/index.vue', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM `base_sys_menu` WHERE `router` = '/courseware/list');

INSERT INTO `base_sys_menu` (`createTime`, `updateTime`, `tenantId`, `parentId`, `name`, `router`, `perms`, `type`, `icon`, `orderNum`, `viewPath`, `keepAlive`, `isShow`)
SELECT @now_varchar, @now_varchar, NULL, @edu_root_id, '题库管理', '/exam/list', NULL, 1, 'icon-component', 4, 'modules/exam/views/index.vue', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM `base_sys_menu` WHERE `router` = '/exam/list');

INSERT INTO `base_sys_menu` (`createTime`, `updateTime`, `tenantId`, `parentId`, `name`, `router`, `perms`, `type`, `icon`, `orderNum`, `viewPath`, `keepAlive`, `isShow`)
SELECT @now_varchar, @now_varchar, NULL, @edu_root_id, 'AI配置', '/ai/config', NULL, 1, 'icon-component', 5, 'modules/ai/views/index.vue', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM `base_sys_menu` WHERE `router` = '/ai/config');

UPDATE `base_sys_menu`
SET `isShow` = 0, `updateTime` = @now_varchar
WHERE `id` IN (70, 94, 105, 120);
