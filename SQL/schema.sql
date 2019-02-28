CREATE TABLE public.blocks
(
  coin_id smallint,
  block_height integer,
  block_hash text NOT NULL,
  ts_seen timestamp with time zone,
  block_id integer NOT NULL DEFAULT nextval('block_id_sequence'::regclass),
  CONSTRAINT block_hash UNIQUE (block_hash)
)
WITH (
  OIDS=TRUE
);

CREATE TABLE public.currencies
(
  coin_name text,
  coin_id smallint NOT NULL,
  subdivision_name text,
  decimals smallint NOT NULL,
  ticker text,
  approx_block_time smallint,
  CONSTRAINT "coin_ID" PRIMARY KEY (coin_id)
)
WITH (
  OIDS=TRUE
);

CREATE TABLE public.mempool_aggregator
(
  tx_hash text NOT NULL,
  bytes_size integer,
  fee real, -- sat/byte
  ts_seen timestamp with time zone,
  height_seen integer,
  active boolean,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  coin_id smallint,
  block_id integer,
  id_tx bigint NOT NULL DEFAULT nextval('tx_id_sequence'::regclass),
  CONSTRAINT tx_hash UNIQUE (tx_hash)
)
WITH (
  OIDS=TRUE
);

INSERT INTO currencies (coin_name, coin_id,subdivision_name,decimals,ticker,approx_block_time)
  VALUES ('Litecoin',1,'sat_g',8,'LTC',150)
