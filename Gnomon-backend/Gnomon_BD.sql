--
-- PostgreSQL database cluster dump
--

-- Started on 2025-10-21 18:12:32

\restrict 43IjaVPDhgQFRrulf2i4LtR2P2zfPYhgqLcc0Jd0uBfLdnKTBfGqAkyElIacfHU

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Roles
--

CREATE ROLE "gnomon";
ALTER ROLE "gnomon" WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:BhdLkZGfIgODqE0bCO+c7A==$6jNr6FkDAW3I+Xh7yfjbj++2cNgoof5VJA9hl6JBVdk=:Ug4f4wp5+6ZOHAwxQb4lXXY3L86MGxF5jH2aOu9amHs=';

--
-- User Configurations
--








\unrestrict 43IjaVPDhgQFRrulf2i4LtR2P2zfPYhgqLcc0Jd0uBfLdnKTBfGqAkyElIacfHU

-- Completed on 2025-10-21 18:12:32

--
-- PostgreSQL database cluster dump complete
--

