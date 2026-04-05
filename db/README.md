# 문제 1: 테이블 생성하기 (CREATE TABLE)

SELECT DISTINCT `crew_id`, `nickname`, FROM `attendance`

CREATE TABLE `crew` (
  `crew_id` INT NOT NULL AUTO_INCREMENT,
  `nickname` VARCHAR(50) NOT NULL,
  PRIMARY KEY (crew_id)
);

INSERT INTO crew (crew_id, nickname)
SELECT DISTINCT crew_id, nickname FROM attendance;


# 문제 2: 테이블 컬럼 삭제하기 (ALTER TABLE)
ALTER TABLE `attendance` DROP COLUMN `nickname`;


# 문제 3: 외래 키 제약조건 추가하기 (ALTER TABLE)
ALTER TABLE `attendance`
ADD CONSTRAINT `fk_attendance_crew`
FOREIGN KEY (crew_id)
REFERENCES crew(crew_id);


# 문제 4: 유니크 키 설정
ALTER TABLE `crew`
ADD CONSTRAINT `uq_crew_nickname` UNIQUE (nickname);

# DML(CRUD) 실습
# 문제 5: 크루 닉네임 검색하기 (LIKE)
SELECT * FROM `crew`
WHERE nickname LIKE '디%';

# 문제 6: 출석 기록 확인하기 (SELECT + WHERE)
SELECT * FROM `attendance`
WHERE `crew_id` (
    SELECT `crew_id`
    FROM `crew`
    WHERE `nickname` = '어셔'
)
AND `attendance_date` = '2025-03-06';

# 문제 7: 누락된 출석 기록 추가 (INSERT)
INSERT INTO `attendance` (crew_id, attendance_date, start_time, end_time)
SELECT `crew_id`, '2025-03-06', '09:31', '18:01'
FROM `crew`
WHERE `nickname` = '어셔';

# 문제 8: 잘못된 출석 기록 수정 (UPDATE)
UPDATE attendance AS a
JOIN crew AS c ON a.crew_id = c.crew_id
SET a.start_time = '10:00'
WHERE c.nickname = '주니' AND a.attendance_date = '2025-03-12';

# 문제 9:  허위 출석 기록 삭제 (DELETE)
DELETE FROM `attendance`
WHERE `crew_id` IN (
  SELECT `crew_id` FROM `crew`
  WHERE `nickname` = '아론'
) AND `attendance_date` = '2025-03-12';

# 문제 10: 출석 정보 조회하기 (JOIN)
SELECT c.`nickname`, a.`attendance_date`, a.`start_time`, a.`end_time` 
FROM `attendance` AS a
JOIN `crew` AS c ON a.crew_id = c.crew_id

# 문제 11: nickname으로 쿼리 처리하기 (서브 쿼리)
SELECT * FROM `attendance`
WHERE `crew_id` IN (
    SELECT `crew_id`
    FROM `crew`
    WHERE `nickname` = '검프'
);

# 문제 12: 가장 늦게 하교한 크루 찾기
SELECT `nickname`, `end_time`
FROM `attendance`
WHERE `attendance_date` = '2025-03-05'
ORDER BY `end_time` DESC

# 문제 13: 크루별로 '기록된' 날짜 수 조회
SELECT c.`nickname`, COUNT(*) AS `recorded_days`
FROM `attendance` AS a
JOIN `crew` AS c ON a.`crew_id` = c.`crew_id`
GROUP BY a.`crew_id`, c.`nickname`;

# 문제 14: 크루별로 등교 기록이 있는(start_time IS NOT NULL) 날짜 수 조회
SELECT c.`nickname`, COUNT(*) AS `attended_days`
FROM `attendance` AS a
JOIN `crew` AS c ON a.`crew_id` = c.`crew_id`
WHERE a.`start_time` IS NOT NULL
GROUP BY a.`crew_id`, c.`nickname`;

# 문제 15: 날짜별로 등교한 크루 수 조회
SELECT a.`attendance_date`, COUNT(*) AS `crew_count`
FROM `attendance` AS a
WHERE a.`start_time` IS NOT NULL
GROUP BY a.`attendance_date`;

# 문제 16: 크루별 가장 빠른 등교 시각(MIN)과 가장 늦은 등교 시각(MAX)
SELECT c.`nickname`,
       MIN(a.`start_time`) AS `earliest_start_time`,
       MAX(a.`start_time`) AS `latest_start_time`
FROM `attendance` AS a
JOIN `crew` AS c ON a.`crew_id` = c.`crew_id`
GROUP BY a.`crew_id`, c.`nickname`;