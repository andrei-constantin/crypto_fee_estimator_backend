require('dotenv').config();
const postRequest = require('./post.js');
const BigNumber = require('bignumber.js');

const MULTI = BigNumber(100000000);

const knex = require('knex')({
  client: 'pg',
  connection: {
    host : process.env.DB_HOST,
    user : process.env.DB_USER,
    password : process.env.DB_PASSWORD,
    database : process.env.DATABASE
  },
  searchPath: ['public'],
  pool: { min: 1, max: 2 }
});

const fee_calc = (coins,bytes) => {
  let sat = coins * MULTI;
  let fee = sat/bytes;
  return fee.toFixed(2);
}

const get_coins = async () => {
  const coin_info = await knex.from('currencies')
    .select ('coin_name','subdivision_name','decimals', 'approx_block_time', 'ticker','coin_id')
    .orderBy('coin_id')
  return coin_info;
}

const epoch_to_date = (epoch_TS) => {
  var mili = epoch_TS + '000';
  return(new Date(parseInt(mili)));
}

const date_now = () => {
  var now = Date.now();
  return(new Date(parseInt(now)));
}

const upsert_new_txs = async (element , ID) => {
  const tx_hash = element['wtxid'];
  const bytes_size = element['size'];
  const fee = fee_calc(element['modifiedfee'],element['size']);
  const TS_seen = epoch_to_date(element['time']);
  const height = element['height'];
  const active = true;
  const coin_ID = ID;
  const resp = await knex.raw(
    `INSERT INTO mempool_aggregator (tx_hash, bytes_size, fee, ts_seen, height_seen, active,coin_ID)
    VALUES
    (:tx_hash, :bytes_size, :fee, :TS_seen, :height, :active , :coin_ID)
    ON CONFLICT(tx_hash)
      DO
      UPDATE
      SET fee = :fee  `,
      {tx_hash, bytes_size, fee, TS_seen, height, active, coin_ID, fee}
  )
}

const get_mempool = async (coin) => {
  //getting the mempool from the installed node;
  const body = {jsonrpc:"2.0",id:"jsonrpc",method:"getrawmempool",params:[true]};
  let res = [];
  let mempool = await postRequest(body,coin)
    /*.catch( err => {
      console.error(`error post request `, err)
    });*/
  mempool = mempool['result'];
  res.push(mempool);
  let keys =  Object.keys(mempool);
  res.push(keys);
  return res;
}

const on_new_block =  async (txs_confirmed, coin_id, block_id) => {
  const res = await knex('mempool_aggregator')
    .whereIn('tx_hash',txs_confirmed )
    .where({ 'coin_id': coin_id })
    .update({ 'block_id': block_id ,'active' : 'false'})
}

const update_mempool = async () => {
  while (true){
  const coins = await get_coins();
  const coin = coins[0];
  let [mempool, keys] = await get_mempool( coin['ticker'] );
  //keys = uniq(keys);
  //console.log('this is keys',keys);
  for (i = 0; i < keys.length; i++){
    let key = keys[i];
    const res = await upsert_new_txs(mempool[key], coin['coin_id'])
      .catch( err => {
        console.error(`error inserting `, key,err.message)
      });
    console.log('i:', i);
  }
  console.log('----------------------------')
}

/*  coins.forEach( async ( coin ) => {
    let [mempool, keys] = await get_mempool( coin['ticker'] );
    keys.forEach (async function(key){
      const res = await upsert_new_txs(mempool[key], coin['coin_id'])
        .catch( err => {
          console.error(`error inserting `, key,err.message)
        });
  })*/
}

const check_new_block = async ( coin ) => {
  console.log(`checking new block`);
  const coins = await get_coins();
  coins.forEach( async ( coin ) => {
    const coin_id = parseInt(coin['coin_id']);
    const body_height = {jsonrpc:"2.0",id:"jsonrpc",method:"getblockcount"};
    const res_height = await postRequest(body_height,coin['ticker'])
      .catch( err => {
        console.error(`error getting the height of the blockchain `,err.message)
      });
    const block_height = res_height['result'];
    const last_block = await knex.from('blocks')
      .select ('block_height')
      .where({'coin_id': coin['coin_id']})
      .orderBy('block_height','desc')
      .limit(1)
    if( !last_block[0] || block_height > last_block[0]['block_height'] ){
      const body_hash = {jsonrpc:"1.0",id:"jsonrpc",method:"getblockhash", params:[ parseInt(block_height)]};
      const res_hash = await postRequest(body_hash,coin['ticker'])
        .catch( err => {
          console.error(`error getting the hash of the blockchain `,err.message )
        });
      const block_hash = res_hash['result'];
      const resp = await knex('blocks')
        .insert({ 'coin_id': coin_id, 'block_height':block_height, 'block_hash':block_hash ,'ts_seen':date_now()})
        .returning(["block_id"])
      const block_id = resp[0]['block_id'];
      const body_block = {jsonrpc:"2.0",id:"jsonrpc",method:"getblock", params:[ block_hash ]};
      const res_block = await postRequest(body_block,coin['ticker'])
        .catch( err => {
          console.error(`error getting the height of the blockchain `,err.message)
        });
      const txs_confirmed = res_block['result']['tx'];
      let res_update = await on_new_block(txs_confirmed , coin_id, block_id);
    }
  })
}

const clean_futile_entries = async () => {
  const resp = await knex('mempool_aggregator')
    .whereNull('block_id')
    .del()
}

update_mempool();
//setInterval(update_mempool,10000);
setInterval(check_new_block,10000);
setInterval(clean_futile_entries,600000);
