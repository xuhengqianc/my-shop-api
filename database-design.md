# 教育平台数据库设计

## 1. 章节表 (edu_chapter)

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | bigint | 主键 | 自增 |
| name | varchar(100) | 章节名称 | 必填 |
| description | text | 章节描述 | 可选 |
| sort | int | 排序 | 数字越小越靠前 |
| thumbnail | varchar(500) | 缩略图URL | 可视化图片 |
| thumbnail_type | tinyint | 缩略图类型 | 1-图片 2-视频 |
| status | tinyint | 状态 | 0-禁用 1-启用 |
| create_time | datetime | 创建时间 | |
| update_time | datetime | 更新时间 | |

## 2. 视频表 (edu_video)

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | bigint | 主键 | 自增 |
| chapter_id | bigint | 章节ID | 外键 |
| title | varchar(200) | 视频标题 | |
| video_url | varchar(500) | 视频URL | |
| duration | int | 视频时长 | 秒 |
| cover_url | varchar(500) | 封面图 | |
| status | tinyint | 状态 | 0-禁用 1-启用 |
| create_time | datetime | 创建时间 | |
| update_time | datetime | 更新时间 | |

## 3. 视频时间标记表 (edu_video_marker)

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | bigint | 主键 | 自增 |
| video_id | bigint | 视频ID | 外键 |
| title | varchar(100) | 标记标题 | 小标题 |
| time | int | 时间点 | 秒 |
| sort | int | 排序 | |
| create_time | datetime | 创建时间 | |

## 4. 课件表 (edu_courseware)

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | bigint | 主键 | 自增 |
| chapter_id | bigint | 章节ID | 外键 |
| title | varchar(200) | 课件标题 | |
| file_url | varchar(500) | PDF文件URL | |
| page_count | int | 页数 | |
| status | tinyint | 状态 | 0-禁用 1-启用 |
| create_time | datetime | 创建时间 | |
| update_time | datetime | 更新时间 | |

## 5. 题库分类表 (edu_question_category)

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | bigint | 主键 | 自增 |
| name | varchar(100) | 分类名称 | |
| sort | int | 排序 | |
| status | tinyint | 状态 | 0-禁用 1-启用 |
| create_time | datetime | 创建时间 | |
| update_time | datetime | 更新时间 | |

## 6. 题目表 (edu_question)

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | bigint | 主键 | 自增 |
| category_id | bigint | 分类ID | 外键 |
| type | tinyint | 题目类型 | 1-单选 2-多选 3-判断 4-填空 5-简答 |
| title | text | 题目标题 | |
| content | text | 题目内容 | |
| options | json | 选项 | [{label:'A',value:'选项1'}] |
| answer | text | 答案 | |
| analysis | text | 解析 | |
| difficulty | tinyint | 难度 | 1-简单 2-中等 3-困难 |
| status | tinyint | 状态 | 0-禁用 1-启用 |
| create_time | datetime | 创建时间 | |
| update_time | datetime | 更新时间 | |

## 7. 章节测试表 (edu_chapter_exam)

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | bigint | 主键 | 自增 |
| chapter_id | bigint | 章节ID | 外键 |
| question_id | bigint | 题目ID | 外键 |
| sort | int | 排序 | |
| create_time | datetime | 创建时间 | |

## 8. 学习进度表 (edu_user_progress)

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | bigint | 主键 | 自增 |
| user_id | bigint | 用户ID | 外键 |
| chapter_id | bigint | 章节ID | 外键 |
| video_progress | int | 视频进度 | 秒 |
| video_completed | tinyint | 视频是否完成 | 0-未完成 1-完成 |
| exam_completed | tinyint | 测试是否完成 | 0-未完成 1-完成 |
| exam_score | int | 测试分数 | |
| completed | tinyint | 章节是否完成 | 0-未完成 1-完成 |
| create_time | datetime | 创建时间 | |
| update_time | datetime | 更新时间 | |

## 9. 答题记录表 (edu_answer_record)

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | bigint | 主键 | 自增 |
| user_id | bigint | 用户ID | 外键 |
| chapter_id | bigint | 章节ID | 外键 |
| question_id | bigint | 题目ID | 外键 |
| user_answer | text | 用户答案 | |
| is_correct | tinyint | 是否正确 | 0-错误 1-正确 |
| ai_help_count | int | AI帮助次数 | |
| create_time | datetime | 创建时间 | |
| update_time | datetime | 更新时间 | |

## 10. AI对话记录表 (edu_ai_conversation)

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | bigint | 主键 | 自增 |
| user_id | bigint | 用户ID | 外键 |
| chapter_id | bigint | 章节ID | 可选 |
| question_id | bigint | 题目ID | 可选 |
| role | varchar(20) | 角色 | user/assistant |
| content | text | 对话内容 | |
| image_url | varchar(500) | 图片URL | OCR场景 |
| create_time | datetime | 创建时间 | |

## 11. AI提示词配置表 (edu_ai_prompt)

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | bigint | 主键 | 自增 |
| name | varchar(100) | 配置名称 | |
| type | varchar(50) | 类型 | chat-助教 exam-测试 |
| prompt | text | 提示词内容 | |
| status | tinyint | 状态 | 0-禁用 1-启用 |
| create_time | datetime | 创建时间 | |
| update_time | datetime | 更新时间 | |

## 12. 用户表扩展 (base_sys_user)

需要在现有用户表中添加字段：

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| is_demo | tinyint | 是否演示账号 | 0-否 1-是 |
| email_verified | tinyint | 邮箱是否验证 | 0-未验证 1-已验证 |

## 索引设计

```sql
-- 章节表
CREATE INDEX idx_sort ON edu_chapter(sort);
CREATE INDEX idx_status ON edu_chapter(status);

-- 视频表
CREATE INDEX idx_chapter_id ON edu_video(chapter_id);

-- 视频标记表
CREATE INDEX idx_video_id ON edu_video_marker(video_id);
CREATE INDEX idx_video_sort ON edu_video_marker(video_id, sort);

-- 课件表
CREATE INDEX idx_chapter_id ON edu_courseware(chapter_id);

-- 题目表
CREATE INDEX idx_category_id ON edu_question(category_id);
CREATE INDEX idx_type ON edu_question(type);

-- 章节测试表
CREATE INDEX idx_chapter_id ON edu_chapter_exam(chapter_id);
CREATE INDEX idx_chapter_sort ON edu_chapter_exam(chapter_id, sort);

-- 学习进度表
CREATE INDEX idx_user_id ON edu_user_progress(user_id);
CREATE INDEX idx_user_chapter ON edu_user_progress(user_id, chapter_id);

-- 答题记录表
CREATE INDEX idx_user_id ON edu_answer_record(user_id);
CREATE INDEX idx_user_chapter ON edu_answer_record(user_id, chapter_id);

-- AI对话记录表
CREATE INDEX idx_user_id ON edu_ai_conversation(user_id);
CREATE INDEX idx_create_time ON edu_ai_conversation(create_time);
```
