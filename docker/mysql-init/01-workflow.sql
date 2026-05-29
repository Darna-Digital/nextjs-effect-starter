-- The Workflow SDK's MySQL world (`@fantasticfour/world-mysql`) stores its
-- durable state in a separate `workflow` schema. The app connects as the `dev`
-- user, which only owns `learning_effect` by default, so we create the schema
-- and grant access here.
--
-- This runs automatically on a FRESH MySQL volume (docker-entrypoint-initdb.d).
-- For an already-initialised container, run the equivalent once as root — see
-- the `world:setup` flow in package.json / AGENTS.
CREATE DATABASE IF NOT EXISTS `workflow`;
GRANT ALL PRIVILEGES ON `workflow`.* TO 'dev'@'%';
FLUSH PRIVILEGES;
