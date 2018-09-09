--
-- PostgreSQL database dump
--

-- Dumped from database version 10.3
-- Dumped by pg_dump version 10.3

-- Started on 2018-09-08 11:14:57 -03

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2158 (class 1262 OID 16442)
-- Name: dbrest; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE dbrest WITH TEMPLATE = template0 ENCODING = 'UTF8' LC_COLLATE = 'en_US.utf8' LC_CTYPE = 'en_US.utf8';


ALTER DATABASE dbrest OWNER TO postgres;

\connect dbrest

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 1 (class 3079 OID 12283)
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- TOC entry 2160 (class 0 OID 0)
-- Dependencies: 1
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET default_tablespace = '';

SET default_with_oids = false;

--
-- TOC entry 196 (class 1259 OID 16443)
-- Name: dbrest; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dbrest (
    col_bigint bigint,
    col_bit bit(1),
    col_boolean boolean,
    col_character character(1),
    col_character_varying character varying,
    col_date date,
    col_double_precision double precision,
    col_integer integer NOT NULL,
    col_money money,
    col_numeric numeric,
    col_real real,
    col_smallint smallint,
    col_text text,
    col_time_with_time_zone time with time zone,
    col_timestamp_with_time_zone timestamp with time zone
);


ALTER TABLE public.dbrest OWNER TO postgres;

--
-- TOC entry 197 (class 1259 OID 16451)
-- Name: pk_dbrest; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pk_dbrest
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.pk_dbrest OWNER TO postgres;

--
-- TOC entry 2161 (class 0 OID 0)
-- Dependencies: 197
-- Name: pk_dbrest; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pk_dbrest OWNED BY public.dbrest.col_integer;


--
-- TOC entry 2029 (class 2604 OID 16453)
-- Name: dbrest col_integer; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dbrest ALTER COLUMN col_integer SET DEFAULT nextval('public.pk_dbrest'::regclass);


--
-- TOC entry 2031 (class 2606 OID 16450)
-- Name: dbrest DBRest_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dbrest
    ADD CONSTRAINT "DBRest_pkey" PRIMARY KEY (col_integer);


-- Completed on 2018-09-08 11:14:57 -03

--
-- PostgreSQL database dump complete
--

