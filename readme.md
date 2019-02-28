# Backend for crypto fee estimator app

### Prerequisites

Create the DB structure using **schema.sql**;
Install a LTC node (Download from [Litecoin homepage](https://litecoin.org/));
Run the node with rpc calls activated;

### Installation

Crypto fee estimator backend requires [Node.js](https://nodejs.org/) v8+ to run.

Make sure the prerequisites are installed and the node is running

```sh
$ git clone crypto_fee_estimator_backend
$ cd crypto_fee_estimator_backend
$ npm install
```

Edit the **.env** (check the **.env-sample**);

Run the ticker

```sh
$ node index.js
```

The app should start upserting transactions from mempool into the **mempool_aggregator** table

### Todos

 - Add more coins
 - Implement bash queries for upsert

License
----

MIT


**Free Software, Hell Yeah!**

Powered by [BoringTechnologies](https://www.boringtechnologies.com/).
Thank you [Dillinger](https://dillinger.io/) for this MD.
