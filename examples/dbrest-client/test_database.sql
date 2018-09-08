--
-- PostgreSQL database dump
--

-- Dumped from database version 10.3
-- Dumped by pg_dump version 10.3

-- Started on 2018-09-07 22:29:23 -03

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
-- TOC entry 2195 (class 0 OID 0)
-- Dependencies: 2194
-- Name: DATABASE postgres; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON DATABASE postgres IS 'default administrative connection database';


--
-- TOC entry 1 (class 3079 OID 12283)
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- TOC entry 2197 (class 0 OID 0)
-- Dependencies: 1
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET default_tablespace = '';

SET default_with_oids = false;

--
-- TOC entry 198 (class 1259 OID 16410)
-- Name: member; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.member (
    id integer NOT NULL,
    name character varying(256) NOT NULL
);


ALTER TABLE public.member OWNER TO postgres;

--
-- TOC entry 199 (class 1259 OID 16415)
-- Name: pk_member; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pk_member
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.pk_member OWNER TO postgres;

--
-- TOC entry 2198 (class 0 OID 0)
-- Dependencies: 199
-- Name: pk_member; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pk_member OWNED BY public.member.id;


--
-- TOC entry 196 (class 1259 OID 16393)
-- Name: project; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project (
    id integer NOT NULL,
    name character varying(256) NOT NULL,
    description text
);


ALTER TABLE public.project OWNER TO postgres;

--
-- TOC entry 197 (class 1259 OID 16401)
-- Name: pk_project; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pk_project
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.pk_project OWNER TO postgres;

--
-- TOC entry 2199 (class 0 OID 0)
-- Dependencies: 197
-- Name: pk_project; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pk_project OWNED BY public.project.id;


--
-- TOC entry 202 (class 1259 OID 16426)
-- Name: rule; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rule (
    id integer NOT NULL,
    name character varying(256) NOT NULL
);


ALTER TABLE public.rule OWNER TO postgres;

--
-- TOC entry 203 (class 1259 OID 16431)
-- Name: pk_rule; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pk_rule
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.pk_rule OWNER TO postgres;

--
-- TOC entry 2200 (class 0 OID 0)
-- Dependencies: 203
-- Name: pk_rule; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pk_rule OWNED BY public.rule.id;


--
-- TOC entry 204 (class 1259 OID 16434)
-- Name: sprint; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sprint (
    id integer NOT NULL,
    name character varying(256) NOT NULL,
    startdate timestamp with time zone NOT NULL,
    enddate timestamp with time zone NOT NULL,
    project integer NOT NULL
);


ALTER TABLE public.sprint OWNER TO postgres;

--
-- TOC entry 205 (class 1259 OID 16439)
-- Name: pk_sprint; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pk_sprint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.pk_sprint OWNER TO postgres;

--
-- TOC entry 2201 (class 0 OID 0)
-- Dependencies: 205
-- Name: pk_sprint; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pk_sprint OWNED BY public.sprint.id;


--
-- TOC entry 200 (class 1259 OID 16418)
-- Name: team; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.team (
    id integer NOT NULL,
    project integer NOT NULL,
    member integer NOT NULL,
    rule integer NOT NULL
);


ALTER TABLE public.team OWNER TO postgres;

--
-- TOC entry 201 (class 1259 OID 16423)
-- Name: pk_team; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pk_team
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.pk_team OWNER TO postgres;

--
-- TOC entry 2202 (class 0 OID 0)
-- Dependencies: 201
-- Name: pk_team; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pk_team OWNED BY public.team.id;


--
-- TOC entry 2054 (class 2604 OID 16417)
-- Name: member id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member ALTER COLUMN id SET DEFAULT nextval('public.pk_member'::regclass);


--
-- TOC entry 2053 (class 2604 OID 16403)
-- Name: project id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project ALTER COLUMN id SET DEFAULT nextval('public.pk_project'::regclass);


--
-- TOC entry 2056 (class 2604 OID 16433)
-- Name: rule id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rule ALTER COLUMN id SET DEFAULT nextval('public.pk_rule'::regclass);


--
-- TOC entry 2057 (class 2604 OID 16441)
-- Name: sprint id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sprint ALTER COLUMN id SET DEFAULT nextval('public.pk_sprint'::regclass);


--
-- TOC entry 2055 (class 2604 OID 16425)
-- Name: team id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team ALTER COLUMN id SET DEFAULT nextval('public.pk_team'::regclass);


--
-- TOC entry 2061 (class 2606 OID 16414)
-- Name: member member_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member
    ADD CONSTRAINT member_pkey PRIMARY KEY (id);


--
-- TOC entry 2059 (class 2606 OID 16400)
-- Name: project projeto_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project
    ADD CONSTRAINT projeto_pkey PRIMARY KEY (id);


--
-- TOC entry 2065 (class 2606 OID 16430)
-- Name: rule rule_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rule
    ADD CONSTRAINT rule_pkey PRIMARY KEY (id);


--
-- TOC entry 2067 (class 2606 OID 16438)
-- Name: sprint sprint_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sprint
    ADD CONSTRAINT sprint_pkey PRIMARY KEY (id);


--
-- TOC entry 2063 (class 2606 OID 16422)
-- Name: team team_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team
    ADD CONSTRAINT team_pkey PRIMARY KEY (id);


-- Completed on 2018-09-07 22:29:24 -03

--
-- PostgreSQL database dump complete
--

