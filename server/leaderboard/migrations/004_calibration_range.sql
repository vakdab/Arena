-- Arena Lab calibration range: 12 targets, 90 second session, hit score only.
-- Keep this board immutable; new scoring rules require a new board id.
INSERT INTO game_lb_boards
(namespace,id,rules_version,direction,min_score,max_score,min_duration_ms,max_duration_ms,`open`)
VALUES
('production','score-v1','v1','desc',0,1200,1000,180000,TRUE)
ON DUPLICATE KEY UPDATE
  rules_version=VALUES(rules_version),
  direction=VALUES(direction),
  min_score=VALUES(min_score),
  max_score=VALUES(max_score),
  min_duration_ms=VALUES(min_duration_ms),
  max_duration_ms=VALUES(max_duration_ms),
  `open`=VALUES(`open`);
